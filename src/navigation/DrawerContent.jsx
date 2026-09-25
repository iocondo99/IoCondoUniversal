import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import { useSettings } from '../context/SettingsProvider';
import { vociPerRuolo } from './menu';
import Icon from '../components/Icon';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { colors, radius, font, spacing, touch } from '../theme';

/*
  Contenuto personalizzato del Drawer.
  - intestazione con nome utente e ruolo
  - voci filtrate per ruolo + visibilità admin (come nel web)
  - evidenziazione della voce attiva
  - selettore lingua + logout in fondo
*/
export default function DrawerContent(props) {
  const { state, navigation } = props;
  const { t } = useTranslation();
  const { profilo, logout, isAdmin, isPortiere, condominioId } = useAuth();
  const { isVisible } = useSettings();
  const insets = useSafeAreaInsets();

  const tutte = vociPerRuolo({ isAdmin, isPortiere });
  const voci = isAdmin
    ? tutte
    : tutte.filter((v) => v.key === 'home' || isVisible(v.key, condominioId));

  const activeRoute = state.routeNames[state.index];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.brand}>🏛️ {t('app.name')}</Text>
        {!!profilo && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.userName}>{profilo.nome} {profilo.cognome}</Text>
            <Text style={styles.userRole}>{t(`roles.${profilo.ruolo_principale}`)}</Text>
          </View>
        )}
      </View>

      {/* Voci */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.items}>
        {voci.map((v) => {
          const active = activeRoute === v.route;
          return (
            <Pressable
              key={v.route}
              onPress={() => navigation.navigate(v.route)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Icon name={v.icon} size={22} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                {t(`nav.${v.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <LanguageSwitcher />
        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>{t('nav.logout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  brand: { color: colors.primaryInk, fontSize: font.h3, fontWeight: font.black },
  userName: { color: colors.primaryInk, fontWeight: font.bold, fontSize: font.body },
  userRole: { color: '#CFE0E3', fontSize: font.small, marginTop: 2 },
  items: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    minHeight: touch, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    marginBottom: 4,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  itemLabel: { fontSize: font.body, color: colors.inkSoft, fontWeight: font.medium },
  itemLabelActive: { color: colors.primary, fontWeight: font.bold },
  footer: {
    borderTopWidth: 1, borderTopColor: colors.line, padding: spacing.lg, gap: spacing.md,
  },
  logout: {
    minHeight: touch, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSoft,
  },
  logoutText: { fontWeight: font.bold, color: colors.ink, fontSize: font.body },
});
