import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { notificaCondominio } from '../lib/notifiche';
import { VOTO_SCELTE, PARTECIPAZIONE_MODALITA } from '../lib/dbEnums';
import { dataIt } from '../lib/format';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing, radius } from '../theme';

/*
  Assemblee (R9 voto anonimo a token, R10 millesimi pesati, R18 archivio).
  Stessa logica del web: assemblea -> punto_odg -> partecipazione_assemblea
  -> voto_token_emesso -> votazione (voto anonimo pesato per millesimi).
*/
function genToken() {
  // UUID doppio senza trattini, 64 char (come il web con crypto.randomUUID()).
  const rnd = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  return (rnd() + rnd()).replace(/-/g, '').slice(0, 64);
}

export default function AssembleeScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { session, condominioIds, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [voteFor, setVoteFor] = useState(null);
  const [newFor, setNewFor] = useState(null);
  const [pForm, setPForm] = useState({ titolo: '', descrizione: '' });
  const [busy, setBusy] = useState(false);

  const carica = useCallback(async () => {
    let qa = supabase.from('assemblea')
      .select('id, tipologia, convocazione, data_ora, luogo, modalita, ordine_giorno, stato, condominio_id')
      .order('data_ora', { ascending: false });
    if (condominioIds.length) qa = qa.in('condominio_id', condominioIds);
    const { data: assemblee, error } = await qa;
    if (error) toast.error(error, 'assemblee');
    const aIds = (assemblee || []).map((a) => a.id);

    let punti = [], myTokens = [], voti = [];
    if (aIds.length) {
      const { data: po } = await supabase.from('punto_odg')
        .select('id, assemblea_id, ordine, titolo, descrizione, richiede_voto, esito').in('assemblea_id', aIds).order('ordine');
      punti = po || [];
      const pIds = punti.map((p) => p.id);

      const { data: part } = await supabase.from('partecipazione_assemblea')
        .select('id, millesimi_rappresentati').eq('condomino_id', session.user.id).in('assemblea_id', aIds);
      const partMill = {}; (part || []).forEach((p) => { partMill[p.id] = Number(p.millesimi_rappresentati || 0); });
      const partIds = (part || []).map((p) => p.id);

      if (pIds.length && partIds.length) {
        const { data: tk } = await supabase.from('voto_token_emesso')
          .select('id, punto_odg_id, partecipazione_id, token_anonimo, usato').in('punto_odg_id', pIds).in('partecipazione_id', partIds);
        myTokens = (tk || []).map((x) => ({ ...x, millesimi: partMill[x.partecipazione_id] || 0 }));
      }
      if (pIds.length) {
        const { data: vt } = await supabase.from('votazione').select('punto_odg_id, voto, millesimi_voto').in('punto_odg_id', pIds);
        voti = vt || [];
      }
    }
    setData({ assemblee: assemblee || [], punti, myTokens, voti });
  }, [JSON.stringify(condominioIds)]);

  useEffect(() => { carica(); }, [carica]);

  if (!data) return <Screen><Spinner /></Screen>;
  const { assemblee, punti, myTokens, voti } = data;

  const puntiOf = (aId) => punti.filter((p) => p.assemblea_id === aId);
  const myTokensFor = (pId) => myTokens.filter((tk) => tk.punto_odg_id === pId);
  const myUnused = (pId) => myTokensFor(pId).filter((tk) => !tk.usato);
  const resultsOf = (pId) => {
    const r = {}; VOTO_SCELTE.forEach((s) => (r[s] = 0));
    for (const v of voti.filter((x) => x.punto_odg_id === pId)) r[v.voto] = (r[v.voto] || 0) + Number(v.millesimi_voto || 0);
    return r;
  };

  const vota = async (scelta) => {
    const p = voteFor;
    const tokens = myUnused(p.id);
    if (!tokens.length) { toast.show(t('errors.noVoteRight'), 'error'); setVoteFor(null); return; }
    setBusy(true);
    for (const tk of tokens) {
      const ins = await supabase.from('votazione').insert({ punto_odg_id: p.id, token_anonimo: tk.token_anonimo, voto: scelta, millesimi_voto: tk.millesimi });
      if (ins.error) { setBusy(false); toast.error(ins.error, 'voto'); return; }
      await supabase.from('voto_token_emesso').update({ usato: true }).eq('id', tk.id);
    }
    setBusy(false); setVoteFor(null); toast.success(t('assemblee.vote')); carica();
  };

  const creaPunto = async () => {
    setBusy(true);
    const a = newFor;
    const ordine = puntiOf(a.id).length + 1;
    const { error } = await supabase.from('punto_odg')
      .insert({ assemblea_id: a.id, ordine, titolo: pForm.titolo, descrizione: pForm.descrizione || null, richiede_voto: true });
    setBusy(false);
    if (error) { toast.error(error, 'crea punto odg'); return; }
    setNewFor(null); setPForm({ titolo: '', descrizione: '' }); toast.success(t('assemblee.newVoting')); carica();
  };

  const generaToken = async (a, p) => {
    setBusy(true);
    try {
      const { data: unita } = await supabase.from('unita_immobiliare').select('id, millesimi_proprieta').eq('condominio_id', a.condominio_id);
      const millById = {}; (unita || []).forEach((u) => { millById[u.id] = Number(u.millesimi_proprieta || 0); });
      const uIds = (unita || []).map((u) => u.id);
      if (!uIds.length) { setBusy(false); return; }
      const { data: links } = await supabase.from('condomino_unita').select('condomino_id, unita_id').in('unita_id', uIds);

      const { data: partEx } = await supabase.from('partecipazione_assemblea').select('id, unita_id, condomino_id').eq('assemblea_id', a.id);
      const partKey = (cid, uid) => cid + '|' + uid;
      const partMap = {}; (partEx || []).forEach((pp) => { partMap[partKey(pp.condomino_id, pp.unita_id)] = pp.id; });

      const daCreare = (links || []).filter((l) => !partMap[partKey(l.condomino_id, l.unita_id)]);
      if (daCreare.length) {
        const rows = daCreare.map((l) => ({
          assemblea_id: a.id, unita_id: l.unita_id, condomino_id: l.condomino_id,
          modalita: PARTECIPAZIONE_MODALITA, millesimi_rappresentati: millById[l.unita_id] || 0,
        }));
        const { data: created, error } = await supabase.from('partecipazione_assemblea').insert(rows).select('id, unita_id, condomino_id');
        if (error) throw error;
        (created || []).forEach((pp) => { partMap[partKey(pp.condomino_id, pp.unita_id)] = pp.id; });
      }

      const { data: tkEx } = await supabase.from('voto_token_emesso').select('partecipazione_id').eq('punto_odg_id', p.id);
      const conToken = new Set((tkEx || []).map((x) => x.partecipazione_id));
      const tokenRows = Object.values(partMap).filter((pid) => !conToken.has(pid)).map((pid) => ({
        punto_odg_id: p.id, partecipazione_id: pid, token_anonimo: genToken(), usato: false,
      }));
      if (tokenRows.length) {
        const { error } = await supabase.from('voto_token_emesso').insert(tokenRows);
        if (error) throw error;
      }
      toast.success(t('assemblee.openVoting'));
      carica();
    } catch (err) { toast.error(err, 'genera token'); } finally { setBusy(false); }
  };

  const convoca = async (a) => {
    const { error } = await notificaCondominio({
      condominio_id: a.condominio_id, tipo_evento: 'assemblea', entita_riferimento: 'assemblea', entita_id: a.id,
      titolo: t('detail.titles.assemblee'), messaggio: `${dataIt(a.data_ora)}${a.luogo ? ' · ' + a.luogo : ''}`,
    });
    if (error) { toast.error(error, 'convoca'); return; }
    toast.success(t('assemblee.convoked'));
  };

  const renderPunto = (a, p) => {
    const unused = myUnused(p.id);
    const res = resultsOf(p.id);
    const totale = VOTO_SCELTE.reduce((s, k) => s + (res[k] || 0), 0);
    const haToken = myTokensFor(p.id).length > 0;
    return (
      <View key={p.id} style={styles.punto}>
        <View style={styles.puntoHead}>
          <Text style={styles.puntoTitle}>{p.ordine}. {p.titolo}</Text>
          {isAdmin && <Button variant="soft" onPress={() => generaToken(a, p)} disabled={busy}>{t('assemblee.openVoting')}</Button>}
        </View>
        {!!p.descrizione && <Text style={styles.meta}>{p.descrizione}</Text>}

        {p.richiede_voto && unused.length > 0 && (
          <Button onPress={() => setVoteFor(p)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>{t('assemblee.vote')}</Button>
        )}
        {haToken && unused.length === 0 && <Text style={[styles.meta, { marginTop: 8 }]}>✓ {t('assemblee.voted')}</Text>}

        <View style={{ marginTop: 10 }}>
          <Text style={styles.meta}>{t('assemblee.results')} ({t('assemblee.weight')})</Text>
          {VOTO_SCELTE.map((s) => {
            const val = res[s] || 0;
            const pct = totale ? Math.round((val / totale) * 100) : 0;
            return (
              <View key={s} style={{ marginTop: 4 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.small}>{t(`enums.votoScelta.${s}`, { defaultValue: s })}</Text>
                  <Text style={styles.small}>{Math.round(val)} · {pct}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <PageHeader title={t('assemblee.title')} subtitle={t('assemblee.subtitle')} />
      {assemblee.length === 0 ? (
        <EmptyState icon="🗳️" title={t('assemblee.empty')} text="" />
      ) : (
        <FlatList
          data={assemblee}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: a }) => (
            <Card>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {t(`enums.tipologiaAssemblea.${a.tipologia}`, { defaultValue: a.tipologia })} · {dataIt(a.data_ora)}
                  </Text>
                  {!!a.luogo && <Text style={styles.meta}>{a.luogo}</Text>}
                </View>
                {isAdmin && (
                  <View style={{ gap: 8 }}>
                    <Button variant="ghost" onPress={() => convoca(a)}>{t('assemblee.convoke')}</Button>
                    <Button onPress={() => setNewFor(a)}>{t('assemblee.newVoting')}</Button>
                  </View>
                )}
              </View>

              {!!a.ordine_giorno && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>{t('assemblee.agenda')}</Text>
                  <Text style={styles.body}>{a.ordine_giorno}</Text>
                </View>
              )}

              {puntiOf(a.id).length > 0 && (
                <View style={styles.puntiWrap}>
                  <Text style={styles.label}>{t('assemblee.votings')}</Text>
                  {puntiOf(a.id).map((p) => renderPunto(a, p))}
                </View>
              )}
            </Card>
          )}
        />
      )}

      {/* Modal voto */}
      <Modal open={!!voteFor} title={voteFor ? t('assemblee.voteTitle', { title: voteFor.titolo }) : ''} onClose={() => setVoteFor(null)}>
        <View style={{ gap: 10 }}>
          {VOTO_SCELTE.map((s) => (
            <Button key={s} variant={s === 'favorevole' ? 'primary' : 'ghost'} disabled={busy} onPress={() => vota(s)}>
              {t(`enums.votoScelta.${s}`, { defaultValue: s })}
            </Button>
          ))}
        </View>
      </Modal>

      {/* Modal nuovo punto odg (admin) */}
      <Modal open={!!newFor} title={t('assemblee.newVoting')} onClose={() => setNewFor(null)}
        footer={<>
          <Button variant="ghost" onPress={() => setNewFor(null)}>{t('common.cancel')}</Button>
          <Button onPress={creaPunto} loading={busy} disabled={!pForm.titolo}>{t('common.create')}</Button>
        </>}>
        <Field field={{ name: 'titolo', label: t('detail.f.titolo') }}
          value={pForm.titolo} onChange={(n, v) => setPForm({ ...pForm, [n]: v })} />
        <Field field={{ name: 'descrizione', label: t('detail.f.descrizione'), type: 'textarea' }}
          value={pForm.descrizione} onChange={(n, v) => setPForm({ ...pForm, [n]: v })} />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: font.h3, fontWeight: font.bold, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 4 },
  small: { color: colors.inkSoft, fontSize: font.small },
  label: { color: colors.muted, fontSize: font.tiny, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  body: { color: colors.ink, fontSize: font.body, marginTop: 4 },
  puntiWrap: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: spacing.md },
  punto: { backgroundColor: colors.bgSoft, borderRadius: radius.sm, padding: 14 },
  puntoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  puntoTitle: { fontWeight: font.bold, color: colors.ink, fontSize: font.body, flex: 1 },
  track: { height: 8, backgroundColor: colors.card, borderRadius: radius.pill, overflow: 'hidden', marginTop: 3 },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
});
