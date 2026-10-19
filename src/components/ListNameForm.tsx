import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Action, Sheet, s } from './ui';
import { validName } from '../db/repository';
export function ListNameForm({ initial, close, save }: { initial: string; close: () => void; save: (name: string) => Promise<void> }) {
  const [name, setName] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    try { validName(name); setBusy(true); setError(''); await save(name); close(); }
    catch (e) { setError(e instanceof Error && e.message.includes('caracteres') ? e.message : 'Não foi possível salvar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <Sheet visible title={initial ? 'Renomear lista' : 'Uma nova lista'} close={() => { if (!busy) close(); }}>
    <Text style={s.label}>Como vamos chamar sua lista?</Text><TextInput autoFocus accessibilityLabel="Nome da lista" placeholder="Ex.: Compras da semana" maxLength={80} value={name} onChangeText={setName} style={s.input} onSubmitEditing={() => void submit()} returnKeyType="done" editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Action title={busy ? 'Salvando…' : initial ? 'Salvar nome' : 'Criar lista'} disabled={busy} onPress={() => void submit()} icon="checkmark" />
  </Sheet>;
}
