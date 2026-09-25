import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { ENUM_GROUPS } from '../lib/enums';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const iconaRifiuto = { umido: '🥬', organico: '🥬', plastica: '♻️', carta: '📄', vetro: '🍾', indifferenziato: '🗑️', metallo: '🥫' };

export default function RaccoltaScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { condominioIds } = useAuth();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from('raccolta_differenziata').select('id, tipo_rifiuto, giorno_settimana, orario_esposizione, condominio_id');
      if (condominioIds.length) q = q.in('condominio_id', condominioIds);
      const { data, error } = await q;
      if (error) toast.error(error, 'raccolta');
      setRows(data || []);
    })();
  }, [JSON.stringify(condominioIds)]);

  if (!rows) return <Screen><Spinner /></Screen>;

  const ordine = ENUM_GROUPS.giorniSettimana;
  const sorted = [...rows].sort((a, b) => ordine.indexOf(a.giorno_settimana) - ordine.indexOf(b.giorno_settimana));

  return (
    <Screen scroll={false}>
      <PageHeader title={t('raccoltaPage.title')} subtitle={t('raccoltaPage.subtitle')} />
      {sorted.length === 0 ? (
        <EmptyState icon="♻️" title={t('raccoltaPage.empty')} text="" />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: r }) => (
            <Card style={styles.row}>
              <Text style={styles.icon}>{iconaRifiuto[r.tipo_rifiuto] || '🗑️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t(`enums.tipoRifiuto.${r.tipo_rifiuto}`, { defaultValue: r.tipo_rifiuto })}</Text>
                <Text style={styles.meta}>
                  {r.giorno_settimana != null ? t(`enums.giorniSettimana.${r.giorno_settimana}`) : '—'}
                  {r.orario_esposizione ? ` · ${r.orario_esposizione}` : ''}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: { fontSize: 30 },
  title: { fontWeight: font.bold, fontSize: font.body, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 2 },
});
