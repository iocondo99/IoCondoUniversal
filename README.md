# IoCondo — App universale (iOS · Android · Web)

App condominiale in **React Native + Expo**, da un solo codice sorgente per
**iPhone/iPad (App Store)**, **Android (Play Store)** e **Web** (react-native-web).
Riusa la logica dell'app web esistente (Supabase, i18n 8 lingue) con UI nativa
e un menù laterale (Drawer). Palette professionale blu petrolio & salvia.

---

## 1. Requisiti
- **Node.js 18+**
- **Expo** (nessuna installazione globale necessaria: si usa `npx`)
- Un account **Supabase** con lo stesso database dell'app web

## 2. Configurazione (una volta sola)
```bash
cd IoCondo-universal

# installa le dipendenze
npm install

# crea il file .env con le tue chiavi Supabase
copy .env.example .env        # su Windows
# poi apri .env e incolla:
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```
Le chiavi sono su **Supabase → Project Settings → API**. In Expo le variabili
pubbliche **devono** iniziare con `EXPO_PUBLIC_`.

## 3. Avvio in sviluppo
```bash
npx expo start          # apre il menu: premi w (web), a (Android), i (iOS)
```
- **Web:** `npx expo start --web` → si apre nel browser
- **Telefono reale:** installa **Expo Go** e inquadra il QR code
- **Emulatore Android / simulatore iOS:** premi `a` / `i`

## 4. Build di produzione
- **Web (sito statico):** `npx expo export -p web` → cartella `dist/` da pubblicare
  (Netlify, Vercel, Cloudflare Pages…)
- **iOS / Android (store):** usa **EAS Build** → `npx eas build -p ios` / `-p android`

---

## 5. Struttura
```
IoCondo-universal/
  App.js                 → entry point: provider + navigazione, init i18n
  app.json               → config Expo (nome, bundle id, icone, web)
  src/
    lib/                 → supabase (AsyncStorage), format, notifiche, storage,
                           enums, dbEnums, errors, pdf (expo-print)
    i18n/                → index.js (expo-localization) + locales/*.json (8 lingue)
    auth/                → AuthProvider (riusato dal web)
    context/             → SettingsProvider (AsyncStorage), ToastProvider (nativo)
    theme/               → palette, tipografia, spaziature, ombre (Palette A)
    components/          → Screen, Icon, LanguageSwitcher, useResponsive
       ui/               → Card, Button, Badge, Spinner, EmptyState, PageHeader,
                           Field, Modal (design system nativo)
    navigation/          → RootNavigator (Drawer + linking URL), DrawerContent, menu.js
    screens/             → Login, Dashboard, Avvisi, Documenti, Bollettini, Spese,
                           Calendario, Assemblee, Spazi, Raccolta, Pacchi,
                           Segnalazioni, Contatti, Placeholder (sezioni staff/admin)
```

## 6. Cosa è stato riusato vs riscritto
**Riusato tale e quale** (logica condivisa): AuthProvider, format.js, notifiche.js,
enums.js, dbEnums.js, errors.js, tutte le query Supabase, le 8 traduzioni.

**Riscritto per il nativo/universale:**
- `supabase.js` → sessione con AsyncStorage (mobile) / localStorage (web)
- `SettingsProvider` → AsyncStorage invece di localStorage
- `i18n` → `expo-localization` invece del language detector del browser
- React Router → **React Navigation** (Drawer + linking per URL sul web)
- `div/span` + CSS → `View/Text/FlatList` + `StyleSheet` + tema JS
- `jsPDF` → **expo-print** (+ expo-sharing su mobile, stampa browser su web)
- upload file → **expo-document-picker / expo-image-picker** (con fallback web)
- apertura link/documenti → **expo-web-browser**

## 7. Note
- Le sezioni **staff/admin** (Condomini, Anagrafica, Archivio, Amministrazione)
  hanno una schermata segnaposto pronta: la logica web è ampia e va portata a
  parte, senza bloccare l'uso da parte dei condòmini. Le sezioni del condòmino
  sono complete e funzionanti.
- Il **Drawer** si adatta al ruolo (condòmino / portiere / admin) e rispetta i
  toggle di visibilità impostati dall'amministratore per ogni condominio.
- Su **desktop** (schermo largo) il menù laterale resta sempre aperto; su
  telefono/tablet si apre con il pulsante ☰.
- Lo **schema del database non è stato toccato**: l'app usa le stesse tabelle,
  gli stessi bucket storage e le stesse policy RLS della web app.
```
