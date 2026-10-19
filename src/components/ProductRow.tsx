import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Product } from '../types/models';
import { IconButton, s } from './ui';
import { colors as c } from '../theme';
export function ProductRow({ product: p, toggle, options, busy }: { product: Product; toggle: () => void; options: () => void; busy: boolean }) {
  const [scale] = useState(() => new Animated.Value(1)); const previous = useRef(p.purchased);
  useEffect(() => {
    if (previous.current === p.purchased) return;
    previous.current = p.purchased;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!reduced) Animated.sequence([Animated.timing(scale, { toValue: .97, duration: 80, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 3 })]).start();
    });
  }, [p.purchased, scale]);
  return <Animated.View style={[s.card, { padding: 8, flexDirection: 'row', alignItems: 'center', gap: 0, transform: [{ scale }], backgroundColor: p.purchased ? '#EFF5F0' : c.white }]}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!p.purchased, disabled: busy }} accessibilityLabel={`${p.name}, ${p.quantity} ${p.unit}`} disabled={busy} onPress={toggle} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 14, minHeight: 64 }}>
      <Ionicons name={p.purchased ? 'checkbox' : 'square-outline'} size={28} color={p.purchased ? c.green : c.secondary} />
      <View style={{ flex: 1, gap: 5 }}><Text style={{ fontSize: 17, fontWeight: '600', color: p.purchased ? c.secondary : c.text, textDecorationLine: p.purchased ? 'line-through' : 'none' }}>{p.name}</Text><Text style={s.caption}>{p.quantity.toLocaleString('pt-BR')} {p.unit}{p.category ? ` · ${p.category}` : ''}</Text></View>
    </Pressable><IconButton name="ellipsis-horizontal" label={`Editar ou excluir ${p.name}`} onPress={options} />
  </Animated.View>;
}
