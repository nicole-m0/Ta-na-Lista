import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adsEnabled, createAdsController } from '../src/services/ads.ts';
import type { AdsAdapter, AdsFailurePhase, AdsState, ConsentInfo } from '../src/services/ads.ts';

const approved: ConsentInfo = { canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' };
test('repeated privacy review and retry share pending work and keep ads hidden until permission returns', async () => {
  let state: AdsState | undefined; let resolve!: (info: ConsentInfo) => void;
  let gathers = 0; let reviews = 0; let initializes = 0;
  const controller = createAdsController({
    gatherConsent: async () => { gathers++; return approved; },
    showPrivacyOptionsForm: () => { reviews++; return new Promise(r => { resolve = r; }); },
    initialize: async () => { initializes++; },
  }, next => { state = next; });
  await controller.start();
  const first = controller.review(); const second = controller.review(); const retry = controller.start();
  assert.equal(state?.ready, false); assert.equal(state?.busy, true); assert.equal(reviews, 1);
  resolve({ ...approved, canRequestAds: false }); await Promise.all([first, second, retry]);
  assert.equal(state?.ready, false); assert.equal(state?.busy, false);
  assert.equal(gathers, 1); assert.equal(initializes, 1);
  await controller.start(); assert.equal(state?.ready, true); assert.equal(initializes, 1);
});

test('disabling while SDK initializes never enables late ad requests', async () => {
  let release!: () => void; let started!: () => void; let state: AdsState | undefined;
  const initializing = new Promise<void>(resolve => { started = resolve; });
  const controller = createAdsController({
    gatherConsent: async () => approved, showPrivacyOptionsForm: async () => approved,
    initialize: () => { started(); return new Promise<void>(resolve => { release = resolve; }); },
  }, next => { state = next; });
  const pending = controller.start(); await initializing; controller.disable(); release(); await pending;
  await controller.start(); assert.equal(state?.ready, false); assert.equal(state?.busy, false);
});

test('synchronous SDK failure is contained and diagnostic receives only a fixed phase', async () => {
  let state: AdsState | undefined; const phases: string[] = [];
  const controller = createAdsController({
    gatherConsent: () => { throw Error('private device payload'); },
    showPrivacyOptionsForm: async () => approved, initialize: async () => assert.fail('no permission'),
  }, next => { state = next; }, phase => phases.push(phase));
  await controller.start(); await controller.start();
  assert.equal(state?.ready, false); assert.equal(state?.busy, false);
  assert.deepEqual(phases, ['consent', 'consent']);
});
test('required privacy review survives initialization failure and can revoke requests', async () => {
  let state: AdsState | undefined; let reviews = 0;
  const controller = createAdsController({
    gatherConsent: async () => approved,
    initialize: async () => { throw Error('initialize failed'); },
    showPrivacyOptionsForm: async () => { reviews++; return { ...approved, canRequestAds: false }; },
  }, next => { state = next; });
  await controller.start();
  assert.equal(state?.privacyRequired, true); assert.equal(state?.ready, false);
  await controller.review(); assert.equal(reviews, 1); assert.equal(state?.ready, false);
});

test('malformed consent never initializes ads and valid NOT_REQUIRED uses SDK permission', async () => {
  for (const info of [null, { canRequestAds: 'true', privacyOptionsRequirementStatus: 'REQUIRED' }, { canRequestAds: true, privacyOptionsRequirementStatus: 'invalid' }]) {
    let state: AdsState | undefined;
    const controller = createAdsController({ gatherConsent: async () => info as never, showPrivacyOptionsForm: async () => approved, initialize: async () => assert.fail('invalid permission') }, next => { state = next; });
    await controller.start(); assert.equal(state?.ready, false); assert.equal(state?.failed, true);
  }
  let state: AdsState | undefined;
  const controller = createAdsController({ gatherConsent: async () => ({ canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }), showPrivacyOptionsForm: async () => approved, initialize: async () => {} }, next => { state = next; });
  await controller.start(); assert.equal(state?.ready, true); assert.equal(state?.privacyRequired, false);
});
test('switch, future premium, platform and production gate ads', () => {
  assert.equal(adsEnabled(true, false, true, 'android'), true);
  for (const values of [[false, false, true, 'android'], [true, true, true, 'android'], [true, false, false, 'android'], [true, false, true, 'web'], [true, false, true, 'ios']] as const) {
    assert.equal(adsEnabled(...values), false);
  }
});

test('consent finishes before initialization; concurrent starts initialize once', async () => {
  let resolve!: (info: ConsentInfo) => void;
  const calls: string[] = []; const states: AdsState[] = [];
  const adapter: AdsAdapter = {
    gatherConsent: () => { calls.push('consent'); return new Promise(r => { resolve = r; }); },
    showPrivacyOptionsForm: async () => approved,
    initialize: async () => { calls.push('initialize'); },
  };
  const controller = createAdsController(adapter, s => states.push(s));
  const first = controller.start(); const second = controller.start();
  assert.deepEqual(calls, ['consent']); assert.equal(states.at(-1)?.ready, false);
  resolve(approved); await Promise.all([first, second]);
  assert.deepEqual(calls, ['consent', 'initialize']); assert.equal(states.at(-1)?.ready, true);
  await controller.review(); assert.equal(calls.filter(c => c === 'initialize').length, 1);
});

test('denial and offline failures never initialize or authorize an ad; retry can recover', async () => {
  let mode = 'offline'; let initialized = 0; let state: AdsState | undefined;
  const controller = createAdsController({
    gatherConsent: async () => { if (mode === 'offline') throw Error('network'); return { ...approved, canRequestAds: mode === 'approved' }; },
    showPrivacyOptionsForm: async () => ({ ...approved, canRequestAds: false }),
    initialize: async () => { initialized++; },
  }, s => { state = s; });
  await controller.start(); assert.equal(state?.failed, true); assert.equal(state?.ready, false);
  mode = 'denied'; await controller.start(); assert.equal(initialized, 0); assert.equal(state?.ready, false);
  mode = 'approved'; await controller.start(); assert.equal(initialized, 1); assert.equal(state?.ready, true);
  await controller.review(); assert.equal(state?.ready, false);
});

test('disable during consent prevents late initialization and requests', async () => {
  let resolve!: (info: ConsentInfo) => void; let initialized = 0; let state: AdsState | undefined;
  const controller = createAdsController({
    gatherConsent: () => new Promise(r => { resolve = r; }),
    showPrivacyOptionsForm: async () => approved,
    initialize: async () => { initialized++; },
  }, s => { state = s; });
  const pending = controller.start(); controller.disable(); resolve(approved); await pending;
  await controller.start(); assert.equal(initialized, 0); assert.equal(state?.ready, false);
});

test('initialization or privacy failure closes the banner gate', async () => {
  let failInit = true; let state: AdsState | undefined;
  const controller = createAdsController({
    gatherConsent: async () => approved,
    showPrivacyOptionsForm: async () => { throw Error('offline'); },
    initialize: async () => { if (failInit) throw Error('SDK'); },
  }, s => { state = s; });
  await controller.start(); assert.equal(state?.ready, false); assert.equal(state?.failed, true);
  failInit = false; await controller.start(); assert.equal(state?.ready, true);
  await controller.review(); assert.equal(state?.ready, false); assert.equal(state?.privacyRequired, true);
});

test('diagnostics distinguish consent, initialization and privacy failures without exposing SDK errors', async () => {
  let phase: AdsFailurePhase = 'consent';
  const reported: AdsFailurePhase[] = [];
  const controller = createAdsController({
    gatherConsent: async () => { if (phase === 'consent') throw Error('private payload'); return approved; },
    initialize: async () => { if (phase === 'initialize') throw Error('private payload'); },
    showPrivacyOptionsForm: async () => { throw Error('private payload'); },
  }, () => {}, value => reported.push(value));
  await controller.start();
  phase = 'initialize'; await controller.start();
  phase = 'privacy'; await controller.start(); await controller.review();
  assert.deepEqual(reported, ['consent', 'initialize', 'privacy']);
});
