/*
  Valori di enum del DB usati nei PERCORSI DI SCRITTURA aggiunti dall'app.

  ⚠️ DA CONFERMARE: questi valori corrispondono a tipi ENUM "USER-DEFINED"
  del database. Sono state inserite ipotesi ragionevoli; se un INSERT/UPDATE
  fallisce con "invalid input value for enum ...", correggi qui (un unico punto).

  Per ricavare TUTTI gli enum reali e i loro valori, esegui nel SQL Editor:
    select t.typname as enum_type,
           array_agg(e.enumlabel order by e.enumsortorder) as values
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    group by t.typname
    order by t.typname;
*/

// notifica.canale  — canale_notifica_enum {push,email,sms}
export const NOTIFICA_CANALE = 'push'
// notifica.stato   — stato_notifica_enum {in_coda,inviata,consegnata,fallita,letta}
export const NOTIFICA_STATO_NUOVA = 'in_coda'
export const NOTIFICA_STATO_LETTA = 'letta'

// prenotazione_spazio.stato — stato_prenotazione_enum {richiesta,confermata,rifiutata,annullata}
export const PRENOTAZIONE_STATO_NUOVA = 'richiesta'
export const PRENOTAZIONE_STATO_ANNULLATA = 'annullata'

// votazione.voto — voto_enum {favorevole,contrario,astenuto}
export const VOTO_SCELTE = ['favorevole', 'contrario', 'astenuto']

// partecipazione_assemblea.modalita — modalita_partecipazione_enum {presente,delega,assente,online}
export const PARTECIPAZIONE_MODALITA = 'presente'

// invito_onboarding.stato — stato_invito_enum {inviato,accettato,scaduto,revocato}
export const INVITO_STATO_NUOVO = 'inviato'

// segnalazione.priorita — priorita_enum {bassa,media,alta}
export const SEGNALAZIONE_PRIORITA_DEFAULT = 'media'

// pacco.stato — già usato dall'app originale, quindi affidabile
export const PACCO_STATO_GIACENZA = 'in_giacenza'
export const PACCO_STATO_RITIRATO = 'ritirato'

// assemblea.stato — stato_assemblea_enum {convocata,in_corso,conclusa,annullata}
export const ASSEMBLEA_STATO_NUOVA = 'convocata'

// valori di default (alta confidenza: usati dall'app originale)
export const AVVISO_PRIORITA_DEFAULT = 'info'
export const AVVISO_DESTINATARI_DEFAULT = 'tutti'
export const DOCUMENTO_VISIBILITA_DEFAULT = 'tutti'
