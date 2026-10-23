import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDatabaseAsync } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Repository, migrate } from '../db/repository';
import { initializeDatabase } from '../db/initialize';
import { Button, View, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

const Context = createContext<Repository | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [repository, setRepository] = useState<Repository>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        await initializeDatabase(() => openDatabaseAsync('ta-na-lista.db', { useNewConnection: true }), migrate,
          () => active, db => setRepository(new Repository(db, randomUUID)));
      } catch { if (active) setError('Não foi possível abrir suas listas. Seus dados não foram apagados.'); }
    }
    void init();
    return () => { active = false; };
  }, [attempt]);
  if (!repository) return <View style={{ flex: 1, justifyContent: 'center', padding: 32, gap: 20, backgroundColor: colors.background }}>
    {error ? <><Text accessibilityRole="alert">{error}</Text><Button title="Tentar novamente" color={colors.green} onPress={() => { setError(''); setAttempt(attempt + 1); }} /></> : <><ActivityIndicator color={colors.green} /><Text style={{ textAlign: 'center' }}>Preparando suas listas…</Text></>}
  </View>;
  return <Context.Provider value={repository}>{children}</Context.Provider>;
}
export function useStore() { const store = useContext(Context); if (!store) throw new Error('StoreProvider ausente'); return store; }
