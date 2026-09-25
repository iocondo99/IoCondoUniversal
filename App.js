import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import './src/i18n'; // inizializza i18n
import { initI18n } from './src/i18n';
import { AuthProvider } from './src/auth/AuthProvider';
import { SettingsProvider } from './src/context/SettingsProvider';
import { ToastProvider } from './src/context/ToastProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

/*
  Entry point universale (iOS / Android / Web).
  Ordine dei provider ricalca il web:
    ToastProvider > AuthProvider > SettingsProvider > Navigation
  (Toast fuori così anche gli errori di auth possono mostrarsi.)
*/
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ToastProvider>
          <AuthProvider>
            <SettingsProvider>
              <RootNavigator />
            </SettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
