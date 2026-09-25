/*
  Gestione centralizzata degli errori.

  Un unico punto traduce qualsiasi errore (Supabase Auth, PostgREST, rete,
  Error generico) in una CHIAVE i18n stabile sotto "errors.*".
  I componenti non costruiscono mai messaggi a mano: passano l'errore grezzo
  a `useToast().error(err)` e qui sotto viene mappato e tradotto.

  Per aggiungere un caso: aggiungi una entry alla mappa giusta e la relativa
  chiave nei file di traduzione. Nient'altro.
*/

// Codici SQLSTATE / PostgREST -> chiave i18n
const DB_CODE_MAP = {
  '23505': 'errors.db.duplicate',      // unique_violation
  '23503': 'errors.db.foreignKey',     // foreign_key_violation
  '23502': 'errors.db.notNull',        // not_null_violation
  '42501': 'errors.db.permission',     // insufficient_privilege
  PGRST116: 'errors.db.notFound',      // nessuna riga trovata
  PGRST301: 'errors.db.permission',    // RLS / JWT
}

// Frammenti di messaggi Auth Supabase -> chiave i18n (match case-insensitive)
const AUTH_MESSAGE_MAP = [
  [/invalid login credentials/i, 'errors.auth.invalidCredentials'],
  [/email not confirmed/i, 'errors.auth.invalidCredentials'],
  [/jwt expired|session.*expired|refresh token/i, 'errors.auth.sessionExpired'],
]

/**
 * Normalizza un errore qualsiasi in una chiave i18n.
 * @returns {string} chiave traducibile sotto "errors.*"
 */
export function errorKey(error) {
  if (!error) return 'errors.generic'

  // Errore di rete (fetch fallita / offline)
  if (error instanceof TypeError && /fetch|network/i.test(error.message || '')) {
    return 'errors.network'
  }
  if (error.name === 'AuthRetryableFetchError' || error.__isNetwork) {
    return 'errors.network'
  }

  // Errori DB con codice (PostgREST / Postgres)
  if (error.code && DB_CODE_MAP[error.code]) return DB_CODE_MAP[error.code]

  // Errori Auth riconosciuti dal messaggio
  const msg = error.message || error.error_description || ''
  for (const [re, key] of AUTH_MESSAGE_MAP) {
    if (re.test(msg)) return key
  }

  // Permessi (RLS) segnalati via status HTTP
  if (error.status === 401 || error.status === 403) return 'errors.db.permission'

  return 'errors.generic'
}

/**
 * Traduce un errore in messaggio leggibile.
 * @param {Function} t funzione i18next (da useTranslation)
 */
export function errorMessage(t, error) {
  return t(errorKey(error))
}

/** Log centralizzato — qui si potrebbe agganciare Sentry/telemetria. */
export function logError(error, context) {
  // eslint-disable-next-line no-console
  console.error('[AppError]', context || '', error)
}
