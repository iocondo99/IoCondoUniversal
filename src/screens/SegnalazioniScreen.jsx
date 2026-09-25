import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import { tipoSegnalazione, useEnumOptions } from '../lib/enums';
import { SEGNALAZIONE_PRIORITA_DEFAULT } from '../lib/dbEnums';
import { uploadAsset, signedUrl } from '../lib/storage';
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

const statoColore = {
  aperta: colors.warn, in_lavorazione: colors.secondary, risolta: colors.ok,
  chiusa: colors.neutral, annullata: colors.neutral,
};

export default function SegnalazioniScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const opt = useEnumOptions();
  const { session, isStaff } = useAuth();
  const [lista, setLista] = useState(null);
  const [condomini, setCondomini] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(false);
  const [bozza, setBozza] = useState({ condominio_id: '', tipologia: 'guasto', titolo: '', descrizione: '', foto_url: '' });
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carica = async () => {
    const { data, error } = await supabase.from('segnalazione')
      .select('id, titolo, descrizione, tipologia, priorita, stato, assegnata_a, created_at, condominio:condominio_id(denominazione), assegnatario:assegnata_a(nome, cognome), foto:segnalazione_foto(file_url, ordine)')
      .order('created_at', { ascending: false });
    if (error) toast.error(error, 'segnalazioni');
    setLista(data || []);
  };

  useEffect(() => {
    carica();
    supabase.from('condominio').select('id, denominazione').then(({ data }) => {
      setCondomini(data || []);
      if (data?.[0]) setBozza((b) => ({ ...b, condominio_id: data[0].id }));
    });
    if (isStaff) {
      supabase.from('profilo_utente').select('id, nome, cognome, ruolo_principale')
        .in('ruolo_principale', ['admin', 'portiere', 'super_admin'])
        .then(({ data }) => setStaff(data || []));
    }
  }, [isStaff]);

  const scattaFoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    setUploading(true);
    try {
      const name = asset.fileName || `foto_${Date.now()}.jpg`;
      const path = await uploadAsset('segnalazioni', { ...asset, name, mimeType: asset.mimeType || 'image/jpeg' }, session.user.id);
      setBozza((b) => ({ ...b, foto_url: path }));
      toast.success(t('segnalazioni.addPhoto'));
    } catch (err) {
      toast.error(err, 'upload foto');
    } finally {
      setUploading(false);
    }
  };

  const vediFoto = async (path) => {
    try { await WebBrowser.openBrowserAsync(await signedUrl('segnalazioni', path, 60)); }
    catch (err) { toast.error(err, 'foto'); }
  };

  const invia = async () => {
    setSalvando(true);
    const { data: creata, error } = await supabase.from('segnalazione').insert({
      condominio_id: bozza.condominio_id, tipologia: bozza.tipologia, titolo: bozza.titolo,
      descrizione: bozza.descrizione, priorita: SEGNALAZIONE_PRIORITA_DEFAULT,
      ambito: 'amministratore', creata_da: session.user.id,
    }).select('id').single();
    if (error) { setSalvando(false); toast.error(error, 'invia segnalazione'); return; }
    if (bozza.foto_url) {
      const { error: fe } = await supabase.from('segnalazione_foto').insert({ segnalazione_id: creata.id, file_url: bozza.foto_url, ordine: 0 });
      if (fe) toast.error(fe, 'foto segnalazione');
    }
    setSalvando(false);
    toast.success(t('reports.submit'));
    setForm(false); setBozza((b) => ({ ...b, titolo: '', descrizione: '', foto_url: '' })); carica();
  };

  const cambiaStato = async (segn, nuovo) => {
    setLista((l) => l.map((s) => (s.id === segn.id ? { ...s, stato: nuovo } : s)));
    const { error } = await supabase.from('segnalazione').update({ stato: nuovo }).eq('id', segn.id);
    if (error) { toast.error(error, 'cambia stato'); carica(); }
  };

  const assegna = async (segn, uid) => {
    setLista((l) => l.map((s) => (s.id === segn.id ? { ...s, assegnata_a: uid || null } : s)));
    const { error } = await supabase.from('segnalazione').update({ assegnata_a: uid || null }).eq('id', segn.id);
    if (error) { toast.error(error, 'assegna'); carica(); }
  };

  if (!lista) return <Screen><Spinner /></Screen>;

  const condominiOptions = condomini.map((c) => ({ value: c.id, label: c.denominazione }));
  const tipoOptions = tipoSegnalazione.map((tp) => ({ value: tp, label: t(`reports.type.${tp}`) }));

  return (
    <Screen scroll={false}>
      <PageHeader
        title={t('reports.title')}
        subtitle={isStaff ? t('reports.subtitleStaff') : t('reports.subtitleResident')}
        action={<Button onPress={() => setForm(true)}>{t('reports.new')}</Button>}
      />

      {lista.length === 0 ? (
        <EmptyState icon="🛠️" title={t('reports.emptyTitle')} text={t('reports.emptyText')} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: s }) => (
            <Card>
              <View style={styles.top}>
                <Text style={styles.title}>{s.titolo}</Text>
                <Badge color={statoColore[s.stato]}>{t(`enums.statoSegnalazione.${s.stato}`)}</Badge>
              </View>
              <Text style={styles.body}>{s.descrizione}</Text>
              {!!s.foto?.[0]?.file_url && (
                <Button variant="soft" onPress={() => vediFoto(s.foto[0].file_url)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  🖼️ {t('segnalazioni.viewPhoto')}
                </Button>
              )}
              <Text style={styles.meta}>
                {s.condominio?.denominazione} · {t(`reports.type.${s.tipologia}`, { defaultValue: s.tipologia })} · {dataIt(s.created_at)}
                {' · '}{t('segnalazioni.assignee')}: {s.assegnatario ? `${s.assegnatario.nome} ${s.assegnatario.cognome}` : t('segnalazioni.unassigned')}
              </Text>

              {isStaff && (
                <View style={styles.staffRow}>
                  <Field field={{ name: 'assegnata_a', label: t('segnalazioni.assign'), type: 'select',
                    options: [{ value: '', label: t('segnalazioni.unassigned') }, ...staff.map((u) => ({ value: u.id, label: `${u.nome} ${u.cognome}` }))] }}
                    value={s.assegnata_a || ''} onChange={(_n, v) => assegna(s, v)} />
                  <Field field={{ name: 'stato', label: t('reports.changeStatus'), type: 'select', options: opt('statoSegnalazione') }}
                    value={s.stato} onChange={(_n, v) => cambiaStato(s, v)} />
                </View>
              )}
            </Card>
          )}
        />
      )}

      <Modal open={form} title={t('reports.new')} onClose={() => setForm(false)}
        footer={<>
          <Button variant="ghost" onPress={() => setForm(false)}>{t('common.cancel')}</Button>
          <Button onPress={invia} loading={salvando} disabled={uploading || !bozza.titolo}>{t('reports.submit')}</Button>
        </>}>
        <Field field={{ name: 'condominio_id', label: t('reports.building'), type: 'select', options: condominiOptions }}
          value={bozza.condominio_id} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'tipologia', label: t('reports.problemType'), type: 'select', options: tipoOptions }}
          value={bozza.tipologia} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'titolo', label: t('reports.titleField'), placeholder: t('reports.titlePlaceholder') }}
          value={bozza.titolo} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Field field={{ name: 'descrizione', label: t('reports.description'), type: 'textarea', placeholder: t('reports.descriptionPlaceholder') }}
          value={bozza.descrizione} onChange={(n, v) => setBozza({ ...bozza, [n]: v })} />
        <Text style={styles.fieldLabel}>{t('segnalazioni.photo')}</Text>
        <Button variant="soft" onPress={scattaFoto} loading={uploading} style={{ alignSelf: 'flex-start' }}>
          {bozza.foto_url ? `📎 ${bozza.foto_url.split('/').pop()}` : t('common.chooseFile', 'Scegli file')}
        </Button>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 },
  title: { fontSize: font.h3, fontWeight: font.bold, color: colors.ink, flex: 1 },
  body: { color: colors.inkSoft, fontSize: font.body },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 8 },
  staffRow: { marginTop: 12, gap: 8 },
  fieldLabel: { fontWeight: font.medium, color: colors.inkSoft, marginBottom: 6, fontSize: font.small },
});
