import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adsEnabled, createAdsController } from '../src/services/ads.ts';
import type { AdsAdapter, AdsState, ConsentInfo } from '../src/services/ads.ts';

const approved: ConsentInfo = { canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' };
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
