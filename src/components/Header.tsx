import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Header({ title }: any) {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Ionicons name="arrow-back" size={20} color="black" />
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{title}</Text>
    </TouchableOpacity>
  );
}