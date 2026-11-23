import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import Screen from '../components/Screen';
import { colors } from '../constants/colors';

// TODO:
// - Real login check (email and password)
// - Show an error message when login fails
// - "Forgot password?" should be tappable and open a reset screen
// - Remember the user so they stay logged in
// - Show users real name on Home based on who logged in

export default function Index() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Image

          source={require('../../assets/images/logo.png')}
          style={{ width: '100%', height: 90 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
          Tommyfield Ops
        </Text>
        <Text style={{ textAlign: 'center', color: '#555', marginBottom: 12 }}>
          Sign in to your shift
        </Text>

        <Input label="Email" placeholder="GM@tommyfield.ca" />
        <Input label="Password" secureTextEntry />

        <Button title="Log in" onPress={() => router.push('/home')} />

        <Text style={{ textAlign: 'center', color: colors.red, fontSize: 12 }}>
          Forgot password?
        </Text>
      </View>
    </Screen>
  );
}