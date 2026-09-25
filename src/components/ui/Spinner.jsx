import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, font, spacing } from '../../theme';

export default function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label || t('common.loading', 'Caricamento…')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: spacing.md, color: colors.muted, fontSize: font.body },
});
