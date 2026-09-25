import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../auth/AuthProvider';
import { vociPerRuolo } from './menu';
import DrawerContent from './DrawerContent';
import { colors, font, breakpoints } from '../theme';
import Icon from '../components/Icon';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AvvisiScreen from '../screens/AvvisiScreen';
import DocumentiScreen from '../screens/DocumentiScreen';
import BollettiniScreen from '../screens/BollettiniScreen';
import SpeseScreen from '../screens/SpeseScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import AssembleeScreen from '../screens/AssembleeScreen';
import SpaziScreen from '../screens/SpaziScreen';
import RaccoltaScreen from '../screens/RaccoltaScreen';
import PacchiScreen from '../screens/PacchiScreen';
import SegnalazioniScreen from '../screens/SegnalazioniScreen';
import ContattiScreen from '../screens/ContattiScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Drawer = createDrawerNavigator();

// Mappa route -> componente schermata.
const SCREENS = {
  Home: DashboardScreen,
  Avvisi: AvvisiScreen,
  Documenti: DocumentiScreen,
  Bollettini: BollettiniScreen,
  Spese: SpeseScreen,
  Calendario: CalendarioScreen,
  Assemblee: AssembleeScreen,
  Spazi: SpaziScreen,
  Raccolta: RaccoltaScreen,
  Pacchi: PacchiScreen,
  Segnalazioni: SegnalazioniScreen,
  Contatti: ContattiScreen,
  // staff/admin: placeholder pronti da sostituire con le schermate reali
  Condomini: PlaceholderScreen,
  Anagrafica: PlaceholderScreen,
  Archivio: PlaceholderScreen,
  Amministrazione: PlaceholderScreen,
};

// Configurazione linking: URL per sezione sul web + deep link su mobile.
const prefix = Linking.createURL('/');
const linking = {
  prefixes: [prefix, 'https://iocondo.app', 'iocondo://'],
  config: {
    screens: {
      Home: '',
      Avvisi: 'avvisi',
      Documenti: 'documenti',
      Bollettini: 'bollettini',
      Spese: 'spese',
      Calendario: 'calendario',
      Assemblee: 'assemblee',
      Spazi: 'spazi',
      Raccolta: 'raccolta',
      Pacchi: 'pacchi',
      Segnalazioni: 'segnalazioni',
      Contatti: 'contatti',
      Condomini: 'condomini',
      Anagrafica: 'anagrafica',
      Archivio: 'archivio',
      Amministrazione: 'amministrazione',
    },
  },
};

function HeaderMenuButton({ navigation }) {
  return (
    <Pressable onPress={() => navigation.toggleDrawer()} hitSlop={12} style={{ paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, color: colors.primaryInk }}>☰</Text>
    </Pressable>
  );
}

export default function RootNavigator() {
  const { session, loading, isAdmin, isPortiere } = useAuth();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const permanent = width >= breakpoints.desktop; // su desktop il drawer resta aperto

  if (loading) return null; // splash gestito a monte

  // Non autenticato -> mostra solo il Login (nessun drawer).
  if (!session) {
    return (
      <NavigationContainer linking={linking}>
        <View style={{ flex: 1 }}>
          <LoginScreen />
        </View>
      </NavigationContainer>
    );
  }

  const voci = vociPerRuolo({ isAdmin, isPortiere });

  return (
    <NavigationContainer linking={linking}>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          drawerType: permanent ? 'permanent' : 'front',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.primaryInk,
          headerTitleStyle: { fontWeight: font.bold },
          headerLeft: permanent ? () => null : () => <HeaderMenuButton navigation={navigation} />,
          sceneContainerStyle: { backgroundColor: colors.bg },
        })}
      >
        {voci.map((v) => (
          <Drawer.Screen
            key={v.route}
            name={v.route}
            component={SCREENS[v.route] || PlaceholderScreen}
            options={{ title: t(`nav.${v.key}`) }}
          />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
