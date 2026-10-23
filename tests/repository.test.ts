import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Repository, migrate, parseQuantity, validateProduct, validName, validId } from '../src/db/repository.ts';
import type { Database } from '../src/db/repository.ts';
import { createOperationGate } from '../src/services/operation.ts';

function adapter(raw: DatabaseSync): Database {
  return {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, ...params) { return raw.prepare(sql).run(...params); },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) { return (raw.prepare(sql).get(...params) ?? null) as T | null; },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) { return raw.prepare(sql).all(...params) as T[]; },
    async withTransactionAsync(task) { raw.exec('BEGIN'); try { await task(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; } },
  };
}

test('rapid gated submissions create one product and one toggle, then persist after reopening', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tanalista-repeat-')); const file = join(dir, 'repeat.db');
  let raw = new DatabaseSync(file);
  try {
    let db = adapter(raw); await migrate(db); let repo = new Repository(db, randomUUID);
    const id = await repo.create('Teste offline'); const run = createOperationGate();
    const add = () => repo.saveProduct(id, { name: 'Leite', quantity: 1, unit: 'litro', category: null });
    await Promise.all([run(add), run(add), run(add)]);
    const products = await repo.products(id); assert.equal(products.length, 1);
    const toggle = () => repo.toggle(products[0]!);
    await Promise.all([run(toggle), run(toggle)]);
    raw.close(); raw = new DatabaseSync(file); db = adapter(raw); await migrate(db); repo = new Repository(db, randomUUID);
    assert.equal((await repo.products(id))[0]?.purchased, 1);
    assert.equal((await repo.products(id)).length, 1);
    assert.equal(raw.prepare('PRAGMA quick_check').get()?.quick_check, 'ok');
  } finally { raw.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('malformed product writes and repeated deletion preserve all remaining rows and timestamps', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    const db = adapter(raw); await migrate(db); const repo = new Repository(db, randomUUID);
    const id = await repo.create('Preservada');
    const input = { name: 'Arroz', quantity: 1, unit: 'kg', category: null } as const;
    await repo.saveProduct(id, input); const product = (await repo.products(id))[0]!;
    const snapshot = () => ({ lists: raw.prepare('SELECT * FROM lists').all(), products: raw.prepare('SELECT * FROM products').all() });
    const before = snapshot();
    for (const invalid of [null, [], { ...input, name: '\u0000' }, { ...input, quantity: '1' }, { ...input, category: undefined }, { ...input, quantity: NaN }]) await assert.rejects(repo.saveProduct(id, invalid as never));
    for (const invalidId of ['', null, ['array'], 123]) await assert.rejects(repo.saveProduct(id, input, invalidId as never));
    assert.deepEqual(snapshot(), before);
    await repo.removeProduct(product); const after = snapshot();
    await assert.rejects(repo.removeProduct(product)); await assert.rejects(repo.toggle(product));
    assert.deepEqual(snapshot(), after);
  } finally { raw.close(); }
});

test('integrity check failure refuses existing data without modifying its records or schema', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    const db = adapter(raw); await migrate(db); const repo = new Repository(db, randomUUID);
    await repo.create('Preservada'); const before = raw.prepare('SELECT * FROM lists').all();
    const first = db.getFirstAsync;
    db.getFirstAsync = async <T>(sql: string, ...params: (string | number | null)[]) => sql === 'PRAGMA quick_check' ? { quick_check: 'simulated corruption' } as T : first<T>(sql, ...params);
    await assert.rejects(migrate(db), /integridade/);
    assert.deepEqual(raw.prepare('SELECT * FROM lists').all(), before);
    assert.equal(raw.prepare('PRAGMA user_version').get()?.user_version, 1);
  } finally { raw.close(); }
});

test('runtime validation rejects malformed input without writing and preserves literal names', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    await migrate(adapter(raw)); const repo = new Repository(adapter(raw), randomUUID);
    for (const value of [null, undefined, 123, {}, 'x'.repeat(81), 'Arroz\u0000oculto', 'A\nB']) {
      assert.throws(() => validName(value as never));
      await assert.rejects(repo.create(value as never));
    }
    for (const value of [null, [], '', ' ', 'a b', 'x'.repeat(129)]) assert.throws(() => validId(value));
    for (const value of [null, 1, '0', '100000', '9'.repeat(500)]) assert.throws(() => parseQuantity(value as never));
    for (const value of [null, {}, { name: 'Arroz', quantity: '1', unit: 'kg', category: null }]) assert.throws(() => validateProduct(value as never));
    assert.deepEqual(await repo.lists(), []);
    const name = "Feira ' ; DROP TABLE lists; --";
    await repo.create(name); assert.equal((await repo.lists())[0]?.name, name);
  } finally { raw.close(); }
});

test('stale or foreign product operations fail without touching any existing row', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    const db = adapter(raw); await migrate(db); const repo = new Repository(db, randomUUID);
    const id = await repo.create('Original'); const other = await repo.create('Outra');
    const input = { name: 'Leite', quantity: 1, unit: 'litro', category: null } as const;
    await repo.saveProduct(id, input); const product = (await repo.products(id))[0]!;
    const snapshot = () => ({ lists: raw.prepare('SELECT * FROM lists ORDER BY id').all(), products: raw.prepare('SELECT * FROM products ORDER BY id').all() });
    const before = snapshot();
    await assert.rejects(repo.rename('missing', 'Não existe'));
    await assert.rejects(repo.remove('missing'));
    await assert.rejects(repo.saveProduct(id, input, 'missing'));
    await assert.rejects(repo.saveProduct(other, input, product.id));
    await assert.rejects(repo.saveProduct('missing', input));
    await assert.rejects(repo.toggle({ ...product, listId: other }));
    await assert.rejects(repo.removeProduct({ ...product, id: 'missing' }));
    await assert.rejects(repo.products(['route-array'] as never));
    assert.deepEqual(snapshot(), before);
    await repo.rename(id, 'Ainda funciona'); assert.equal((await repo.lists()).find(l => l.id === id)?.name, 'Ainda funciona');
  } finally { raw.close(); }
});

test('consistent SQLite copy includes WAL transactions and can be reopened independently', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tanalista-backup-'));
  const raw = new DatabaseSync(join(dir, 'source.db'));
  let copy: DatabaseSync | undefined;
  try {
    const db = adapter(raw); await migrate(db); raw.exec('PRAGMA wal_autocheckpoint=0');
    const repo = new Repository(db, randomUUID); const id = await repo.create('Teste de cópia');
    await repo.saveProduct(id, { name: 'Arroz', quantity: 1.5, unit: 'kg', category: null });
    await repo.toggle((await repo.products(id))[0]!);
    const before = { lists: raw.prepare('SELECT * FROM lists').all(), products: raw.prepare('SELECT * FROM products').all() };
    const file = join(dir, 'consistent.db');
    // VACUUM INTO creates a new consistent SQLite snapshot, including committed WAL.
    raw.prepare('VACUUM INTO ?').run(file);
    copy = new DatabaseSync(file); await migrate(adapter(copy));
    assert.deepEqual(copy.prepare('SELECT * FROM lists').all(), before.lists);
    assert.deepEqual(copy.prepare('SELECT * FROM products').all(), before.products);
    assert.equal(copy.prepare('PRAGMA quick_check').get()?.quick_check, 'ok');
    assert.deepEqual(copy.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(copy.prepare('PRAGMA user_version').get()?.user_version, 1);
    assert.deepEqual(raw.prepare('SELECT * FROM products').all(), before.products);
  } finally { copy?.close(); raw.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('failure updating parent timestamp rolls back product mutation and queue recovers', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    const db = adapter(raw); await migrate(db); const repo = new Repository(db, randomUUID);
    const id = await repo.create('Original');
    await repo.saveProduct(id, { name: 'Arroz', quantity: 1, unit: 'kg', category: null });
    const product = (await repo.products(id))[0]!;
    const before = raw.prepare('SELECT * FROM products').all();
    const run = db.runAsync;
    db.runAsync = async (sql, ...params) => {
      if (sql.startsWith('UPDATE lists SET updatedAt')) throw Error('disk write failure');
      return run(sql, ...params);
    };
    await assert.rejects(repo.toggle(product));
    assert.deepEqual(raw.prepare('SELECT * FROM products').all(), before);
    db.runAsync = run;
    await repo.toggle(product); assert.equal((await repo.products(id))[0]?.purchased, 1);
  } finally { raw.close(); }
});
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

test('offline ads failure does not affect local CRUD or migration of existing data', async () => {
  const raw = new DatabaseSync(':memory:'); const db = adapter(raw);
  try {
    await migrate(db); const repo = new Repository(db, randomUUID);
    const id = await repo.create("Feira ' ; DROP TABLE lists; --");
    await repo.saveProduct(id, { name: 'Arroz', quantity: 2, unit: 'kg', category: null });
    const before = raw.prepare('SELECT * FROM products').all();
    const { createAdsController } = await import('../src/services/ads.ts');
    const controller = createAdsController({ gatherConsent: async () => { throw Error('offline'); }, showPrivacyOptionsForm: async () => { throw Error('offline'); }, initialize: async () => assert.fail('No SDK initialization offline') }, () => {});
    await controller.start(); await migrate(db);
    assert.deepEqual(raw.prepare('SELECT * FROM products').all(), before);
    await repo.toggle((await repo.products(id))[0]!);
    assert.equal((await repo.products(id))[0]?.purchased, 1);
    assert.equal((await repo.lists()).length, 1);
  } finally { raw.close(); }
});

test('orphaned data is reported without deleting or repairing it silently', async () => {
  const raw = new DatabaseSync(':memory:'); const db = adapter(raw);
  try {
    await migrate(db);
    raw.exec("PRAGMA foreign_keys=OFF; INSERT INTO products VALUES ('orphan','missing','Preservado',1,'kg',NULL,0,'now','now');");
    await assert.rejects(migrate(db), /integridade/);
    assert.equal(raw.prepare('SELECT name FROM products').get()?.name, 'Preservado');
  } finally { raw.close(); }
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

test('original insertion order survives timestamp ties and duplication', async () => {
  const raw = new DatabaseSync(':memory:'); const db = adapter(raw); await migrate(db);
  try {
    const ids = ['list', 'z', 'a', 'copy', 'y', 'b'];
    const repo = new Repository(db, () => ids.shift()!);
    const id = await repo.create('Ordem');
    for (const name of ['Primeiro', 'Segundo']) await repo.saveProduct(id, { name, quantity: 1, unit: 'unidade', category: null });
    raw.exec("UPDATE products SET createdAt='2026-01-01'");
    assert.deepEqual((await repo.products(id)).map(p => p.name), ['Primeiro', 'Segundo']);
    const copy = await repo.duplicate(id);
    assert.deepEqual((await repo.products(copy)).map(p => p.name), ['Primeiro', 'Segundo']);
    assert.ok((await repo.products(copy)).every(p => p.purchased === 0));
    assert.equal(raw.prepare('PRAGMA user_version').get()?.user_version, 1);
  } finally { raw.close(); }
});
test('frequent suggestions use local history, merge names and keep latest details', async () => {
  const raw = new DatabaseSync(':memory:'); const db = adapter(raw); await migrate(db);
  try {
    const repo = new Repository(db, randomUUID);
    assert.deepEqual(await repo.frequentProducts(), []);
    const id = await repo.create('Semana');
    await repo.saveProduct(id, { name: 'Arroz', quantity: 1, unit: 'kg', category: 'Mercearia' });
    await repo.saveProduct(id, { name: 'Banana', quantity: 1, unit: 'kg', category: 'Hortifruti' });
    const other = await repo.create('Mês');
    await repo.saveProduct(other, { name: 'ARROZ', quantity: 2, unit: 'pacote', category: 'Mercearia' });
    const suggestions = await repo.frequentProducts();
    assert.equal(suggestions.length, 2);
    assert.equal(suggestions[0]?.name, 'ARROZ');
    assert.equal(suggestions[0]?.quantity, 2);
    assert.equal(suggestions[0]?.unit, 'pacote');
    await repo.remove(other);
    assert.equal((await repo.frequentProducts())[0]?.quantity, 1);
    await assert.rejects(repo.duplicate('missing'));
    await repo.saveProduct(id, { name: 'Leite', quantity: 1, unit: 'litro', category: null });
    assert.equal((await repo.products(id)).length, 3);
  } finally { raw.close(); }
});
