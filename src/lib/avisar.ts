import { Alert, Platform } from 'react-native';

// Alert.alert no funciona en la versión web de Expo, por eso usamos esta función
export function avisar(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
}
