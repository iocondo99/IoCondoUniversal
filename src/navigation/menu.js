/*
  Definizione centralizzata delle voci di menu per ruolo.
  Ricalca esattamente le voci del web (Layout.jsx), ma qui sono usate sia dal
  Drawer sia dal linking (URL su web). `key` combacia con le chiavi i18n `nav.*`
  e con le chiavi di visibilità gestite dall'admin (SettingsProvider).
*/

// Voci del condòmino (rispettano i toggle di visibilità dell'admin, tranne Home).
export const vociCondomino = [
  { route: 'Home',        key: 'home',        icon: 'home',            path: '' },
  { route: 'Avvisi',      key: 'notices',     icon: 'bullhorn',        path: 'avvisi' },
  { route: 'Documenti',   key: 'documents',   icon: 'file-document',   path: 'documenti' },
  { route: 'Bollettini',  key: 'bills',       icon: 'receipt',         path: 'bollettini' },
  { route: 'Spese',       key: 'spese',       icon: 'chart-pie',       path: 'spese' },
  { route: 'Calendario',  key: 'calendario',  icon: 'calendar',        path: 'calendario' },
  { route: 'Assemblee',   key: 'assemblee',   icon: 'gavel',           path: 'assemblee' },
  { route: 'Spazi',       key: 'spazi',       icon: 'sofa',            path: 'spazi' },
  { route: 'Raccolta',    key: 'raccolta',    icon: 'recycle',         path: 'raccolta' },
  { route: 'Pacchi',      key: 'pacchi',      icon: 'package-variant', path: 'pacchi' },
  { route: 'Segnalazioni',key: 'reports',     icon: 'tools',           path: 'segnalazioni' },
  { route: 'Contatti',    key: 'contatti',    icon: 'card-account-phone', path: 'contatti' },
];

export const vociPortiere = [
  { route: 'Home',        key: 'home',    icon: 'home',            path: '' },
  { route: 'Pacchi',      key: 'pacchi',  icon: 'package-variant', path: 'pacchi' },
  { route: 'Segnalazioni',key: 'reports', icon: 'tools',           path: 'segnalazioni' },
  { route: 'Condomini',   key: 'buildings',icon: 'office-building', path: 'condomini' },
];

export const vociAdmin = [
  { route: 'Home',          key: 'home',           icon: 'home',            path: '' },
  { route: 'Condomini',     key: 'buildings',      icon: 'office-building', path: 'condomini' },
  { route: 'Anagrafica',    key: 'anagrafica',     icon: 'account-group',   path: 'anagrafica' },
  { route: 'Archivio',      key: 'archivio',       icon: 'archive',         path: 'archivio' },
  { route: 'Assemblee',     key: 'assemblee',      icon: 'gavel',           path: 'assemblee' },
  { route: 'Segnalazioni',  key: 'reports',        icon: 'tools',           path: 'segnalazioni' },
  { route: 'Amministrazione',key: 'amministrazione',icon: 'cog',            path: 'amministrazione' },
];

export function vociPerRuolo({ isAdmin, isPortiere }) {
  return isAdmin ? vociAdmin : isPortiere ? vociPortiere : vociCondomino;
}
