import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { colors } from '../constants/colors';

// TODO:
// - Use the real user name and today's date
// - "End shift" should actually end the shift and update the green card

// - Build the "Report incident" screen
// - Build the "Report appliance issue" screen
// - Disable "Submit sales report" until the shift has ended
const dateToday = new Date();
const dateString = dateToday.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});
const timeString = dateToday.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
});
const shiftStartTime = new Date();
const shiftStartTimeString = shiftStartTime.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
  day: 'numeric',
  month: 'short',
  weekday: 'short',
});
export default function Home() {
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Hi, Braden</Text>
          <Text style={{ color: '#555' }}>{dateString}, {timeString}</Text>
        </View>

        <Card color={colors.green}>
          <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Shift running</Text>
          <Text style={{ color: '#2E7D32', fontSize: 12 }}>Started on {shiftStartTimeString}</Text>
        </Card>

        <Button title="End shift" onPress = {() => router.push('/')}  outline />

        <Text style={{ color: '#555', fontSize: 12, marginTop: 12 }}>
          End-of-night tasks
        </Text>

        <Button title="Submit sales report" onPress={() => router.push('/salesReport')} />
        <Button title="Report incident" onPress={() => router.push('/report-incident')} />
        <Button title="Report appliance issue" onPress={() => router.push('/appliance-issue')}/>
      </View>
    </Screen>
  );
}