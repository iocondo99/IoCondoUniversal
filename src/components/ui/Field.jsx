import { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { useToast } from '../../context/ToastProvider';
import { uploadAsset } from '../../lib/storage';
import { colors, radius, font, spacing, touch } from '../../theme';

/*
  Field — campo di form universale.
  Tipi: text, number, textarea, select (semplice a pulsanti), checkbox, file.
  `field`: { name, label, type, options[], required, placeholder, bucket, pathPrefix, accept }
*/
export default function Field({ field, value, onChange }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const { name, label, type = 'text', options = [], required, placeholder, bucket, pathPrefix } = field;
  const set = (v) => onChange(name, v);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: field.accept || '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      setUploading(true);
      const path = await uploadAsset(bucket || 'documenti', asset, pathPrefix || '');
      set(path);
      toast.success(t('common.upload', 'Caricato'));
    } catch (err) {
      toast.error(err, 'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>
        {label}{required && <Text style={{ color: colors.bad }}> *</Text>}
      </Text>

      {type === 'select' ? (
        <View style={styles.options}>
          {options.map((o) => {
            const active = value === o.value;
            return (
              <Pressable key={o.value} onPress={() => set(o.value)}
                style={[styles.option, active && styles.optionActive]}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : type === 'checkbox' ? (
        <View style={styles.row}>
          <Switch value={!!value} onValueChange={set}
            trackColor={{ true: colors.primary }} />
          <Text style={styles.help}>{t('common.yes', 'Sì')}</Text>
        </View>
      ) : type === 'file' ? (
        <View>
          <Pressable onPress={pickFile} disabled={uploading} style={styles.fileBtn}>
            <Text style={styles.fileBtnText}>
              {uploading ? t('common.uploading', 'Caricamento…') : t('common.chooseFile', 'Scegli file')}
            </Text>
          </Pressable>
          <Text style={styles.help}>
            {value ? `📎 ${String(value).split('/').pop()}` : t('common.noFile', 'Nessun file')}
          </Text>
        </View>
      ) : (
        <TextInput
          style={[styles.input, type === 'textarea' && styles.textarea]}
          value={value == null ? '' : String(value)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={type === 'number' ? 'numeric' : 'default'}
          multiline={type === 'textarea'}
          numberOfLines={type === 'textarea' ? 4 : 1}
          onChangeText={(txt) => set(type === 'number' ? (txt === '' ? '' : Number(txt)) : txt)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: font.medium, color: colors.inkSoft, marginBottom: 6, fontSize: font.small },
  input: {
    minHeight: touch, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: font.body, color: colors.ink,
    backgroundColor: colors.card,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, minHeight: touch, justifyContent: 'center',
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.inkSoft, fontWeight: font.medium },
  optionTextActive: { color: colors.primaryInk },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  help: { color: colors.muted, fontSize: font.small, marginTop: 6 },
  fileBtn: {
    minHeight: touch, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.bgSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  fileBtnText: { fontWeight: font.bold, color: colors.ink },
});
