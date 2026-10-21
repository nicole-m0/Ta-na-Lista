import React from 'react';
import { Pressable, Text, View, StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as c } from '../theme';

export function Action({ title, onPress, icon, subtle = false, disabled = false }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; subtle?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, subtle && s.subtle, { opacity: disabled ? .45 : pressed ? .7 : 1 }]}>
    {icon && <Ionicons name={icon} size={22} color={subtle ? c.green : c.white} />}<Text style={[s.buttonText, subtle && { color: c.green }]}>{title}</Text>
  </Pressable>;
}
export function IconButton({ name, label, onPress }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconButton}><Ionicons name={name} size={23} color={c.text} /></Pressable>;
}
export function Progress({ total, purchased }: { total: number; purchased: number }) {
  return <View style={{ gap: 10 }}><View style={s.between}><Text style={s.caption}>{purchased} de {total} produtos</Text><Text style={[s.caption, { color: c.green, fontWeight: '700' }]}>{total ? Math.round(purchased / total * 100) : 0}%</Text></View>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total || 1, now: purchased }} style={s.track}><View style={{ width: `${total ? purchased / total * 100 : 0}%`, height: 5, backgroundColor: c.green, borderRadius: 5 }} /></View></View>;
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return <View style={s.empty}><View style={s.emptyIcon}><Ionicons name="bag-check-outline" size={44} color={c.green} /></View><Text style={s.sectionTitle}>{title}</Text><Text style={[s.caption, { textAlign: 'center', lineHeight: 23 }]}>{detail}</Text></View>;
}
export function Sheet({ visible, title, close, children }: { visible: boolean; title: string; close: () => void; children: React.ReactNode }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
    <SafeAreaView edges={['bottom', 'top']} style={s.sheet}><View style={s.between}><Text style={s.sectionTitle}>{title}</Text><IconButton name="close" label="Fechar formulário" onPress={close} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>{children}</ScrollView></SafeAreaView>
  </KeyboardAvoidingView></Modal>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, content: { padding: 24, gap: 24, width: '100%', maxWidth: 680, alignSelf: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 32, fontWeight: '800', color: c.text, letterSpacing: -1 }, sectionTitle: { fontSize: 21, fontWeight: '700', color: c.text, flexShrink: 1 },
  caption: { color: c.secondary, fontSize: 14 }, eyebrow: { color: c.green, fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },
  button: { minHeight: 54, borderRadius: 17, padding: 15, gap: 9, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: c.green },
  subtle: { backgroundColor: c.pale }, buttonText: { color: c.white, fontWeight: '700', fontSize: 16 },
  iconButton: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  card: { backgroundColor: c.white, borderRadius: 22, padding: 20, gap: 18, borderWidth: 1, borderColor: c.border },
  track: { height: 5, backgroundColor: c.pale, borderRadius: 5, overflow: 'hidden' },
  empty: { paddingVertical: 40, paddingHorizontal: 18, alignItems: 'center', gap: 16 }, emptyIcon: { backgroundColor: c.pale, borderRadius: 26, padding: 24, marginBottom: 8 },
  filter: { minHeight: 48, padding: 12, justifyContent: 'center', borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.border },
  input: { backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 14, minHeight: 54, padding: 15, fontSize: 17, color: c.text },
  label: { fontSize: 14, fontWeight: '700', color: c.text }, error: { color: c.danger, fontSize: 14, lineHeight: 21 },
  overlay: { flex: 1, backgroundColor: '#15281F80', justifyContent: 'flex-end' }, sheet: { backgroundColor: c.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%', gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' },
});
