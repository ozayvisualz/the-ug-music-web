import { useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home, Compass, Library, User } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";
import MiniPlayer from "../components/MiniPlayer";
import FullPlayer from "../components/FullPlayer";

import HomeScreen from "../screens/HomeScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import LibraryScreen from "../screens/LibraryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SongScreen from "../screens/SongScreen";
import ArtistScreen from "../screens/ArtistScreen";
import PlaylistScreen from "../screens/PlaylistScreen";
import SearchScreen from "../screens/SearchScreen";
import MadeInUgandaScreen from "../screens/MadeInUgandaScreen";
import RadioScreen from "../screens/RadioScreen";
import PremiumScreen from "../screens/PremiumScreen";
import SupportScreen from "../screens/SupportScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.bg },
  animation: "slide_from_right" as const,
};

function HomeStackScreen() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="MadeInUganda" component={MadeInUgandaScreen} />
      <Stack.Screen name="Radio" component={RadioScreen} />
    </Stack.Navigator>
  );
}

function DiscoverStackScreen() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

function LibraryStackScreen() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
    </Stack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { queue, currentIndex } = useQueueStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const expandProgress = useSharedValue(0);

  const toggleExpand = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    expandProgress.value = withTiming(next ? 1 : 0, {
      duration: 350,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isExpanded, expandProgress]);

  const miniPlayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandProgress.value,
    transform: [{ translateY: expandProgress.value * 120 }],
    pointerEvents: expandProgress.value > 0.5 ? "none" : "auto",
  }));

  const fullPlayerStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY: (1 - expandProgress.value) * 600,
      },
    ],
    pointerEvents: expandProgress.value > 0.5 ? "auto" : "none",
  }));

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.gold,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="HomeTab"
            component={HomeStackScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Home size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="DiscoverTab"
            component={DiscoverStackScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Compass size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="LibraryTab"
            component={LibraryStackScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Library size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="ProfileTab"
            component={ProfileStackScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <User size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>

        {currentTrack && (
          <>
            <Animated.View
              style={[styles.miniPlayerContainer, miniPlayerStyle]}
            >
              <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
                <MiniPlayer />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[styles.fullPlayerContainer, fullPlayerStyle]}
            >
              <FullPlayer onCollapse={toggleExpand} />
            </Animated.View>
          </>
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  tabBar: {
    backgroundColor: "#09090B",
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  miniPlayerContainer: {
    position: "absolute",
    bottom: 64,
    left: 0,
    right: 0,
  },
  fullPlayerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
});
