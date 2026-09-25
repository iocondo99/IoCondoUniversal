import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import it from './locales/it.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import pt from './locales/pt.json';

/*
  Configurazione i18n UNIVERSALE.
  Differenza col web: niente i18next-browser-languagedetector (browser-only).
  La lingua iniziale viene scelta così:
    1. valore salvato in AsyncStorage (chiave "lang")
    2. lingua di sistema del dispositivo (expo-localization)
    3. fallback: italiano
  Il cambio lingua viene persistito in AsyncStorage (vedi setLanguage).

  Per aggiungere una lingua:
    1. crea src/i18n/locales/<codice>.json (copia di it.json tradotto)
    2. importalo qui e aggiungilo a `resources` e a `LANGUAGES`
*/

export const LANGUAGES = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
];

const resources = {
  it: { translation: it },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  ru: { translation: ru },
  zh: { translation: zh },
  pt: { translation: pt },
};

const STORAGE_KEY = 'lang';
const SUPPORTED = LANGUAGES.map((l) => l.code);

// Lingua di sistema ridotta al codice base (es. "it-IT" -> "it").
function deviceLanguage() {
  try {
    const tags = Localization.getLocales?.() || [];
    const code = tags[0]?.languageCode;
    return SUPPORTED.includes(code) ? code : 'it';
  } catch {
    return 'it';
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'it', // provvisorio; aggiornato in initI18n()
  fallbackLng: 'it',
  supportedLngs: SUPPORTED,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Da chiamare una volta all'avvio (in App.js) per applicare la lingua salvata/di sistema.
export async function initI18n() {
  let lng = null;
  try {
    lng = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (!lng || !SUPPORTED.includes(lng)) lng = deviceLanguage();
  if (lng !== i18n.language) await i18n.changeLanguage(lng);
}

// Cambio lingua + persistenza (usato dal LanguageSwitcher).
export async function setLanguage(code) {
  if (!SUPPORTED.includes(code)) return;
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export default i18n;
