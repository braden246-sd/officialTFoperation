import { View } from 'react-native';
import { colors } from '../constants/colors';
// TODO:
// - Add a "warning" color option

export default function Card({ children, color, dashed }: any) {
  return (
    <View
      style={{
        backgroundColor: color || colors.field,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderRadius: 4,
        padding: 12,
      }}
    >
      {children}
    </View>
  );
}