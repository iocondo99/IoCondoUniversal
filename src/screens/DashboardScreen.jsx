import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../context/ToastProvider';
import { useSettings } from '../context/SettingsProvider';
import { notifica } from '../lib/notifiche';
import { dataIt } from '../lib/format';
import Screen from '../components/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import useResponsive from '../components/useResponsive';
import { colors, font, spacing, radius } from '../theme';

/*
  Dashboard — tile di riepilogo per ruolo (identica logica del web).
  Le tile sono toccabili e navigano alla sezione. Le polizze in scadenza
  (solo admin) restano come blocco evidenziato con invio promemoria.
*/
function Tile({ icon, numero, label, onPress, columns }) {
  return (
    <View style={{ width: `${100 / columns}%`, padding: spacing.sm }}>
      <Card onPress={onPress} style={styles.tile}>
        <Text style={styles.tileIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tileNum}>{numero}</Text>
          <Text style={styles.tileLabel}>{label}</Text>
        </View>
      </Card>
    </View>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { profilo, session, isAdmin, isPortiere, condominioId } = useAuth();
  const toast = useToast();
  const { isVisible } = useSettings();
  const { columns } = useResponsive();
  const [c, setC] = useState(null);
  const [polizze, setPolizze] = useState([]);

  useEffect(() => {
    (async () => {
      const head = { count: 'exact', head: true };
      const [cond, daPagare, avvisi, segn, pacchi, utenti] = await Promise.all([
        supabase.from('condominio').select('id', head),
        supabase.from('bollettino').select('id', head).neq('stato_pagamento', 'pagato'),
        supabase.from('avviso').select('id', head),
        supabase.from('segnalazione').select('id', head).neq('stato', 'chiusa'),
        supabase.from('pacco').select('id', head).eq('stato', 'in_giacenza'),
        supabase.from('profilo_utente').select('id', head),
      ]);
      const failed = [cond, daPagare, avvisi, segn, pacchi, utenti].find((r) => r.error);
      if (failed) toast.error(failed.error, 'dashboard');
      setC({
        condomini: cond.count ?? 0, daPagare: daPagare.count ?? 0, avvisi: avvisi.count ?? 0,
        segnalazioni: segn.count ?? 0, pacchi: pacchi.count ?? 0, utenti: utenti.count ?? 0,
      });
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const oggi = new Date();
      const tra60 = new Date(oggi.getTime() + 60 * 86400000);
      const { data } = await supabase.from('polizza_assicurativa')
        .select('id, compagnia, numero_polizza, data_scadenza, condominio_id, condominio:condominio_id ( denominazione )')
        .gte('data_scadenza', oggi.toISOString().slice(0, 10))
        .lte('data_scadenza', tra60.toISOString().slice(0, 10))
        .order('data_scadenza');
      setPolizze(data || []);
    })();
  }, [isAdmin]);

  const inviaPromemoria = async () => {
    for (const p of polizze) {
      await notifica({
        destinatario_id: session.user.id, tipo_evento: 'scadenza',
        titolo: t('dashboard.insuranceTitle'),
        messaggio: `${p.compagnia} (${p.numero_polizza || ''}) · ${dataIt(p.data_scadenza)}`,
        entita_riferimento: 'polizza', entita_id: p.id,
      });
    }
    toast.success(t('dashboard.reminderSent'));
  };

  if (!c) return <Screen><Spinner /></Screen>;

  let tiles;
  if (isAdmin) {
    tiles = [
      { icon: '🏢', n: c.condomini, label: t('dashboard.buildings'), route: 'Condomini' },
      { icon: '🛠️', n: c.segnalazioni, label: t('dashboard.openReports'), route: 'Segnalazioni' },
      { icon: '👥', n: c.utenti, label: t('nav.anagrafica'), route: 'Anagrafica' },
      { icon: '🗳️', n: null, label: t('nav.assemblee'), route: 'Assemblee' },
    ];
  } else if (isPortiere) {
    tiles = [
      { icon: '📦', n: c.pacchi, label: t('pacchiPage.title'), route: 'Pacchi' },
      { icon: '🛠️', n: c.segnalazioni, label: t('dashboard.openReports'), route: 'Segnalazioni' },
      { icon: '🏢', n: c.condomini, label: t('dashboard.buildings'), route: 'Condomini' },
    ];
  } else {
    tiles = [
      { icon: '🧾', n: c.daPagare, label: t('dashboard.billsToPay'), route: 'Bollettini', key: 'bills' },
      { icon: '📣', n: c.avvisi, label: t('dashboard.notices'), route: 'Avvisi', key: 'notices' },
      { icon: '📦', n: c.pacchi, label: t('pacchiPage.title'), route: 'Pacchi', key: 'pacchi' },
      { icon: '🛠️', n: c.segnalazioni, label: t('dashboard.openReports'), route: 'Segnalazioni', key: 'reports' },
    ].filter((tl) => isVisible(tl.key, condominioId));
  }

  return (
    <Screen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={styles.greeting}>{t('dashboard.greeting', { name: profilo?.nome })}</Text>
        <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
      </View>

      <View style={styles.grid}>
        {tiles.map((tl, i) => (
          <Tile key={i} icon={tl.icon} numero={tl.n ?? '·'} label={tl.label}
            columns={columns} onPress={() => navigation.navigate(tl.route)} />
        ))}
      </View>

      {isAdmin && polizze.length > 0 && (
        <Card style={styles.insurance}>
          <View style={styles.insuranceHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.insuranceTitle}>⏰ {t('dashboard.insuranceTitle')} ({polizze.length})</Text>
              <Text style={styles.subtitle}>{t('dashboard.insuranceSub')}</Text>
            </View>
            <Button variant="soft" onPress={inviaPromemoria}>{t('dashboard.sendReminder')}</Button>
          </View>
          {polizze.map((p) => (
            <View key={p.id} style={styles.insuranceRow}>
              <Text style={styles.insuranceName}>{p.compagnia} · {p.condominio?.denominazione}</Text>
              <Text style={styles.subtitle}>{dataIt(p.data_scadenza)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: font.h1, fontWeight: font.black, color: colors.ink },
  subtitle: { fontSize: font.body, color: colors.muted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tileIcon: { fontSize: 40 },
  tileNum: { fontSize: 34, fontWeight: font.black, color: colors.ink, lineHeight: 38 },
  tileLabel: { fontWeight: font.medium, color: colors.muted, fontSize: font.small },
  insurance: { borderLeftWidth: 5, borderLeftColor: colors.warn, marginTop: spacing.lg },
  insuranceHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  insuranceTitle: { fontWeight: font.black, fontSize: font.h3, color: colors.ink },
  insuranceRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 8,
  },
  insuranceName: { fontWeight: font.medium, color: colors.ink, flex: 1 },
});
