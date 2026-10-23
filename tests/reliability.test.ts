import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeDatabase } from '../src/db/initialize.ts';
import { createOperationGate } from '../src/services/operation.ts';

test('failed or cancelled initialization closes only unpublished connections', async () => {
  let closed = 0; let published = 0; let active = true;
  const open = async () => ({ closeAsync: async () => { closed++; } });
  const publish = () => { published++; };
  await assert.rejects(initializeDatabase(open, async () => { throw Error('integrity'); }, () => active, publish));
  assert.equal(closed, 1); assert.equal(published, 0);
  await initializeDatabase(open, async () => { active = false; }, () => active, publish);
  assert.equal(closed, 2); assert.equal(published, 0);
  await initializeDatabase(open, async () => assert.fail('cancelled before preparation'), () => active, publish);
  assert.equal(closed, 3);
  active = true;
  await initializeDatabase(open, async () => {}, () => active, publish);
  assert.equal(published, 1); assert.equal(closed, 3);
});

test('operation gate ignores repeated taps and unlocks after failure', async () => {
  const run = createOperationGate(); let calls = 0; let release!: () => void;
  const first = run(async () => { calls++; await new Promise<void>(resolve => { release = resolve; }); });
  await run(async () => { calls++; }); assert.equal(calls, 1);
  release(); await first;
  await assert.rejects(run(async () => { throw Error('write failed'); }));
  await run(async () => { calls++; }); assert.equal(calls, 2);
});

test('opening and cleanup failures are returned as rejected promises, never published', async () => {
  await assert.rejects(initializeDatabase(async () => { throw Error('open failed'); }, async () => assert.fail('no connection'), () => true, () => assert.fail('not opened')), /open failed/);
  let closed = 0;
  await assert.rejects(initializeDatabase(async () => ({ closeAsync: async () => { closed++; throw Error('close failed'); } }), async () => {}, () => false, () => assert.fail('cancelled')), /close failed/);
  assert.equal(closed, 1);
});

test('operation gate blocks reentrant submissions and recovers from a synchronous throw', async () => {
  const run = createOperationGate(); let calls = 0;
  await run(async () => { calls++; await run(async () => { calls++; }); });
  assert.equal(calls, 1);
  await assert.rejects(run(() => { throw Error('sync failure'); }));
  await run(async () => { calls++; }); assert.equal(calls, 2);
});
