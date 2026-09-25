/*
  Gruppi di valori ENUM (coerenti con gli ENUM del database).
  Le ETICHETTE non stanno più qui: sono tradotte via i18n con chiave
  `enums.<gruppo>.<valore>` (vedi src/i18n/locales/*.json).

  Per costruire le opzioni di una <select> tradotte usa l'helper:
    import { useEnumOptions } from './enums'
    const opt = useEnumOptions()
    opt('tipologiaUnita') // -> [{ value, label }]
*/

export const ENUM_GROUPS = {
  tipologiaUnita: ['appartamento', 'box', 'cantina', 'negozio', 'ufficio', 'altro'],
  ruoloUnita: ['proprietario', 'inquilino', 'usufruttuario', 'comodatario'],
  statoEsercizio: ['aperto', 'chiuso', 'approvato'],
  tipologiaRata: ['ordinaria', 'straordinaria'],
  statoPagamento: ['non_pagato', 'parziale', 'pagato', 'scaduto'],
  metodoPagamento: ['bonifico', 'mav', 'pagopa', 'contanti', 'assegno', 'carta'],
  tipologiaDocumento: ['verbale', 'contratto', 'fattura', 'regolamento', 'preventivo', 'consuntivo', 'convocazione', 'polizza', 'altro'],
  visibilitaDocumento: ['tutti', 'amministratore', 'specifica_unita'],
  tipologiaPolizza: ['globale_fabbricato', 'rc', 'incendio', 'furto', 'altro'],
  prioritaAvviso: ['info', 'importante', 'urgente'],
  destinatariAvviso: ['tutti', 'amministratore', 'condomini', 'portieri'],
  tipologiaAssemblea: ['ordinaria', 'straordinaria'],
  convocazione: ['prima', 'seconda'],
  modalitaAssemblea: ['presenza', 'online', 'mista'],
  tipoRifiuto: ['umido', 'plastica', 'carta', 'vetro', 'indifferenziato', 'organico', 'metallo'],
  statoPacco: ['in_giacenza', 'ritirato', 'rispedito'],
  statoSegnalazione: ['aperta', 'in_lavorazione', 'risolta', 'chiusa', 'annullata'],
  categoriaSpesa: ['pulizie', 'manutenzione', 'energia', 'acqua', 'ascensore', 'assicurazione', 'giardinaggio', 'amministrazione', 'altro'],
  eventoTipo: ['assemblea', 'manutenzione', 'scadenza', 'riunione', 'altro'],
  // ordine di visualizzazione (Lun→Dom); le etichette sono enums.giorniSettimana.<n>
  giorniSettimana: [1, 2, 3, 4, 5, 6, 0],
}

// Tipi di problema per le segnalazioni dei condòmini (chiavi reports.type.*)
export const tipoSegnalazione = ['guasto', 'rumore', 'pulizia', 'sicurezza', 'vicinato', 'altro']

// Ruoli assegnabili dall'amministratore (chiavi roles.*)
export const ADMIN_ROLE_OPTIONS = ['super_admin', 'admin', 'portiere', 'condomino']

// Categorie di spesa (chiavi enums.categoriaSpesa.*)
export const categoriaSpesa = ['pulizie', 'manutenzione', 'energia', 'acqua', 'ascensore', 'assicurazione', 'giardinaggio', 'amministrazione', 'altro']

import { useTranslation } from 'react-i18next'

/** Hook: ritorna una funzione che costruisce opzioni tradotte per un gruppo ENUM. */
export function useEnumOptions() {
  const { t } = useTranslation()
  return (group) =>
    (ENUM_GROUPS[group] || []).map((v) => ({ value: v, label: t(`enums.${group}.${v}`) }))
}
