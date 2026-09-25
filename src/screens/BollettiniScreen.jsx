import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastProvider';
import { euro, dataIt } from '../lib/format';
import { bollettinoPdf } from '../lib/pdf';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const statoColore = {
  pagato: colors.ok, parziale: colors.warn, scaduto: colors.bad, non_pagato: colors.neutral,
};

export default function BollettiniScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [righe, setRighe] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('bollettino')
        .select(`id, importo_dovuto, importo_pagato, stato_pagamento,
                 rata:rata_id ( descrizione, data_scadenza ),
                 unita:unita_id ( identificativo, condominio:condominio_id ( denominazione ) )`)
        .order('id');
      if (error) toast.error(error, 'bollettini');
      setRighe(data || []);
    })();
  }, []);

  if (!righe) return <Screen><Spinner /></Screen>;

  const pdfLabels = {
    title: t('bills.title'), building: t('detail.f.esercizio'), unit: t('detail.f.unita'),
    installment: t('bills.installment'), due: t('detail.f.scadenza'),
    amountDue: t('detail.f.importo_dovuto'), amountPaid: t('detail.f.importo_pagato'), status: t('detail.f.stato'),
    status_pagato: t('bills.status.pagato'), status_parziale: t('bills.status.parziale'),
    status_scaduto: t('bills.status.scaduto'), status_non_pagato: t('bills.status.non_pagato'),
  };

  return (
    <Screen scroll={false}>
      <PageHeader title={t('bills.title')} subtitle={t('bills.subtitle')} />
      {righe.length === 0 ? (
        <EmptyState icon="🧾" title={t('bills.emptyTitle')} text={t('bills.emptyText')} />
      ) : (
        <FlatList
          data={righe}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: b }) => {
            const stato = b.stato_pagamento || 'non_pagato';
            return (
              <Card>
                <View style={styles.top}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{b.rata?.descrizione || t('bills.installment')}</Text>
                    <Text style={styles.meta}>
                      {b.unita?.condominio?.denominazione} · {b.unita?.identificativo} · {t('bills.dueShort', { date: dataIt(b.rata?.data_scadenza) })}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{euro(b.importo_dovuto)}</Text>
                </View>
                <View style={styles.bottom}>
                  <Badge color={statoColore[stato] || statoColore.non_pagato}>{t(`bills.status.${stato}`)}</Badge>
                  <Button variant="soft" onPress={() => bollettinoPdf(b, pdfLabels)}>⬇ {t('common.downloadPdf')}</Button>
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontWeight: font.bold, fontSize: font.body, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 4 },
  amount: { fontSize: font.h2, fontWeight: font.black, color: colors.ink },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
});
