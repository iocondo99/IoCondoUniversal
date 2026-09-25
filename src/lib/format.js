import i18n from '../i18n'

// Formattazioni sensibili alla lingua attiva (i18n.language).
// La valuta resta EUR; cambia solo il formato (separatori, posizione simbolo).

export const euro = (n) =>
  new Intl.NumberFormat(i18n.language || 'it', { style: 'currency', currency: 'EUR' })
    .format(Number(n || 0))

export const dataIt = (d) =>
  d
    ? new Intl.DateTimeFormat(i18n.language || 'it', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
    : '—'
