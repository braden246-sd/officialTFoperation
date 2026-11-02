import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

export default function Screen({ children }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </SafeAreaView>
  );
}