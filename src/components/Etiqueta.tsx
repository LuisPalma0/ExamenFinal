import { Text, View } from 'react-native';

type Props = {
    texto: string;
    color: string;
};

export default function Etiqueta({ texto, color }: Props) {
    return (
        <View style={{ backgroundColor: color, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start'}}>
            <Text style={{ color: '#ffffff', fontSize: 12 }}>{texto}</Text>
        </View>
    );
}