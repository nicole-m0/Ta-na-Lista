import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../hooks/useStore';
import type { Product, ShoppingList } from '../../types/models';
import { Action, Empty, IconButton, Progress, s } from '../../components/ui';
import { ProductForm } from '../../components/ProductForm';
import { ProductRow } from '../../components/ProductRow';
import { visibleProducts, type ProductOrder } from '../../services/checklist';
import { colors as c } from '../../theme';

export default function Checklist() {
  const { id } = useLocalSearchParams<{ id: string }>(); const store = useStore();
  const [list, setList] = useState<ShoppingList>(); const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [form, setForm] = useState<{ product?: Product }>(); const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''); const [order, setOrder] = useState<ProductOrder>('original');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const shown = visibleProducts(products, query, order);
  const refresh = useCallback(async () => {
    try { const lists = await store.lists(); const found = lists.find(l => l.id === id); setList(found); setProducts(found ? await store.products(id) : []); setSuggestions(await store.frequentProducts()); setError(''); }
    catch { setError('Não foi possível carregar os produtos. Tente novamente.'); }
    finally { setLoading(false); }
  }, [id, store]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  async function mutate(task: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try { await task(); await refresh(); } catch { Alert.alert('Não foi possível concluir', 'Tente novamente. A alteração não foi salva.'); } finally { setBusy(false); }
  }
  function options(p: Product) {
    Alert.alert(p.name, 'O que deseja fazer?', [{ text: 'Editar', onPress: () => setForm({ product: p }) }, { text: 'Excluir', style: 'destructive', onPress: () => Alert.alert('Excluir produto?', `Remover “${p.name}” desta lista?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void mutate(() => store.removeProduct(p)) }]) }, { text: 'Cancelar', style: 'cancel' }]);
  }
  return <SafeAreaView style={s.page}>
    <View style={[s.between, { paddingHorizontal: 16, paddingTop: 4 }]}><IconButton name="arrow-back" label="Voltar para minhas listas" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} /><Text style={s.eyebrow}>SUA COMPRA, MAIS LEVE</Text><View style={{ width: 48 }} /></View>
    {loading ? <ActivityIndicator style={{ margin: 40 }} color={c.green} /> : error ? <View style={s.content}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Action title="Tentar novamente" onPress={() => void refresh()} /></View> : !list ? <Empty title="Lista não encontrada" detail="Ela pode ter sido excluída. Volte para suas listas para continuar." /> : <>
      <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" data={shown} keyExtractor={p => p.id} contentContainerStyle={[s.content, { gap: 12 }]} ListHeaderComponent={<View style={{ gap: 20, marginBottom: 12 }}><Text style={s.title}>{list.name}</Text><View style={[s.card, { backgroundColor: c.pale, borderWidth: 0 }]}><Text accessibilityLiveRegion="polite" style={{ color: c.green, fontWeight: '700' }}>{products.length && list.purchased === products.length ? 'Tudo na sacola. Boa compra!' : 'Uma coisa de cada vez.'}</Text><Progress total={list.total} purchased={list.purchased} /></View><View style={s.between}><Text style={s.sectionTitle}>Seu checklist</Text><Text style={s.caption}>{products.length - list.purchased} pendentes</Text></View><Text style={[s.caption, { fontSize: 12 }]}>Toque no produto para marcar ou desmarcar.</Text>
        <View style={s.between}><TextInput accessibilityLabel="Buscar produto nesta lista" placeholder="Buscar produto…" value={query} onChangeText={setQuery} style={[s.input, { flex: 1 }]} returnKeyType="search" />{!!query && <IconButton name="close-circle-outline" label="Limpar busca" onPress={() => setQuery('')} />}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{([['original', 'Ordem original'], ['pending', 'Pendentes primeiro'], ['category', 'Categorias']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: order === value }} onPress={() => setOrder(value)} style={[s.filter, order === value && { backgroundColor: c.pale, borderColor: c.green }]}><Text style={{ color: order === value ? c.green : c.text }}>{label}</Text></Pressable>)}</View>
        {!!query.trim() && <Text accessibilityLiveRegion="polite" style={s.caption}>{shown.length} de {products.length} produtos encontrados</Text>}</View>}
        ListEmptyComponent={<Empty title={products.length ? 'Nenhum produto encontrado' : 'Sua lista começa aqui'} detail={products.length ? 'Tente outro nome ou limpe a busca para ver todos os produtos.' : 'Adicione o primeiro produto. Depois, é só tocar para marcar o que já está na sacola.'} />}
        renderItem={({ item, index }) => <View style={{ gap: 12 }}>{order === 'category' && (index === 0 || shown[index - 1]?.category !== item.category) && <Text accessibilityRole="header" style={s.label}>{item.category ?? 'Sem categoria'}</Text>}<ProductRow product={item} busy={busy} toggle={() => void mutate(() => store.toggle(item))} options={() => options(item)} /></View>} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.white }}><Action title="Adicionar produto" icon="add" onPress={() => setForm({})} disabled={busy} /></View>
    </>}
    {form && list && <ProductForm suggestions={suggestions} product={form.product} close={() => setForm(undefined)} save={async input => { await store.saveProduct(list.id, input, form.product?.id); await refresh(); }} />}
  </SafeAreaView>;
}
