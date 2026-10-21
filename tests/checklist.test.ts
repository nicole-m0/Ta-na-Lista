import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleProducts } from '../src/services/checklist.ts';
import type { Product } from '../src/types/models.ts';

const products: Product[] = [
  { id: '1', listId: 'list', name: 'Sabão', quantity: 1, unit: 'unidade', category: 'Limpeza', purchased: 1, createdAt: '', updatedAt: '' },
  { id: '2', listId: 'list', name: 'Maçã', quantity: 1, unit: 'kg', category: 'Hortifruti', purchased: 0, createdAt: '', updatedAt: '' },
  { id: '3', listId: 'list', name: 'Pão', quantity: 1, unit: 'pacote', category: null, purchased: 0, createdAt: '', updatedAt: '' },
  { id: '4', listId: 'list', name: 'Banana', quantity: 1, unit: 'kg', category: 'Hortifruti', purchased: 1, createdAt: '', updatedAt: '' },
];
test('search ignores accents, case and surrounding spaces without changing source', () => {
  assert.deepEqual(visibleProducts(products, ' MACA ', 'original').map(p => p.id), ['2']);
  assert.equal(visibleProducts(products, 'ausente', 'pending').length, 0);
  assert.equal(visibleProducts(products, ' ', 'original').length, 4);
  assert.deepEqual(products.map(p => p.id), ['1', '2', '3', '4']);
});
test('pending and category ordering are stable and original order can be restored', () => {
  assert.deepEqual(visibleProducts(products, '', 'pending').map(p => p.id), ['2', '3', '1', '4']);
  assert.deepEqual(visibleProducts(products, '', 'category').map(p => p.id), ['2', '4', '1', '3']);
  assert.deepEqual(visibleProducts(products, '', 'original').map(p => p.id), ['1', '2', '3', '4']);
  assert.deepEqual(visibleProducts([], '', 'category'), []);
});
