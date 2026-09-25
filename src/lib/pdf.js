import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { euro, dataIt } from './format';

/*
  Generazione PDF del bollettino — versione UNIVERSALE.
  Sostituisce jsPDF con expo-print: costruiamo un HTML e lo trasformiamo in PDF.
  - Su mobile: genera un file PDF e apre il foglio di condivisione (Sharing).
  - Su web: apre la finestra di stampa del browser (Print.printAsync),
    da cui l'utente può salvare come PDF.
  `labels` permette di tradurre le etichette (stringhe passate da i18n).
*/

function buildHtml(b, L) {
  const cond = b.unita?.condominio?.denominazione || b.condominio?.denominazione || '';
  const rows = [
    [L.building, cond],
    [L.unit, b.unita?.identificativo],
    [L.installment, b.rata?.descrizione],
    [L.due, dataIt(b.rata?.data_scadenza)],
    [L.amountDue, euro(b.importo_dovuto)],
    [L.amountPaid, euro(b.importo_pagato)],
    [L.status, L[`status_${b.stato_pagamento}`] || b.stato_pagamento],
  ];
  const trs = rows
    .map(
      ([k, v]) =>
        `<tr><td class="k">${k}</td><td class="v">${v ?? '—'}</td></tr>`
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"/>
    <style>
      body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color:#16232A; padding:32px; }
      h1 { color:#0E4C5A; font-size:26px; margin:0 0 4px; }
      .rule { height:3px; background:#0E4C5A; border:0; margin:14px 0 22px; width:64px; }
      table { width:100%; border-collapse:collapse; font-size:15px; }
      td { padding:10px 6px; border-bottom:1px solid #DCE4E2; }
      td.k { font-weight:700; width:45%; }
      td.v { text-align:right; }
    </style></head><body>
      <h1>${L.title}</h1><hr class="rule"/>
      <table>${trs}</table>
    </body></html>`;
}

export async function bollettinoPdf(b, labels) {
  const L = {
    title: 'Bollettino', building: 'Condominio', unit: 'Unità', installment: 'Rata',
    due: 'Scadenza', amountDue: 'Importo dovuto', amountPaid: 'Importo pagato', status: 'Stato',
    ...labels,
  };
  const html = buildHtml(b, L);

  if (Platform.OS === 'web') {
    // Su web apre la stampa del browser (salva come PDF).
    await Print.printAsync({ html });
    return;
  }
  // Su mobile genera il file e lo condivide/scarica.
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: L.title });
  }
  return uri;
}
