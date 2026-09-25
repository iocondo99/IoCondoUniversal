import { createContext, useContext, useCallback, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { errorKey, logError } from '../lib/errors';
import { colors, radius, font, shadow } from '../theme';

/*
  Toast centralizzato — versione React Native (universale).
  Stessa API del web: toast.success / toast.error(err) / toast.show / toast.info.
  L'overlay è renderizzato con View assolute in cima allo schermo.
*/

const ToastContext = createContext(null);
let counter = 0;

export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((x) => x.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const show = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++counter;
    setToasts((list) => [...list, { id, message, type }]);
    if (duration) timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const success = useCallback((message) => show(message, 'success'), [show]);
  const info = useCallback((message) => show(message, 'info'), [show]);
  const error = useCallback((err, context) => {
    logError(err, context);
    return show(t(errorKey(err)), 'error', 7000);
  }, [show, t]);

  return (
    <ToastContext.Provider value={{ show, success, info, error, remove }}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return ctx;
}

const BORDER = { success: colors.ok, error: colors.bad, info: colors.primary };
const ICONS = { success: '✓', error: '⚠️', info: 'ℹ️' };

function ToastViewport({ toasts, onClose }) {
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + 12 }]}>
      {toasts.map((tst) => (
        <Pressable key={tst.id} onPress={() => onClose(tst.id)}
          style={[styles.toast, { borderLeftColor: BORDER[tst.type] || BORDER.info }]}>
          <Text style={styles.icon}>{ICONS[tst.type] || ICONS.info}</Text>
          <Text style={styles.msg}>{tst.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center',
    zIndex: 100, gap: 10, paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderLeftWidth: 5, width: '100%', maxWidth: 420, ...shadow,
  },
  icon: { fontSize: 18, lineHeight: 22 },
  msg: { flex: 1, fontWeight: font.medium, color: colors.ink, fontSize: font.small },
});
