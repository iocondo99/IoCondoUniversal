import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { euro } from '../lib/format';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing, radius } from '../theme';

/*
  Spese per categoria (R16): somma dettaglio_bollettino per categoria_spesa.
*/
export default function SpeseScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { condominioIds } = useAuth();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('dettaglio_bollettino')
        .select('importo, categoria:categoria_spesa_id ( nome, colore_hex, condominio_id )');
      if (error) toast.error(error, 'spese');
      setRows(data || []);
    })();
  }, []);

  if (!rows) return <Screen><Spinner /></Screen>;

  const perCat = {};
  for (const r of rows) {
    const cat = r.categoria;
    if (!cat) continue;
    if (condominioIds.length && cat.condominio_id && !condominioIds.includes(cat.condominio_id)) continue;
    const key = cat.nome || '—';
    if (!perCat[key]) perCat[key] = { val: 0, color: cat.colore_hex };
    perCat[key].val += Number(r.importo || 0);
  }
  const cats = Object.entries(perCat).sort((a, b) => b[1].val - a[1].val);
  const totale = cats.reduce((s, [, v]) => s + v.val, 0);

  return (
    <Screen>
      <PageHeader title={t('spese.title')} subtitle={t('spese.subtitle')} />
      {cats.length === 0 ? (
        <EmptyState icon="💸" title={t('spese.empty')} text="" />
      ) : (
        <View style={{ gap: spacing.md }}>
          {cats.map(([nome, { val, color }]) => {
            const pct = totale ? Math.round((val / totale) * 100) : 0;
            return (
              <Card key={nome}>
                <View style={styles.rowBetween}>
                  <Text style={styles.name}>{nome}</Text>
                  <Text style={styles.name}>{euro(val)} · {pct}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color || colors.primary }]} />
                </View>
              </Card>
            );
          })}
          <Card style={styles.rowBetween}>
            <Text style={styles.total}>{t('spese.total')}</Text>
            <Text style={styles.total}>{euro(totale)}</Text>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: font.bold, color: colors.ink, fontSize: font.body },
  track: { height: 12, backgroundColor: colors.bgSoft, borderRadius: radius.pill, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', borderRadius: radius.pill },
  total: { fontWeight: font.black, fontSize: font.h3, color: colors.ink },
});
