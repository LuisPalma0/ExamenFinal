import { Text, TouchableOpacity } from 'react-native';

type Props = {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
};

export default function Boton({ titulo, onPress, deshabilitado = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={deshabilitado}
      style={{ backgroundColor: deshabilitado ? '#999999' : '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' }}
    >
      <Text style={{ color: '#ffffff', fontWeight: '600' }}>{titulo}</Text>
    </TouchableOpacity>
  );
}