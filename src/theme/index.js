/*
  Tema centralizzato dell'app (Palette A — Blu petrolio & salvia).
  Sostituisce tokens.css del web. Un unico punto per colori, tipografia,
  spaziature, raggi e ombre. Importa `theme` ovunque serva.
*/
import { Platform } from 'react-native';

export const colors = {
  // superfici
  bg:        '#F4F6F5',   // sfondo app (grigio-verde chiarissimo)
  bgSoft:    '#EAEFEE',   // superfici secondarie
  card:      '#FFFFFF',
  line:      '#DCE4E2',   // bordi

  // testo
  ink:       '#16232A',   // testo principale (quasi nero bluastro)
  inkSoft:   '#3C4A50',
  muted:     '#6B7A7E',

  // brand — Palette A
  primary:   '#0E4C5A',   // blu petrolio (accent principale)
  primaryInk:'#FFFFFF',
  primarySoft:'#E1EDEF',  // sfondo tenue del primario (voce attiva drawer)
  secondary: '#6E8B74',   // verde salvia
  secondarySoft: '#E7EEE8',

  // stati (coerenti col web)
  ok:    '#2F6F46',   // verde
  warn:  '#B8860B',   // ambra
  bad:   '#B23B2E',   // rosso mattone
  neutral: '#6B7A7E',

  // stati con sfondo tenue (per badge)
  okSoft:   '#E4EFE8',
  warnSoft: '#F5EEDD',
  badSoft:  '#F3E2DF',
  neutralSoft: '#E9ECEB',
};

// mappa "colore stato" -> versione soft, per i badge
export const softOf = {
  [colors.ok]: colors.okSoft,
  [colors.warn]: colors.warnSoft,
  [colors.bad]: colors.badSoft,
  [colors.neutral]: colors.neutralSoft,
  [colors.secondary]: colors.secondarySoft,
  [colors.primary]: colors.primarySoft,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const font = {
  // dimensioni (base 16-17 per leggibilità su mobile)
  h1: 26, h2: 21, h3: 18, body: 16, small: 14, tiny: 12.5,
  // pesi
  regular: '400', medium: '600', bold: '700', black: '800',
};

export const touch = 48; // area toccabile minima (accessibilità)

export const shadow = Platform.select({
  ios: {
    shadowColor: '#16232A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
  default: {
    // web
    boxShadow: '0 2px 4px rgba(22,35,42,.05), 0 8px 24px rgba(22,35,42,.07)',
  },
});

// breakpoint responsive (telefono / tablet / desktop)
export const breakpoints = { tablet: 768, desktop: 1100 };
export const maxContentWidth = 900; // il contenuto non si "stira" su schermi larghi

const theme = { colors, softOf, spacing, radius, font, touch, shadow, breakpoints, maxContentWidth };
export default theme;
