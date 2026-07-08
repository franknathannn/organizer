// app/(tabs)/index.tsx
import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <WebView
      source={{ uri: 'https://organizer-three-ebon.vercel.app/' }}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});