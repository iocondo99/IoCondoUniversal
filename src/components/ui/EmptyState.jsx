import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../../theme';

export default function EmptyState({ icon = '📭', title, text }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 48, paddingHorizontal: 20, alignItems: 'center' },
  icon: { fontSize: 46, marginBottom: 10 },
  title: { color: colors.ink, fontSize: font.h3, fontWeight: font.bold, marginBottom: 6, textAlign: 'center' },
  text: { color: colors.muted, fontSize: font.body, textAlign: 'center' },
});
