import { View, Text, StyleSheet } from 'react-native';
import { colors, softOf, radius, font } from '../../theme';

/*
  Badge di stato — pallino + testo, sfondo tenue coerente col colore.
  `color` è uno dei colori di stato del tema (colors.ok/warn/bad/...).
*/
export default function Badge({ color = colors.neutral, children }) {
  const soft = softOf[color] || colors.neutralSoft;
  return (
    <View style={[styles.badge, { backgroundColor: soft, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: radius.pill, borderWidth: 1.5, alignSelf: 'flex-start',
  },
  dot: { width: 9, height: 9, borderRadius: 999 },
  text: { fontWeight: font.bold, fontSize: font.tiny },
});
