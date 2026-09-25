import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const prioColore = { info: colors.neutral, importante: colors.warn, urgente: colors.bad };

export default function AvvisiScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [avvisi, setAvvisi] = useState(null);
  const [aperto, setAperto] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('avviso')
        .select('id, titolo, contenuto, priorita, data_pubblicazione, condominio:condominio_id ( denominazione )')
        .order('data_pubblicazione', { ascending: false });
      if (error) toast.error(error, 'avvisi');
      setAvvisi(data || []);
    })();
  }, []);

  if (!avvisi) return <Screen><Spinner /></Screen>;

  const prioLabel = (p) => t(`enums.prioritaAvviso.${p}`, p);

  return (
    <Screen scroll={false}>
      <PageHeader title={t('notices.title')} subtitle={t('notices.subtitle')} />
      {avvisi.length === 0 ? (
        <EmptyState icon="📣" title={t('notices.emptyTitle')} text={t('notices.emptyText')} />
      ) : (
        <FlatList
          data={avvisi}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: a }) => {
            const prio = a.priorita || 'info';
            return (
              <Card onPress={() => setAperto(a)}>
                <View style={styles.rowBetween}>
                  <Text style={styles.title} numberOfLines={1}>{a.titolo}</Text>
                  <Badge color={prioColore[prio]}>{prioLabel(prio)}</Badge>
                </View>
                <Text style={styles.meta}>
                  {a.condominio?.denominazione} · {dataIt(a.data_pubblicazione)}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>{a.contenuto}</Text>
              </Card>
            );
          }}
        />
      )}

      <Modal open={!!aperto} title={aperto?.titolo} onClose={() => setAperto(null)}>
        <Text style={styles.meta}>
          {aperto?.condominio?.denominazione} · {dataIt(aperto?.data_pubblicazione)}
        </Text>
        <Text style={styles.body}>{aperto?.contenuto}</Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: font.h3, fontWeight: font.bold, color: colors.ink, flex: 1 },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 6 },
  preview: { color: colors.inkSoft, fontSize: font.body, marginTop: 8 },
  body: { color: colors.ink, fontSize: font.body, marginTop: 12, lineHeight: 24 },
});
