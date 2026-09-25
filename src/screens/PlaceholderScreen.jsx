import Screen from '../components/Screen';
import EmptyState from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';

/*
  Schermata segnaposto per le sezioni staff/admin (Condomini, Anagrafica,
  Archivio, Amministrazione). La logica di queste pagine nel web è ampia:
  qui lasciamo un placeholder pronto da sostituire con il porting dedicato,
  senza bloccare l'uso dell'app da parte dei condòmini.
*/
export default function PlaceholderScreen({ route }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        icon="🚧"
        title={route?.name || t('common.soon', 'In arrivo')}
        text={t('common.sectionSoon', 'Questa sezione sarà disponibile a breve.')}
      />
    </Screen>
  );
}
