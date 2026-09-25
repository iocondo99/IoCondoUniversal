import { View, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, maxContentWidth } from '../theme';

/*
  Screen — contenitore standard delle pagine.
  - sfondo app coerente
  - padding comodo
  - contenuto centrato e con larghezza massima su schermi larghi (web/tablet)
    così il testo non si "stira".
  Se `scroll` è false usa una View semplice (per pagine con FlatList proprie).
*/
export default function Screen({ children, scroll = true, style, contentStyle }) {
  if (scroll) {
    return (
      <ScrollView style={[styles.bg, style]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inner, contentStyle]}>{children}</View>
      </ScrollView>
    );
  }
  return (
    <View style={[styles.bg, styles.scrollContent, style]}>
      <View style={[styles.inner, { flex: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.xl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: maxContentWidth },
});
