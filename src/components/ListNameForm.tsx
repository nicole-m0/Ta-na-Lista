import { useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Action, Sheet, s } from './ui';
import { validName } from '../db/repository';
import { createOperationGate } from '../services/operation';
export function ListNameForm({ initial, close, save }: { initial: string; close: () => void; save: (name: string) => Promise<void> }) {
  const [name, setName] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const runOperation = useRef(createOperationGate()).current;
  async function submit() {
    await runOperation(async () => {
      let validated: string;
      try { validated = validName(name); }
      catch { setError('Informe um nome com 1 a 80 caracteres, sem caracteres de controle.'); return; }
      try { setBusy(true); setError(''); await save(validated); close(); }
      catch { setError('Não foi possível salvar. Tente novamente.'); }
      finally { setBusy(false); }
    });
  }
  return <Sheet visible title={initial ? 'Renomear lista' : 'Uma nova lista'} close={() => { if (!busy) close(); }}>
    <Text style={s.label}>Como vamos chamar sua lista?</Text><TextInput autoFocus accessibilityLabel="Nome da lista" placeholder="Ex.: Compras da semana" maxLength={80} value={name} onChangeText={setName} style={s.input} onSubmitEditing={() => void submit()} returnKeyType="done" editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Action title={busy ? 'Salvando…' : initial ? 'Salvar nome' : 'Criar lista'} disabled={busy} onPress={() => void submit()} icon="checkmark" />
  </Sheet>;
}
