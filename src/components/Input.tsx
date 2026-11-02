import { Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';

// TODO:
// - Error state (red border and message)
// - Warning state (amber message, like on Drink sales)
// - Number formatting for dollar amounts


export default function Input({ label, ...props }: any) {
    return (
        <View style={{gap:4}}>
            <Text style = {{fontSize: 12, color: '#555'}}>
                {label}
            </Text>
            <TextInput {...props} style = {{ //uses the spread operator to pass all properties from the props object into the textinput component
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 4,
                padding: 10,
                backgroundColor: colors.field,
            }}/>
        </View>
    );
}