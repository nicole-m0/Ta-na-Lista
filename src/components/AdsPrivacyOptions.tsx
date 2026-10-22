import { Text, View } from 'react-native';
import { useAds } from '../hooks/useAds';
import { Action, s } from './ui';

export function AdsPrivacyOptions() {
  const { privacyRequired, busy, failed, retry, review } = useAds();
  return <View style={{ gap: 12 }}>
    {privacyRequired && <Action subtle title="Privacidade dos anúncios" disabled={busy} onPress={review} />}
    {failed && <><Text style={s.caption}>Anúncios indisponíveis. Suas listas continuam funcionando offline.</Text><Action subtle title="Verificar anúncios novamente" disabled={busy} onPress={retry} /></>}
  </View>;
}
