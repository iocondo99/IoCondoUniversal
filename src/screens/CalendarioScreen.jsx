import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const tipoColore = { assemblea: colors.secondary, scadenza: colors.warn, manutenzione: colors.neutral, evento: colors.primary };

export default function CalendarioScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { condominioIds } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    (async () => {
      const has = condominioIds.length;
      const scope = (q, col = 'condominio_id') => (has ? q.in(col, condominioIds) : q);
      const [ev, ass] = await Promise.all([
        scope(supabase.from('evento_calendario').select('id, titolo, data_inizio, tipologia, condominio_id')),
        scope(supabase.from('assemblea').select('id, tipologia, data_ora, condominio_id')),
      ]);
      if (ev.error) toast.error(ev.error, 'calendario');
      let rate = { data: [] };
      if (has) {
        const { data: es } = await supabase.from('esercizio_contabile').select('id').in('condominio_id', condominioIds);
        const esIds = (es || []).map((x) => x.id);
        if (esIds.length) rate = await supabase.from('rata').select('id, descrizione, data_scadenza').in('esercizio_id', esIds);
      }
      const list = [
        ...(ev.data || []).map((e) => ({ id: 'e' + e.id, when: e.data_inizio, tipo: e.tipologia || 'evento', titolo: e.titolo })),
        ...(ass.data || []).map((a) => ({ id: 'a' + a.id, when: a.data_ora, tipo: 'assemblea', titolo: t('detail.titles.assemblee') + ' · ' + t(`enums.tipologiaAssemblea.${a.tipologia}`, { defaultValue: a.tipologia || '' }) })),
        ...((rate.data) || []).map((r) => ({ id: 'r' + r.id, when: r.data_scadenza, tipo: 'scadenza', titolo: t('bills.installment') + ' · ' + (r.descrizione || '') })),
      ].filter((x) => x.when).sort((a, b) => new Date(a.when) - new Date(b.when));
      setItems(list);
    })();
  }, [JSON.stringify(condominioIds)]);

  if (!items) return <Screen><Spinner /></Screen>;

  return (
    <Screen scroll={false}>
      <PageHeader title={t('calendario.title')} subtitle={t('calendario.subtitle')} />
      {items.length === 0 ? (
        <EmptyState icon="📅" title={t('calendario.empty')} text="" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: it }) => (
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{it.titolo}</Text>
                <Text style={styles.meta}>{dataIt(it.when)}</Text>
              </View>
              <Badge color={tipoColore[it.tipo] || tipoColore.evento}>
                {t(`enums.eventoTipo.${it.tipo}`, { defaultValue: it.tipo })}
              </Badge>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontWeight: font.bold, fontSize: font.body, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 2 },
});
