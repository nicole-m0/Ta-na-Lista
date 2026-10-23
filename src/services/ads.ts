// Only Google demo inventory; never receives shopping data.
export const adsConfig = {
  enabled: true,
  androidBannerId: 'ca-app-pub-3940256099942544/9214589741',
  requestOptions: { requestNonPersonalizedAdsOnly: true },
} as const;

export function adsEnabled(enabled: boolean, premium: boolean, development: boolean, platform: string) {
  return enabled && !premium && development && platform === 'android';
}
export interface ConsentInfo { canRequestAds: boolean; privacyOptionsRequirementStatus: string }
export interface AdsAdapter {
  gatherConsent(): Promise<ConsentInfo>;
  showPrivacyOptionsForm(): Promise<ConsentInfo>;
  initialize(): Promise<unknown>;
}
export interface AdsState { ready: boolean; privacyRequired: boolean; busy: boolean; failed: boolean }
export const initialAdsState: AdsState = { ready: false, privacyRequired: false, busy: false, failed: false };
export type AdsFailurePhase = 'consent' | 'privacy' | 'initialize';

export function createAdsController(adapter: AdsAdapter, changed: (state: AdsState) => void, failed?: (phase: AdsFailurePhase) => void) {
  let state = initialAdsState;
  let pending: Promise<void> | undefined;
  let initialized = false;
  let allowed = true;
  const publish = (next: AdsState) => { state = next; changed(state); };
  function run(privacy: boolean) {
    if (pending || !allowed) return pending ?? Promise.resolve();
    publish({ ...state, ready: false, busy: true, failed: false });
    pending = (async () => {
      let phase: AdsFailurePhase = privacy ? 'privacy' : 'consent';
      try {
        const info = await (privacy ? adapter.showPrivacyOptionsForm() : adapter.gatherConsent());
        if (!info || typeof info.canRequestAds !== 'boolean' || !['REQUIRED', 'NOT_REQUIRED', 'UNKNOWN'].includes(info.privacyOptionsRequirementStatus)) throw new Error('Invalid consent response');
        const privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
        // Keep the required review entry point even if SDK initialization fails.
        publish({ ...state, privacyRequired });
        if (info.canRequestAds && allowed && !initialized) {
          phase = 'initialize';
          await adapter.initialize(); initialized = true;
        }
        publish({ ready: allowed && info.canRequestAds && initialized, privacyRequired, busy: false, failed: false });
      } catch {
        // Fail closed, no cached consent or raw SDK identifiers in logs.
        publish({ ...state, ready: false, busy: false, failed: true });
        failed?.(phase);
      }
    })().finally(() => { pending = undefined; });
    return pending;
  }
  return {
    start: () => run(false),
    review: () => state.privacyRequired ? run(true) : Promise.resolve(),
    disable: () => { allowed = false; publish({ ...state, ready: false }); },
  };
}
