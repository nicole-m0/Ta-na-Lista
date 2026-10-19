export const categories = ['Hortifruti', 'Carnes', 'Laticínios', 'Mercearia', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'] as const;
export const units = ['unidade', 'kg', 'g', 'litro', 'ml', 'pacote', 'caixa'] as const;
export type Category = typeof categories[number];
export type Unit = typeof units[number];
export type ShoppingList = { id: string; name: string; createdAt: string; updatedAt: string; total: number; purchased: number };
export type Product = { id: string; listId: string; name: string; quantity: number; unit: Unit; category: Category | null; purchased: number; createdAt: string; updatedAt: string };
export type ProductInput = Pick<Product, 'name' | 'quantity' | 'unit' | 'category'>;
