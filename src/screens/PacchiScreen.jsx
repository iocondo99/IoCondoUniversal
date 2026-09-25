import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import { PACCO_STATO_GIACENZA, PACCO_STATO_RITIRATO } from '../lib/dbEnums';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const statoColore = { in_giacenza: colors.warn, ritirato: colors.ok, rispedito: colors.neutral };

export default function PacchiScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { session, condominioIds, isStaff } = useAuth();
  const [rows, setRows] = useState(null);
  const [unita, setUnita] = useState([]);
  const [open, setOpen] = useState(false);
  const [bozza, setBozza] = useState({ unita_id: '', corriere: '', descrizione: '' });
  const [saving, setSaving] = useState(false);

  const carica = useCallback(async () => {
    let q = supabase.from('pacco')
      .select('id, corriere, descrizione, stato, data_ricezione, condominio_id, unita:unita_id ( id, identificativo )')
      .order('data_ricezione', { ascending: false });

    if (!isStaff) {
      const { data: links } = await supabase.from('condomino_unita').select('unita_id').eq('condomino_id', session.user.id);
      const unitaIds = (links || []).map((l) => l.unita_id);
      q = q.in('unita_id', unitaIds.length ? unitaIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (condominioIds.length) {
      q = q.in('condominio_id', condominioIds);
    }
    const { data, error } = await q;
    if (error) toast.error(error, 'pacchi');
    setRows(data || []);

    if (isStaff) {
      let qu = supabase.from('unita_immobiliare').select('id, identificativo, condominio_id').order('identificativo');
      if (condominioIds.length) qu = qu.in('condominio_id', condominioIds);
      const { data: u } = await qu;
      setUnita(u || []);
      if (u?.[0]) setBozza((b) => ({ ...b, unita_id: b.unita_id || u[0].id }));
    }
  }, [isStaff, JSON.stringify(condominioIds)]);

  useEffect(() => { carica(); }, [carica]);

  const registra = async () => {
    setSaving(true);
    const u = unita.find((x) => x.id === bozza.unita_id);
    const { error } = await supabase.from('pacco').insert({
      unita_id: bozza.unita_id, condominio_id: u?.condominio_id, corriere: bozza.corriere || null,
      descrizione: bozza.descrizione || null, stato: PACCO_STATO_GIACENZA, ricevuto_da: session.user.id,
      data_ricezione: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast.error(error, 'registra pacco'); return; }
    toast.success(t('pacchiPage.new'));
    setOpen(false); setBozza((b) => ({ ...b, corriere: '', descrizione: '' })); carica();
  };

  const ritira = async (p) => {
    setRows((l) => l.map((x) => (x.id === p.id ? { ...x, stato: PACCO_STATO_RITIRATO } : x)));
    const { error } = await supabase.from('pacco')
      .update({ stato: PACCO_STATO_RITIRATO, data_ritiro: new Date().toISOString(), ritirato_da: session.user.id })
      .eq('id', p.id);
    if (error) { toast.error(error, 'ritiro pacco'); carica(); }
  };

  if (!rows) return <Screen><Spinner /></Screen>;

  const unitaOptions = unita.map((u) => ({ value: u.id, label: u.identificativo }));

  return (
    <Screen scroll={false}>
      <PageHeader
        title={t('pacchiPage.title')}
        subtitle={isStaff ? t('pacchiPage.subtitleStaff') : t('pacchiPage.subtitleResident')}
        action={isStaff ? <Button onPress={() => setOpen(true)}>{t('pacchiPage.new')}</Button> : null}
      />

      {rows.length === 0 ? (
        <EmptyState icon="📦" title={t('pacchiPage.empty')} text="" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: p }) => (
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>📦 {p.corriere || '—'}{p.descrizione ? ` · ${p.descrizione}` : ''}</Text>
                <Text style={styles.meta}>{t('pacchiPage.recipient')}: {p.unita?.identificativo || '—'} · {dataIt(p.data_ricezione)}</Text>
              </View>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <Badge color={statoColore[p.stato]}>{t(`enums.statoPacco.${p.stato}`, { defaultValue: p.stato })}</Badge>
                {isStaff && p.stato === PACCO_STATO_GIACENZA && (
                  <Button variant="soft" onPress={() => ritira(p)}>{t('pacchiPage.markCollected')}</Button>
                )}
              </View>
            </Card>
          )}
        />
      )}

      <Modal open={open} title={t('pacchiPage.new')} onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onPress={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button onPress={registra} loading={saving} disabled={!bozza.unita_id}>{t('common.confirm')}</Button>
        </>}>
        <Field field={{ name: 'unita_id', label: t('pacchiPage.recipient'), type: 'select', options: unitaOptions }}
          value={bozza.unita_id} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'corriere', label: t('detail.f.corriere') }}
          value={bozza.corriere} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'descrizione', label: t('detail.f.descrizione') }}
          value={bozza.descrizione} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontWeight: font.bold, fontSize: font.body, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 2 },
});
