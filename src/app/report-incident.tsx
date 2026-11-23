import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';

import Header from '../components/Header';
import Screen from '../components/Screen';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';


export default function ReportIncident() {
    return (
        <Screen>
            <Header title="Report incident" />
            <View style={{ flex: 1, padding: 24, gap: 12 }}>
                <Text style={{ color: '#555', fontSize: 12 }}>
                    Shift: Nov 2, 4:00 PM - 12:00 AM
                </Text>
                <Input label="Description" placeholder="Describe the incident in detail" multiline />
                <Input label="Location" placeholder="Where did the incident occur?" />
                <Input label="People involved" placeholder="Who was involved in the incident?" />

                <Button title="Submit incident report" onPress={() => router.replace('/home')} />
            </View>
        </Screen>

    );
}