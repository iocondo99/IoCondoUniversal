import { supabase } from './supabase'
import { NOTIFICA_CANALE, NOTIFICA_STATO_NUOVA } from './dbEnums'

/*
  Notifiche: creazione centralizzata sulla tabella `notifica` (schema reale):
  destinatario_id, canale, tipo_evento, entita_riferimento, entita_id,
  titolo, messaggio, stato, letta_at, ...
  La consegna push/email/SMS reale si aggancia con una Edge Function che
  legge le notifiche con stato 'da_inviare'/'inviata' e usa `preferenze_notifiche`.
*/

export async function notifica({ destinatario_id, tipo_evento = 'info', titolo, messaggio = '', entita_riferimento = null, entita_id = null }) {
  return supabase.from('notifica').insert({
    destinatario_id, canale: NOTIFICA_CANALE, tipo_evento,
    entita_riferimento, entita_id, titolo, messaggio: messaggio || '', stato: NOTIFICA_STATO_NUOVA,
  })
}

// Stessa notifica a tutti i condòmini di un condominio.
export async function notificaCondominio({ condominio_id, tipo_evento = 'info', titolo, messaggio = '', entita_riferimento = null, entita_id = null }) {
  const { data: unita } = await supabase.from('unita_immobiliare').select('id').eq('condominio_id', condominio_id)
  const unitaIds = (unita || []).map((u) => u.id)
  if (!unitaIds.length) return { error: null, count: 0 }
  const { data: links } = await supabase.from('condomino_unita').select('condomino_id').in('unita_id', unitaIds)
  const dest = [...new Set((links || []).map((l) => l.condomino_id).filter(Boolean))]
  if (!dest.length) return { error: null, count: 0 }
  const rows = dest.map((d) => ({
    destinatario_id: d, canale: NOTIFICA_CANALE, tipo_evento,
    entita_riferimento, entita_id, titolo, messaggio: messaggio || '', stato: NOTIFICA_STATO_NUOVA,
  }))
  const { error } = await supabase.from('notifica').insert(rows)
  return { error, count: rows.length }
}

// Mappa tipo_evento/entità -> rotta in-app per la navigazione dal centro notifiche.
// Se la notifica riferisce una specifica entità (entita_id), la rotta include
// `?id=<entita_id>` così la pagina di destinazione può aprire/evidenziare
// direttamente l'elemento (es. l'avviso) invece del solo elenco.
export function notificaLink(n) {
  const map = {
    bollettino: '/bollettini', avviso: '/avvisi', assemblea: '/assemblee',
    segnalazione: '/segnalazioni', pacco: '/pacchi', scadenza: '/',
  }
  const base = map[n.tipo_evento] || map[n.entita_riferimento] || null
  if (!base) return null
  return n.entita_id ? `${base}?id=${n.entita_id}` : base
}
