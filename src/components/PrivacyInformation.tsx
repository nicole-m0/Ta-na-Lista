import { Text, View } from 'react-native';
import { Sheet, s } from './ui';
import { privacyInformation } from '../services/privacy';

export function PrivacyInformation({ close }: { close: () => void }) {
  return <Sheet visible title="Privacidade e dados locais" close={close}>
    {privacyInformation.map(([title, detail]) => <View key={title} style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={s.label}>{title}</Text><Text style={s.caption}>{detail}</Text>
    </View>)}
  </Sheet>;
}
