import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastProvider';
import { dataIt } from '../lib/format';
import { signedUrl } from '../lib/storage';
import Screen from '../components/Screen';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { colors, font, spacing } from '../theme';

const icone = { regolamento: '📕', verbale: '📝', fattura: '🧾', contratto: '📑', polizza: '🛡️', altro: '📄' };

export default function DocumentiScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('documento')
        .select('id, titolo, tipologia, data_documento, file_url, condominio:condominio_id ( denominazione )')
        .order('data_documento', { ascending: false });
      if (error) toast.error(error, 'documenti');
      setDocs(data || []);
    })();
  }, []);

  const apri = async (path) => {
    try {
      const url = await signedUrl('documenti', path, 60);
      await WebBrowser.openBrowserAsync(url);
    } catch {
      toast.show(t('documents.notUploaded'), 'info');
    }
  };

  if (!docs) return <Screen><Spinner /></Screen>;

  return (
    <Screen scroll={false}>
      <PageHeader title={t('documents.title')} subtitle={t('documents.subtitle')} />
      {docs.length === 0 ? (
        <EmptyState icon="📄" title={t('documents.emptyTitle')} text={t('documents.emptyText')} />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item: d }) => (
            <Card style={styles.row}>
              <Text style={styles.icon}>{icone[d.tipologia] || icone.altro}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{d.titolo}</Text>
                <Text style={styles.meta}>{d.condominio?.denominazione} · {dataIt(d.data_documento)}</Text>
              </View>
              <Button variant="soft" onPress={() => apri(d.file_url)}>{t('common.open')}</Button>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: { fontSize: 34 },
  title: { fontWeight: font.bold, fontSize: font.body, color: colors.ink },
  meta: { color: colors.muted, fontSize: font.small, marginTop: 2 },
});
