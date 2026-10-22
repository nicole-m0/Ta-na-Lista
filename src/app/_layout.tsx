import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../hooks/useStore';
import { AdsProvider } from '../hooks/useAds';
export default function Layout() {
  return <SafeAreaProvider><StatusBar style="dark" /><StoreProvider><AdsProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FA' } }} /></AdsProvider></StoreProvider></SafeAreaProvider>;
}
