import {Text, TouchableOpacity} from 'react-native';
import {colors} from '../constants/colors'

// TODO:
// - Loading state (spinner while saving)
// - Disabled state

export default function Button({title, outline, onPress}: any) {
    return (
        <TouchableOpacity onPress={onPress} //TouchableOpacity is a core React Native component used to make views respond to touch events by reducing their opacity when pressed, giving a visual feedback effect
        style={{
            backgroundColor: outline ? colors.field : colors.red,
            borderWidth: 1,
            borderColor: outline ? colors.border : colors.red,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
      }}>

        <Text style= {{ color: outline ? 'black' : 'white', fontWeight: 'bold'}}>
            {title}
        </Text>
      </TouchableOpacity>

        
    )
}