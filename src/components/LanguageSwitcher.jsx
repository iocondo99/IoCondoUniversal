import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../i18n';
import Modal from './ui/Modal';
import { colors, radius, font, touch, spacing } from '../theme';

/*
  Selettore lingua — apre un piccolo elenco delle 8 lingue.
  Persiste la scelta via setLanguage (AsyncStorage).
*/
export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const choose = async (code) => {
    await setLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger} accessibilityLabel="Lingua">
        <Text style={styles.triggerText}>🌐 {compact ? current.code.toUpperCase() : current.label}</Text>
      </Pressable>

      <Modal open={open} title="🌐" onClose={() => setOpen(false)}>
        <View style={{ gap: 8 }}>
          {LANGUAGES.map((l) => {
            const active = l.code === i18n.language;
            return (
              <Pressable key={l.code} onPress={() => choose(l.code)}
                style={[styles.item, active && styles.itemActive]}>
                <Text style={[styles.itemText, active && styles.itemTextActive]}>{l.label}</Text>
                {active && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card,
    justifyContent: 'center',
  },
  triggerText: { fontWeight: font.medium, color: colors.ink, fontSize: font.small },
  item: {
    minHeight: touch, borderRadius: radius.sm, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgSoft,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  itemText: { fontSize: font.body, color: colors.ink, fontWeight: font.medium },
  itemTextActive: { color: colors.primary, fontWeight: font.bold },
  check: { color: colors.primary, fontWeight: font.bold, fontSize: font.body },
});
