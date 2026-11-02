import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Screen from '../components/Screen';
import { Ionicons } from '@expo/vector-icons';

// TODO:
// - Open the real camera to take a photo of the sales report
// - "Upload from photos" should open the photo library
// - Read the numbers from the photo (OCR)
// - "Enter manually" should go to a blank form instead of sample data
// - Shift times should come from real data

export default function SalesReport() {
  return (
    <Screen>
      <Header title="Sales report" />
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <Text style={{ color: '#555', fontSize: 12 }}>
          Shift: Nov 2, 4:00 PM - 12:00 AM
        </Text>

        <TouchableOpacity onPress={() => router.push('/confirm-data')}>
          <Card dashed>
            <View style={{ height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="camera-outline" size={40} color="#555" />
            <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
                Take photo of end of day sales report
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        <Button title="Upload from photos" outline onPress={() => router.push('/confirm-data')} />

        <Text style={{ textAlign: 'center', color: '#555' }}>or</Text>

        <Button title="Enter manually" outline onPress={() => router.push('/confirm-data')} />
      </View>
    </Screen>
  );
}