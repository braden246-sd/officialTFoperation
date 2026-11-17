import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Screen from '../components/Screen';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';

export default function applianceIssue() {
    return (
        <Screen>
            <Header title="Report appliance issue" />
            <View style={{ flex: 1, padding: 24, gap: 12 }}>
                <Text style={{ color: '#555', fontSize: 12 }}>
                    Shift: Nov 2, 4:00 PM - 12:00 AM
                </Text>
                <Input label="Appliance" placeholder="Which appliance is having an issue?" />
                <Input label="Description" placeholder="Describe the issue in detail" multiline />
                <Button title="Submit appliance issue report" onPress={() => router.replace('/home')} />
            </View>
        </Screen>
    )
}