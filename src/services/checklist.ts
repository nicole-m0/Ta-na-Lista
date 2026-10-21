import type { Product } from '../types/models.ts';
import { categories } from '../types/models.ts';

export type ProductOrder = 'original' | 'pending' | 'category';
export function searchKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}
export function visibleProducts(products: Product[], query: string, order: ProductOrder) {
  const result = products.filter(product => searchKey(product.name).includes(searchKey(query)));
  if (order === 'pending') result.sort((a, b) => a.purchased - b.purchased);
  if (order === 'category') result.sort((a, b) =>
    (a.category ? categories.indexOf(a.category) : categories.length) -
    (b.category ? categories.indexOf(b.category) : categories.length));
  return result;
}
