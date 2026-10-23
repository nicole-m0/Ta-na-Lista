import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { categories, units } from '../types/models';
import type { Product, ProductInput } from '../types/models';
import { parseQuantity, validateProduct } from '../db/repository';
import { Action, Sheet, s } from './ui';
import { searchKey } from '../services/checklist';
import { colors as c } from '../theme';
import { createOperationGate } from '../services/operation';

export function ProductForm({ product, suggestions = [], close, save }: { suggestions?: Product[]; product?: Product; close: () => void; save: (input: ProductInput) => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? ''); const [quantity, setQuantity] = useState(String(product?.quantity ?? 1).replace('.', ','));
  const [unit, setUnit] = useState<ProductInput['unit']>(product?.unit ?? 'unidade'); const [category, setCategory] = useState<ProductInput['category']>(product?.category ?? null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState(''); const input = useRef<ComponentRef<typeof TextInput>>(null);
  const quantityInput = useRef<ComponentRef<typeof TextInput>>(null);
  const runOperation = useRef(createOperationGate()).current;
  async function submit(another: boolean) {
    await runOperation(async () => {
      let data: ProductInput;
      try { data = validateProduct({ name, quantity: parseQuantity(quantity), unit, category }); } catch (e) { setError((e as Error).message); return; }
      try { setBusy(true); setError(''); await save(data);
        if (another) { setName(''); setQuantity('1'); setFeedback(`${data.name.trim()} adicionado!`); setBusy(false); requestAnimationFrame(() => input.current?.focus()); }
        else close();
      } catch { setError('Não foi possível salvar o produto. Tente novamente.'); }
      finally { setBusy(false); }
    });
  }
  return <Sheet visible title={product ? 'Editar produto' : 'O que falta comprar?'} close={() => { if (!busy) close(); }}>
    <Text style={s.label}>Produto</Text><TextInput ref={input} autoFocus accessibilityLabel="Nome do produto" maxLength={80} style={s.input} placeholder="Ex.: Banana" value={name} onChangeText={v => { setName(v); setFeedback(''); }} editable={!busy} returnKeyType="next" onSubmitEditing={() => quantityInput.current?.focus()} />
    {!product && suggestions.some(p => searchKey(p.name).includes(searchKey(name))) && <View style={{ gap: 8 }}><Text style={s.label}>Produtos frequentes · toque para preencher</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{suggestions.filter(p => searchKey(p.name).includes(searchKey(name))).map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Preencher ${p.name}`} disabled={busy} style={s.filter} onPress={() => { setName(p.name); setQuantity(String(p.quantity).replace('.', ',')); setUnit(p.unit); setCategory(p.category); setError(''); setFeedback(''); }}><Text style={{ color: c.green }}>{p.name}</Text></Pressable>)}</View></View>}
    <Text style={s.label}>Quantidade</Text><TextInput ref={quantityInput} accessibilityLabel="Quantidade" keyboardType="decimal-pad" style={s.input} value={quantity} onChangeText={setQuantity} maxLength={12} editable={!busy} />
    <Text style={s.label}>Unidade</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{units.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: unit === value }} disabled={busy} onPress={() => setUnit(value)} style={{ padding: 13, minHeight: 48, borderRadius: 13, backgroundColor: unit === value ? c.pale : c.background, borderWidth: 1, borderColor: unit === value ? c.green : c.border }}><Text style={{ color: unit === value ? c.green : c.text }}>{value}</Text></Pressable>)}</View>
    <Text style={s.label}>Categoria · opcional</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[null, ...categories].map(value => <Pressable key={value ?? 'none'} accessibilityRole="radio" accessibilityState={{ selected: category === value }} disabled={busy} onPress={() => setCategory(value)} style={{ padding: 13, minHeight: 48, borderRadius: 13, backgroundColor: category === value ? c.pale : c.background }}><Text style={{ color: category === value ? c.green : c.text }}>{value ?? 'Sem categoria'}</Text></Pressable>)}</View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}{!!feedback && <Text accessibilityLiveRegion="polite" style={{ color: c.green }}>{feedback}</Text>}
    <Action title={busy ? 'Salvando…' : product ? 'Salvar alterações' : 'Adicionar produto'} disabled={busy} icon="checkmark" onPress={() => void submit(false)} />
    {!product && <Action title="Adicionar e continuar" subtle disabled={busy} icon="add" onPress={() => void submit(true)} />}
  </Sheet>;
}
