import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { colors } from '../constants/colors';

// TODO:
// - Use the real user name and today's date
// - "End shift" should actually end the shift and update the green card
// - Shift start time should come from real data
// - Build the "Report incident" screen
// - Build the "Report appliance issue" screen
// - Disable "Submit sales report" until the shift has ended

export default function Home() {
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Hi, Braden</Text>
          <Text style={{ color: '#555' }}>Monday, Nov 2</Text>
        </View>

        <Card color={colors.green}>
          <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Shift running</Text>
          <Text style={{ color: '#2E7D32', fontSize: 12 }}>Started at 5:00 PM</Text>
        </Card>

        <Button title="End shift" onPress = {() => router.push('/')}  outline />

        <Text style={{ color: '#555', fontSize: 12, marginTop: 12 }}>
          End-of-night tasks
        </Text>

        <Button title="Submit sales report" onPress={() => router.push('/salesReport')} />
        <Button title="Report incident" outline />
        <Button title="Report appliance issue" outline />
      </View>
    </Screen>
  );
}