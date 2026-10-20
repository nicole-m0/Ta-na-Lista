import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Repository, migrate, parseQuantity, validateProduct } from '../src/db/repository.ts';
import type { Database } from '../src/db/repository.ts';

function adapter(raw: DatabaseSync): Database {
  return {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, ...params) { return raw.prepare(sql).run(...params); },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) { return (raw.prepare(sql).get(...params) ?? null) as T | null; },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) { return raw.prepare(sql).all(...params) as T[]; },
    async withTransactionAsync(task) { raw.exec('BEGIN'); try { await task(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; } },
  };
}
test('CRUD, checklist, duplication, cascade, migrations and persistence after reopening', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tanalista-')); const file = join(dir, 'test.db');
  let raw = new DatabaseSync(file);
  try {
    let db = adapter(raw); await migrate(db); const repo = new Repository(db, randomUUID);
    assert.deepEqual(await repo.lists(), []);
    await assert.rejects(repo.create('   '));
    const id = await repo.create(' Feira '); await repo.rename(id, 'Feira de sábado');
    assert.equal((await repo.lists())[0]?.name, 'Feira de sábado');
    await repo.saveProduct(id, { name: 'Banana', quantity: 1.5, unit: 'kg', category: 'Hortifruti' });
    let product = (await repo.products(id))[0]!;
    await repo.saveProduct(id, { name: 'Banana prata', quantity: 2, unit: 'kg', category: 'Hortifruti' }, product.id);
    await repo.toggle(product); product = (await repo.products(id))[0]!;
    assert.equal(product.purchased, 1); assert.equal(product.name, 'Banana prata');
    assert.equal((await repo.lists())[0]?.purchased, 1);
    const copyId = await repo.duplicate(id); const copy = (await repo.products(copyId))[0]!;
    assert.notEqual(copy.id, product.id); assert.equal(copy.quantity, 2); assert.equal(copy.purchased, 0);
    await repo.toggle(product); assert.equal((await repo.products(id))[0]?.purchased, 0);
    await Promise.all([repo.toggle(product), repo.toggle(product)]);
    assert.equal((await repo.products(id))[0]?.purchased, 0);
    raw.close(); raw = new DatabaseSync(file); db = adapter(raw); await migrate(db);
    const reopened = new Repository(db, randomUUID);
    assert.equal((await reopened.lists()).length, 2); assert.equal((await reopened.products(id))[0]?.quantity, 2);
    await reopened.removeProduct((await reopened.products(id))[0]!); assert.equal((await reopened.lists()).find(l => l.id === id)?.total, 0);
    await reopened.remove(copyId); assert.equal((await reopened.products(copyId)).length, 0);
    await reopened.remove(id); assert.deepEqual(await reopened.lists(), []);
    const remaining = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM products'); assert.equal(remaining?.n, 0);
  } finally { raw.close(); rmSync(dir, { recursive: true, force: true }); }
});
test('invalid quantities, units and categories are rejected', () => {
  for (const quantity of [0, -1, NaN, Infinity, 100000]) assert.throws(() => validateProduct({ name: 'Arroz', quantity, unit: 'kg', category: null }));
  assert.throws(() => validateProduct({ name: '', quantity: 1, unit: 'kg', category: null }));
  assert.throws(() => validateProduct({ name: 'Arroz', quantity: 1, unit: 'inválida' as never, category: null }));
  assert.throws(() => validateProduct({ name: 'Arroz', quantity: 1, unit: 'kg', category: 'inválida' as never }));
});
test('quantity input accepts decimals and rejects non-decimal notation', () => {
  assert.equal(parseQuantity(' 1,5 '), 1.5);
  assert.equal(parseQuantity('2.75'), 2.75);
  assert.equal(parseQuantity('1'), 1);
  for (const input of ['', ' ', '0x10', '1e3', '1,2.3', 'abc', 'Infinity']) assert.throws(() => parseQuantity(input));
});
test('newer database versions are refused before any write or configuration change', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    raw.exec("PRAGMA user_version = 2; CREATE TABLE preserved (value TEXT); INSERT INTO preserved VALUES ('original');");
    const db = adapter(raw);
    db.execAsync = async () => { assert.fail('A newer database must not be modified'); };
    await assert.rejects(migrate(db), /mais recente/);
    assert.equal(raw.prepare('PRAGMA user_version').get()?.user_version, 2);
    assert.equal(raw.prepare('SELECT value FROM preserved').get()?.value, 'original');
  } finally { raw.close(); }
});
test('failed duplicate rolls back completely and preserves original', async () => {
  const raw = new DatabaseSync(':memory:'); const db = adapter(raw); await migrate(db);
  try {
    const repo = new Repository(db, randomUUID); const id = await repo.create('Original');
    await repo.saveProduct(id, { name: 'Leite', quantity: 1, unit: 'litro', category: null });
    let calls = 0; const broken = new Repository(db, () => { if (++calls === 2) throw Error('simulated failure'); return randomUUID(); });
    await assert.rejects(broken.duplicate(id)); assert.equal((await repo.lists()).length, 1); assert.equal((await repo.products(id)).length, 1);
  } finally { raw.close(); }
});
