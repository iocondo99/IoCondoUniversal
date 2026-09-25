import { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

export default function ContattiScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { condominioIds } = useAuth();
  const [admins, setAdmins] = useState(null);

  useEffect(() => {
    (async () => {
      if (!condominioIds.length) { setAdmins([]); return; }
      const { data, error } = await supabase
        .from('condominio')
        .select('id, denominazione, amministratore:amministratore_id ( nome, cognome, email, telefono )')
        .in('id', condominioIds);
      if (error) toast.error(error, 'contatti');
      setAdmins(data || []);
    })();
  }, [JSON.stringify(condominioIds)]);

  if (!admins) return <Screen><Spinner /></Screen>;

  return (
    <Screen>
      <PageHeader title={t('contatti.title')} subtitle={t('contatti.subtitle')} />
      {admins.length === 0 ? (
        <EmptyState icon="📇" title={t('contatti.empty')} text="" />
      ) : (
        <View style={{ gap: spacing.md }}>
          {admins.map((c) => {
            const a = c.amministratore;
            return (
              <Card key={c.id}>
                <Text style={styles.building}>{c.denominazione}</Text>
                <Text style={styles.admin}>
                  {t('contatti.admin')}: {a ? `${a.nome} ${a.cognome}` : '—'}
                </Text>
                {!!a?.email && (
                  <Pressable onPress={() => Linking.openURL(`mailto:${a.email}`)}>
                    <Text style={styles.link}>✉️ {a.email}</Text>
                  </Pressable>
                )}
                {!!a?.telefono && (
                  <Pressable onPress={() => Linking.openURL(`tel:${a.telefono}`)}>
                    <Text style={styles.link}>📞 {a.telefono}</Text>
                  </Pressable>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  building: { color: colors.muted, fontSize: font.tiny, textTransform: 'uppercase', letterSpacing: 0.5 },
  admin: { fontWeight: font.bold, fontSize: font.body, color: colors.ink, marginTop: 4, marginBottom: 8 },
  link: { color: colors.primary, fontSize: font.body, marginTop: 6, fontWeight: font.medium },
});
