import { categories, units } from '../types/models.ts';
import type { Product, ProductInput, ShoppingList } from '../types/models.ts';

export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
export const schema = `
CREATE TABLE lists (id TEXT PRIMARY KEY, name TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE products (id TEXT PRIMARY KEY, listId TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
 name TEXT NOT NULL, quantity REAL NOT NULL CHECK(quantity > 0), unit TEXT NOT NULL, category TEXT,
 purchased INTEGER NOT NULL DEFAULT 0 CHECK(purchased IN (0,1)), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE INDEX products_list ON products(listId);
PRAGMA user_version = 1;`;

export async function migrate(db: Database) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) throw new Error('Este banco foi atualizado por uma versão mais recente. Atualize o aplicativo.');
  if (!version?.user_version) await db.withTransactionAsync(() => db.execAsync(schema));
}
export function validName(value: string) {
  const name = value.trim();
  if (!name || name.length > 80) throw new Error('Informe um nome com 1 a 80 caracteres.');
  return name;
}
export function validateProduct(input: ProductInput): ProductInput {
  const name = validName(input.name);
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 99999) throw new Error('Use uma quantidade maior que zero e até 99.999.');
  if (!units.includes(input.unit) || (input.category !== null && !categories.includes(input.category))) throw new Error('Unidade ou categoria inválida.');
  return { ...input, name };
}

export class Repository {
  // Serializes writes so async SQLite transactions cannot accidentally overlap.
  private pending: Promise<unknown> = Promise.resolve();
  private db: Database;
  private uuid: () => string;
  constructor(db: Database, uuid: () => string) { this.db = db; this.uuid = uuid; }
  private write<T>(task: () => Promise<T>): Promise<T> {
    const next = this.pending.then(task);
    this.pending = next.catch(() => undefined);
    return next;
  }
  async lists() {
    await this.pending;
    return this.db.getAllAsync<ShoppingList>(`SELECT l.*, COUNT(p.id) total, COALESCE(SUM(p.purchased),0) purchased FROM lists l LEFT JOIN products p ON p.listId=l.id GROUP BY l.id ORDER BY l.updatedAt DESC, l.id`);
  }
  async products(id: string) {
    await this.pending;
    return this.db.getAllAsync<Product>('SELECT * FROM products WHERE listId=? ORDER BY createdAt, id', id);
  }
  create(name: string) {
    return this.write(async () => {
      name = validName(name); const id = this.uuid(); const now = new Date().toISOString();
      await this.db.runAsync('INSERT INTO lists VALUES (?,?,?,?)', id, name, now, now); return id;
    });
  }
  rename(id: string, name: string) {
    return this.write(() => this.db.runAsync('UPDATE lists SET name=?, updatedAt=? WHERE id=?', validName(name), new Date().toISOString(), id));
  }
  remove(id: string) { return this.write(() => this.db.runAsync('DELETE FROM lists WHERE id=?', id)); }
  duplicate(id: string) {
    return this.write(async () => {
      const copyId = this.uuid(); const now = new Date().toISOString();
      await this.db.withTransactionAsync(async () => {
        const source = await this.db.getFirstAsync<ShoppingList>('SELECT * FROM lists WHERE id=?', id);
        if (!source) throw new Error('A lista não foi encontrada.');
        await this.db.runAsync('INSERT INTO lists VALUES (?,?,?,?)', copyId, `${source.name.slice(0,72)} (cópia)`, now, now);
        const products = await this.db.getAllAsync<Product>('SELECT * FROM products WHERE listId=?', id);
        for (const p of products) await this.db.runAsync('INSERT INTO products VALUES (?,?,?,?,?,?,0,?,?)', this.uuid(), copyId, p.name, p.quantity, p.unit, p.category, now, now);
      });
      return copyId;
    });
  }
  saveProduct(listId: string, input: ProductInput, id?: string) {
    return this.write(async () => {
      const p = validateProduct(input); const now = new Date().toISOString();
      await this.db.withTransactionAsync(async () => {
        if (id) await this.db.runAsync('UPDATE products SET name=?,quantity=?,unit=?,category=?,updatedAt=? WHERE id=? AND listId=?', p.name,p.quantity,p.unit,p.category,now,id,listId);
        else await this.db.runAsync('INSERT INTO products VALUES (?,?,?,?,?,?,0,?,?)',this.uuid(),listId,p.name,p.quantity,p.unit,p.category,now,now);
        await this.touch(listId,now);
      });
    });
  }
  toggle(p: Product) { return this.write(async () => {
    const now = new Date().toISOString();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('UPDATE products SET purchased=1-purchased,updatedAt=? WHERE id=? AND listId=?',now,p.id,p.listId);
      await this.touch(p.listId,now);
    });
  }); }
  removeProduct(p: Product) { return this.write(async () => {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM products WHERE id=? AND listId=?',p.id,p.listId);
      await this.touch(p.listId,new Date().toISOString());
    });
  }); }
  private touch(id: string, now: string) { return this.db.runAsync('UPDATE lists SET updatedAt=? WHERE id=?',now,id); }
}
