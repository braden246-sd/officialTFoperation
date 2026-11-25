import { router } from 'expo-router';
import { useState } from 'react';
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

  const [running, setRunning] = useState(true);
  const [endedAt, setEndedAt] = useState('');

  function toggleShift() {
    if (running) {
      setEndedAt(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
      setRunning(false); //running remembers whether the shift is on ended at stores the time you tapped end shift the function flips running and saves the time when you end the shift
    } 
    else {
      setRunning(true);
    }
  }
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Hi, Braden</Text>
          <Text style={{ color: '#555' }}>{dateString}, {timeString}</Text>
        </View>

        <Card color={running ? colors.green : colors.field}>
          <Text style={{ fontWeight: 'bold', color: running ? '#2E7D32' : '#555' }}>
            {running ? 'Shift running' : 'Shift ended'}
          </Text>
          <Text style={{ color: running ? '#2E7D32' : '#555', fontSize: 12 }}>
            {running ? `Started on ${shiftStartTimeString}` : `Ended at ${endedAt}`}
          </Text>
        </Card>

        <Button
          title={running ? 'End shift' : 'Start shift'}
          outline
          onPress={toggleShift}
        />

        <Text style={{ color: '#555', fontSize: 12, marginTop: 12 }}>
          End-of-night tasks
        </Text>

        
        <Button title="Report Incident" onPress={() => router.push('/report-incident')} />
        <Button title="Report Appliance Issue" onPress={() => router.push('/appliance-issue')}/>
        <Button title="Submit Sales Report" disabled={running} onPress={() => router.push('/salesReport')} /> 
          {/* //cannot submit sales report until the shift has ended, so the button is disabled if running is true */}
      </View>
    </Screen>
  );
}