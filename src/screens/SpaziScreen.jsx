import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import { PRENOTAZIONE_STATO_NUOVA, PRENOTAZIONE_STATO_ANNULLATA } from '../lib/dbEnums';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import useResponsive from '../components/useResponsive';
import { colors, font, spacing } from '../theme';

/*
  Prenotazione spazi comuni (R11). Le date sono inserite come testo
  ISO (YYYY-MM-DDTHH:mm) tramite Field: universale e senza dipendenze extra.
*/
export default function SpaziScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { condominioIds, session } = useAuth();
  const { columns } = useResponsive();
  const [spazi, setSpazi] = useState(null);
  const [mie, setMie] = useState([]);
  const [unitaByCond, setUnitaByCond] = useState({});
  const [target, setTarget] = useState(null);
  const [bozza, setBozza] = useState({ inizio: '', fine: '', motivo: '' });
  const [saving, setSaving] = useState(false);

  const carica = useCallback(async () => {
    let qs = supabase.from('spazio_comune').select('id, nome, descrizione, capienza_max, condominio_id').eq('attivo', true);
    if (condominioIds.length) qs = qs.in('condominio_id', condominioIds);
    const { data, error } = await qs;
    if (error) toast.error(error, 'spazi');
    setSpazi(data || []);

    if (session) {
      const { data: links } = await supabase.from('condomino_unita')
        .select('unita:unita_id ( id, condominio_id )').eq('condomino_id', session.user.id);
      const map = {};
      for (const l of links || []) if (l.unita?.condominio_id && !map[l.unita.condominio_id]) map[l.unita.condominio_id] = l.unita.id;
      setUnitaByCond(map);

      const { data: pren } = await supabase.from('prenotazione_spazio')
        .select('id, data_inizio, data_fine, stato, spazio:spazio_id ( nome )')
        .eq('condomino_id', session.user.id).neq('stato', PRENOTAZIONE_STATO_ANNULLATA)
        .order('data_inizio', { ascending: true });
      setMie(pren || []);
    }
  }, [JSON.stringify(condominioIds)]);

  useEffect(() => { carica(); }, [carica]);

  const apri = (s) => { setTarget(s); setBozza({ inizio: '', fine: '', motivo: '' }); };

  const prenota = async () => {
    const unitaId = unitaByCond[target.condominio_id];
    if (!unitaId) { toast.error({ message: 'no unit' }, 'prenota'); return; }
    setSaving(true);
    const { error } = await supabase.from('prenotazione_spazio').insert({
      spazio_id: target.id, condomino_id: session.user.id, unita_id: unitaId,
      data_inizio: bozza.inizio, data_fine: bozza.fine, motivo: bozza.motivo || null,
      stato: PRENOTAZIONE_STATO_NUOVA,
    });
    setSaving(false);
    if (error) { toast.error(error, 'prenota'); return; }
    toast.success(t('spazi.booked'));
    setTarget(null); carica();
  };

  const annulla = async (id) => {
    const { error } = await supabase.from('prenotazione_spazio').update({ stato: PRENOTAZIONE_STATO_ANNULLATA }).eq('id', id);
    if (error) { toast.error(error, 'annulla prenotazione'); return; }
    carica();
  };

  if (!spazi) return <Screen><Spinner /></Screen>;

  return (
    <Screen>
      <PageHeader title={t('spazi.title')} subtitle={t('spazi.subtitle')} />

      {spazi.length === 0 ? (
        <EmptyState icon="🛋️" title={t('spazi.empty')} text="" />
      ) : (
        <View style={styles.grid}>
          {spazi.map((s) => (
            <View key={s.id} style={{ width: `${100 / columns}%`, padding: spacing.sm }}>
              <Card>
                <Text style={styles.spazioIcon}>🛋️</Text>
                <Text style={styles.spazioName}>{s.nome}</Text>
                {!!s.descrizione && <Text style={styles.meta}>{s.descrizione}</Text>}
                {s.capienza_max != null && <Text style={styles.meta}>{t('spazi.capacity')}: {s.capienza_max}</Text>}
                <Button onPress={() => apri(s)} style={{ marginTop: 12 }}>{t('spazi.book')}</Button>
              </Card>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.section}>{t('spazi.myBookings')}</Text>
      {mie.length === 0 ? (
        <Text style={styles.meta}>{t('spazi.noBookings')}</Text>
      ) : (
        <View style={{ gap: spacing.md }}>
          {mie.map((p) => (
            <Card key={p.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.spazioName}>{p.spazio?.nome}</Text>
                <Text style={styles.meta}>{dataIt(p.data_inizio)} → {dataIt(p.data_fine)}</Text>
              </View>
              <Button variant="ghost" onPress={() => annulla(p.id)} textStyle={{ color: colors.bad }}>
                {t('spazi.cancel')}
              </Button>
            </Card>
          ))}
        </View>
      )}

      <Modal open={!!target} title={target ? t('spazi.bookTitle', { name: target.nome }) : ''} onClose={() => setTarget(null)}
        footer={<>
          <Button variant="ghost" onPress={() => setTarget(null)}>{t('common.cancel')}</Button>
          <Button onPress={prenota} loading={saving} disabled={!bozza.inizio || !bozza.fine}>{t('spazi.book')}</Button>
        </>}>
        <Field field={{ name: 'inizio', label: t('spazi.from'), placeholder: 'YYYY-MM-DD HH:mm' }}
          value={bozza.inizio} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'fine', label: t('spazi.to'), placeholder: 'YYYY-MM-DD HH:mm' }}
          value={bozza.fine} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'motivo', label: t('spazi.note'), type: 'textarea' }}
          value={bozza.motivo} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  spazioIcon: { fontSize: 30, marginBottom: 8 },
  spazioName: { fontSize: font.h3, fontWeight: font.bold, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 4 },
  section: { fontSize: font.h2, fontWeight: font.bold, color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
