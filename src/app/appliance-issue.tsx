import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Screen from '../components/Screen';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import {shiftLabel} from '../constants/shift';

export default function applianceIssue() {
    return (
        <Screen>
            <Header title="Report appliance issue" />
            <View style={{ flex: 1, padding: 24, gap: 12 }}>
                <Text style={{ color: '#555', fontSize: 12 }}>
                    {shiftLabel()}
                </Text>
                <Input label="Appliance" placeholder="Which appliance is having an issue?" />
                <Input label="Description" placeholder="Describe the issue in detail" multiline />
                <Button title="Submit appliance issue report" onPress={() => router.replace('/home')} />
            </View>
        </Screen>
    )
}