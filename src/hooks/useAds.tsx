import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { adsConfig, adsEnabled, createAdsController, initialAdsState } from '../services/ads';
import type { AdsState } from '../services/ads';

type AdsSDK = typeof import('react-native-google-mobile-ads');
const Context = createContext({ ...initialAdsState, sdk: undefined as AdsSDK | undefined, retry: () => {}, review: () => {} });

export function AdsProvider({ children, premium = false }: { children: React.ReactNode; premium?: boolean }) {
  const [state, setState] = useState<AdsState>(initialAdsState);
  const [sdk, setSdk] = useState<AdsSDK>();
  const [controller, setController] = useState<ReturnType<typeof createAdsController>>();
  const enabled = adsEnabled(adsConfig.enabled, premium, __DEV__, Platform.OS);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let current: ReturnType<typeof createAdsController> | undefined;
    async function load() {
      try {
        // Lazy import keeps web and builds without the native module usable.
        const native = await import('react-native-google-mobile-ads');
        if (!active) return;
        setSdk(native);
        current = createAdsController({
          gatherConsent: () => native.AdsConsent.gatherConsent(),
          showPrivacyOptionsForm: () => native.AdsConsent.showPrivacyOptionsForm(),
          initialize: async () => {
            await native.default().setRequestConfiguration({ maxAdContentRating: native.MaxAdContentRating.G });
            await native.default().initialize();
          },
        }, next => { if (active) setState(next); });
        setController(current);
        void current.start();
      } catch { if (active) setState({ ...initialAdsState, failed: true }); }
    }
    void load();
    return () => { current?.disable(); active = false; };
  }, [enabled]);
  return <Context.Provider value={{ ...state, ready: enabled && state.ready, sdk, retry: () => { void controller?.start(); }, review: () => { void controller?.review(); } }}>{children}</Context.Provider>;
}
export function useAds() { return useContext(Context); }
