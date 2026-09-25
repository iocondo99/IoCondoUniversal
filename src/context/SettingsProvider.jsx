import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
  Impostazioni di visibilità delle sezioni gestite dall'amministratore,
  INDIPENDENTI PER CONDOMINIO (identico al web, ma persistenza su AsyncStorage
  invece di localStorage così funziona su iOS/Android/Web).

  Struttura: { [condominio_id]: { [sezione]: false } }
  Default: tutto visibile, salvo spegnimento esplicito.
*/

const STORAGE_KEY = 'iocondo.sezioniVisibili';

export const SEZIONI_GESTIBILI = [
  'bills', 'spese', 'notices', 'documents', 'calendario',
  'assemblee', 'spazi', 'raccolta', 'pacchi', 'reports', 'contatti',
];

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [mappa, setMappa] = useState({});
  const [pronto, setPronto] = useState(false);

  // carica una volta all'avvio
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setMappa(JSON.parse(raw) || {});
      } catch {
        /* ignore */
      } finally {
        setPronto(true);
      }
    })();
  }, []);

  // salva ad ogni cambiamento (dopo il primo caricamento)
  useEffect(() => {
    if (!pronto) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappa)).catch(() => {});
  }, [mappa, pronto]);

  const isVisible = useCallback((key, condominioId) => {
    if (!condominioId) return true;
    return mappa[condominioId]?.[key] !== false;
  }, [mappa]);

  const setVisible = useCallback((condominioId, key, value) => {
    if (!condominioId) return;
    setMappa((m) => ({ ...m, [condominioId]: { ...m[condominioId], [key]: value } }));
  }, []);

  const toggle = useCallback((condominioId, key) => {
    if (!condominioId) return;
    setMappa((m) => {
      const visibileOra = m[condominioId]?.[key] !== false;
      return { ...m, [condominioId]: { ...m[condominioId], [key]: !visibileOra } };
    });
  }, []);

  const value = { mappa, isVisible, setVisible, toggle };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
