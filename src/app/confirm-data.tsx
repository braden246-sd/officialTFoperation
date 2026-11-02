import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Input from '../components/Input';
import Screen from '../components/Screen';

// TODO:
// - Show the real photo in the preview box
// - Fill the fields with the numbers read from the photo
// - Flag fields automatically when a number looks wrong
// - Check that food + drink sales add up to the total
// - "Confirm and save" should save the report and email the nightly summary
// - Show a "Saved!" message after confirming


export default function ConfirmData() {
  return (
    <Screen>
      <Header title="Check the numbers" />
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <Text style={{ color: '#555', fontSize: 12 }}>
          Fix anything that looks wrong
        </Text>

        <Card>
          <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#555' }}>Report photo preview</Text>
          </View>
        </Card>

        <Input label="Food sales" defaultValue="$12,345.67" />

        <View style={{ gap: 4 }}>
          <Input label="Drink sales" defaultValue="$67,694.20" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="warning-outline" size={14} color="#B45309" />
            <Text style={{ color: '#B45309', fontSize: 12 }}>
              Double-check this number against the photo
            </Text>
          </View>
        </View>

        <Input label="Total" defaultValue="$99,999.00" />

        <Button title="Confirm and save" onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}