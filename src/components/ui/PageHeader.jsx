import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../../theme';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    gap: 16, marginBottom: spacing.xl,
  },
  title: { fontSize: font.h1, fontWeight: font.black, color: colors.ink },
  subtitle: { fontSize: font.body, color: colors.muted, marginTop: 4 },
});
