import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import { isConfigured } from '../lib/supabase';
import { useToast } from '../context/ToastProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { colors, radius, font, spacing, touch, maxContentWidth } from '../theme';

const demo = [
  ['admin@demo.it', 'admin'],
  ['mario@demo.it', 'mario'],
  ['portiere@demo.it', 'portiere'],
];

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attesa, setAttesa] = useState(false);

  const entra = async () => {
    setAttesa(true);
    const { error } = await login(email, password);
    setAttesa(false);
    if (error) toast.error(error, 'login');
    // Se ok, l'AuthProvider aggiorna la sessione e il RootNavigator mostra l'app.
  };

  const provaCon = (em) => { setEmail(em); setPassword('Demo1234!'); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <View style={styles.langRow}><LanguageSwitcher /></View>

          <View style={styles.brand}>
            <Text style={styles.logo}>🏛️</Text>
            <Text style={styles.title}>{t('app.name')}</Text>
            <Text style={styles.tagline}>{t('app.loginTagline')}</Text>
          </View>

          <Card>
            {!isConfigured && (
              <View style={styles.warn}>
                <Text style={styles.warnText}>{t('auth.envWarning')}</Text>
              </View>
            )}

            <Text style={styles.label}>{t('auth.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>{t('auth.passwordLabel')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoComplete="password"
            />

            <Button
              onPress={entra}
              disabled={!isConfigured}
              loading={attesa}
              style={{ marginTop: spacing.lg }}
            >
              {attesa ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </Card>

          <Text style={styles.demoHint}>{t('auth.demoHint')}</Text>
          <View style={styles.demoRow}>
            {demo.map(([em, key]) => (
              <Button key={em} variant="soft" onPress={() => provaCon(em)}
                style={styles.demoBtn} textStyle={{ fontSize: font.small }}>
                {t(`auth.demo.${key}`)}
              </Button>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  container: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  langRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 52 },
  title: { fontSize: font.h1, fontWeight: font.black, color: colors.ink, marginTop: 4 },
  tagline: { fontSize: font.body, color: colors.muted, textAlign: 'center', marginTop: 4 },
  warn: { backgroundColor: colors.warnSoft, borderRadius: radius.sm, padding: 14, marginBottom: 18 },
  warnText: { color: colors.inkSoft },
  label: { fontWeight: font.medium, color: colors.inkSoft, marginBottom: 6 },
  input: {
    minHeight: touch, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: 14, fontSize: font.body, color: colors.ink, backgroundColor: colors.card,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  demoHint: { textAlign: 'center', color: colors.muted, fontSize: font.small, marginTop: spacing.xl, marginBottom: spacing.sm },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  demoBtn: { paddingHorizontal: 16 },
});
