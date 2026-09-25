import { Text } from 'react-native';

/*
  Icona semplice basata su emoji (nessuna dipendenza da font di icone).
  Mappa i nomi logici usati nel menu a un'emoji chiara e riconoscibile.
  Se domani vuoi icone vettoriali, basta sostituire qui con
  @expo/vector-icons senza toccare il resto dell'app.
*/
const MAP = {
  home: '🏠',
  bullhorn: '📣',
  'file-document': '📄',
  receipt: '🧾',
  'chart-pie': '💸',
  calendar: '📅',
  gavel: '🗳️',
  sofa: '🛋️',
  recycle: '♻️',
  'package-variant': '📦',
  tools: '🛠️',
  'card-account-phone': '📇',
  'office-building': '🏢',
  'account-group': '👥',
  archive: '🗂️',
  cog: '⚙️',
};

export default function Icon({ name, size = 22, style }) {
  return <Text style={[{ fontSize: size }, style]}>{MAP[name] || '•'}</Text>;
}
