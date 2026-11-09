import { useState, useEffect } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import { getLocations, insertLocation } from "./database";

const DARK_MODE_KEY = "@myLocation:darkMode";

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    try {
      const value = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (value !== null) {
        setIsSwitchOn(JSON.parse(value));
      }
    } catch (error) {
      console.error("Erro ao carregar o dark mode:", error);
    }
  }

  // darkMode switch event - altera o tema e salva a preferência no AsyncStorage
  async function onToggleSwitch() {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error("Erro ao salvar o dark mode:", error);
    }
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);
    try {
      // Solicita ao usuário a permissão de localização (em primeiro plano)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Permita o acesso à localização para capturar sua posição atual."
        );
        return;
      }

      // Captura a localização atual do dispositivo
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Salva no SQLite e adiciona no topo da lista em tela
      const saved = await insertLocation(coords.latitude, coords.longitude);
      setLocations((current) => [saved, ...current]);
    } catch (error) {
      console.error("Erro ao capturar a localização:", error);
      Alert.alert("Erro", "Não foi possível capturar a localização.");
    } finally {
      setIsLoading(false);
    }
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);
    try {
      const rows = await getLocations();
      setLocations(rows);
    } catch (error) {
      console.error("Erro ao carregar as localizações:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}${
                item.created_at ? `
${item.created_at}` : ""
              }`}
              descriptionNumberOfLines={2}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
