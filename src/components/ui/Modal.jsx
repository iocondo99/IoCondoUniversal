import { Modal as RNModal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, font, spacing, shadow } from '../../theme';

/*
  Modal — bottom/centered sheet universale.
  API identica al web: open, title, onClose, children, footer.
*/
export default function Modal({ open, title, onClose, children, footer }) {
  const { t } = useTranslation();
  return (
    <RNModal visible={!!open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel={t('common.close', 'Chiudi')} hitSlop={12}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(22,35,42,.45)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  sheet: {
    backgroundColor: colors.card, borderRadius: radius.md,
    width: '100%', maxWidth: 560, maxHeight: '90%', ...shadow,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  title: { fontSize: font.h2, fontWeight: font.bold, color: colors.ink, flex: 1 },
  close: { fontSize: 28, color: colors.muted, lineHeight: 30 },
  body: { padding: spacing.xl },
  footer: {
    flexDirection: 'row', gap: 12, justifyContent: 'flex-end',
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line,
  },
});
