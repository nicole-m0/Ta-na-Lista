import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useStore } from '../hooks/useStore';
import type { ShoppingList } from '../types/models';
import { Action, Empty, IconButton, Progress, Sheet, s } from '../components/ui';
import { ListNameForm } from '../components/ListNameForm';
import { AdBanner } from '../components/AdBanner';
import { colors as c } from '../theme';

export default function Home() {
  const store = useStore(); const [lists, setLists] = useState<ShoppingList[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [form, setForm] = useState<{ id?: string; name: string }>();
  const [selected, setSelected] = useState<ShoppingList>();
  const refresh = useCallback(async () => { try { setLists(await store.lists()); setError(''); } catch { setError('Não foi possível carregar suas listas. Tente novamente.'); } finally { setLoading(false); } }, [store]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  async function mutate(task: () => Promise<unknown>) { try { await task(); await refresh(); } catch { Alert.alert('Não foi possível concluir', 'Seus dados foram preservados. Tente novamente.'); } }
  function menu(list: ShoppingList) {
    setSelected(list);
  }
  return <SafeAreaView style={s.page}><FlatList data={lists} keyExtractor={item => item.id} contentContainerStyle={s.content} refreshing={loading} onRefresh={() => void refresh()}
    ListHeaderComponent={<View style={{ gap: 28 }}>
      <View style={s.between}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ backgroundColor: c.green, padding: 10, borderRadius: 14 }}><Ionicons name="bag-check-outline" size={25} color="white" /></View><Text style={{ fontSize: 21, fontWeight: '800', color: c.text }}>Tá na Lista!</Text></View><View style={{ backgroundColor: c.pale, borderRadius: 20, padding: 9 }}><Ionicons name="leaf-outline" size={19} color={c.green} /></View></View>
      <View style={{ gap: 8 }}><Text style={s.eyebrow}>MENOS ESQUECIMENTO. MAIS LEVEZA.</Text><Text style={s.title}>Oi! Vamos organizar{ '\n' }suas compras?</Text><Text style={[s.caption, { lineHeight: 22 }]}>Tudo o que você precisa, na palma da mão.</Text></View>
      <Action title="Criar nova lista" icon="add" onPress={() => setForm({ name: '' })} />
      <View style={s.between}><Text style={s.sectionTitle}>Minhas listas</Text><Text style={s.caption}>{lists.length} {lists.length === 1 ? 'lista' : 'listas'}</Text></View>
      {!!error && <><Text accessibilityRole="alert" style={s.error}>{error}</Text><Action subtle title="Tentar novamente" onPress={() => void refresh()} /></>}
    </View>}
    ListEmptyComponent={loading ? <ActivityIndicator color={c.green} /> : !error ? <Empty title="Uma lista, muitas facilidades" detail="Da feira ao churrasco de domingo: crie sua primeira lista e deixe a memória descansar." /> : undefined}
    renderItem={({ item }) => <View style={s.card}><View style={s.between}><Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${item.name}`} onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })} style={{ flex: 1, gap: 9, minHeight: 48 }}><Text style={s.sectionTitle}>{item.name}</Text><Text style={s.caption}>Criada em {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text></Pressable><IconButton name="ellipsis-horizontal" label={`Opções de ${item.name}`} onPress={() => menu(item)} /></View><Progress total={item.total} purchased={item.purchased} /><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })} style={[s.between, { minHeight: 44 }]}><Text style={{ color: c.green, fontWeight: '700' }}>{item.total > 0 && item.total === item.purchased ? 'Tudo comprado! Ver lista' : 'Abrir lista'}</Text><Ionicons name="arrow-forward" size={19} color={c.green} /></Pressable></View>}
    ListFooterComponent={<View style={{ gap: 14 }}><Text style={[s.caption, { textAlign: 'center', fontSize: 12 }]}>Feita para simplificar o seu dia. Funciona offline.</Text><AdBanner /></View>} />
    {selected && <Sheet visible title={selected.name} close={() => setSelected(undefined)}>
      <Action subtle title="Renomear lista" icon="pencil-outline" onPress={() => { setSelected(undefined); setForm({ id: selected.id, name: selected.name }); }} />
      <Action subtle title="Duplicar lista" icon="copy-outline" onPress={() => { const id = selected.id; setSelected(undefined); void mutate(() => store.duplicate(id)); }} />
      <Action subtle title="Excluir lista" icon="trash-outline" onPress={() => { const list = selected; setSelected(undefined); Alert.alert('Excluir esta lista?', `“${list.name}” e todos os seus produtos serão excluídos.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir lista', style: 'destructive', onPress: () => void mutate(() => store.remove(list.id)) }]); }} />
    </Sheet>}
    {form && <ListNameForm initial={form.name} close={() => setForm(undefined)} save={async name => { if (form.id) await store.rename(form.id, name); else await store.create(name); await refresh(); }} />}
  </SafeAreaView>;
}
