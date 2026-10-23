import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { adsConfig, adsEnabled, createAdsController, initialAdsState } from '../services/ads';
import type { AdsState } from '../services/ads';

type AdsSDK = typeof import('react-native-google-mobile-ads');
const Context = createContext({ ...initialAdsState, sdk: undefined as AdsSDK | undefined, retry: () => {}, review: () => {} });

export function AdsProvider({ children, premium = false }: { children: React.ReactNode; premium?: boolean }) {
  const [state, setState] = useState<AdsState>(initialAdsState);
  const [sdk, setSdk] = useState<AdsSDK>();
  const controller = useRef<ReturnType<typeof createAdsController> | undefined>(undefined);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const enabled = adsEnabled(adsConfig.enabled, premium, __DEV__, Platform.OS);
  useEffect(() => {
    controller.current = undefined;
    if (!enabled) return;
    let active = true;
    let current: ReturnType<typeof createAdsController> | undefined;
    async function load() {
      try {
        // Resolution happens during import, before UMP or SDK initialization.
        const native = await import('react-native-google-mobile-ads');
        if (!active) return;
        if (__DEV__) console.info('[AdMob] sdk-import: success');
        setSdk(native);
        current = createAdsController({
          gatherConsent: () => native.AdsConsent.gatherConsent(),
          showPrivacyOptionsForm: () => native.AdsConsent.showPrivacyOptionsForm(),
          initialize: async () => {
            await native.default().setRequestConfiguration({ maxAdContentRating: native.MaxAdContentRating.G });
            await native.default().initialize();
          },
        }, next => { if (active) setState(next); }, phase => {
          if (__DEV__ && active) console.warn(`[AdMob] ${phase}: failed`);
        });
        controller.current = current;
        void current.start();
      } catch (error) {
        if (!active) return;
        setState({ ...initialAdsState, failed: true });
        if (__DEV__) {
          const missingNativeModule = error instanceof Error && /RNGoogleMobileAdsModule.*could not be found/.test(error.message);
          // Fixed diagnostic fields only: no consent payloads, device IDs or list data.
          console.warn('[AdMob] sdk-import: failed', {
            reason: missingNativeModule ? 'native-module-unavailable' : 'sdk-import-failed',
            executionEnvironment: Constants.executionEnvironment,
            expoGoConfigPresent: Constants.expoGoConfig != null,
          });
        }
      }
    }
    void load();
    return () => { active = false; current?.disable(); if (controller.current === current) controller.current = undefined; };
  }, [enabled, loadAttempt]);
  return <Context.Provider value={{ ...state, ready: enabled && state.ready, sdk, retry: () => {
    if (state.busy) return;
    if (controller.current) void controller.current.start();
    else {
      setState({ ...initialAdsState, busy: true });
      setLoadAttempt(attempt => attempt + 1);
    }
  }, review: () => { void controller.current?.review(); } }}>{children}</Context.Provider>;
}
export function useAds() { return useContext(Context); }
