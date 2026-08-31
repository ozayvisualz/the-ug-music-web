import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./navigationRef";
import { View, StyleSheet } from "react-native";
import { Home, Compass, Library, User, Radio } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
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
import CategoryPlaylistScreen from "../screens/CategoryPlaylistScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import PremiumScreen from "../screens/PremiumScreen";
import SupportScreen from "../screens/SupportScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ArtistPortalScreen from "../screens/ArtistPortalScreen";
import ArtistSongsScreen from "../screens/ArtistSongsScreen";
import ArtistUploadScreen from "../screens/ArtistUploadScreen";
import ArtistAnalyticsScreen from "../screens/ArtistAnalyticsScreen";
import ArtistEarningsScreen from "../screens/ArtistEarningsScreen";
import ArtistProfileEditScreen from "../screens/ArtistProfileEditScreen";
import ArtistFollowersScreen from "../screens/ArtistFollowersScreen";
import ArtistCommentsScreen from "../screens/ArtistCommentsScreen";
import ArtistAlbumsScreen from "../screens/ArtistAlbumsScreen";
import ArtistWithdrawalsScreen from "../screens/ArtistWithdrawalsScreen";
import ArtistAlbumCreateScreen from "../screens/ArtistAlbumCreateScreen";
import ArtistPaymentMethodsScreen from "../screens/ArtistPaymentMethodsScreen";
import ArtistRequestPayoutScreen from "../screens/ArtistRequestPayoutScreen";
import MiniPlayer from "../components/MiniPlayer";
import FullPlayer from "../components/FullPlayer";
import { useState } from "react";

const Tab = createBottomTabNavigator();

function HomeStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 250 }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="MadeInUganda" component={MadeInUgandaScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="CategoryPlaylist" component={CategoryPlaylistScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function DiscoverStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 250 }}>
      <Stack.Screen name="DiscoverMain" component={DiscoverScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="CategoryPlaylist" component={CategoryPlaylistScreen} />
    </Stack.Navigator>
  );
}

function LibraryStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 250 }}>
      <Stack.Screen name="LibraryMain" component={LibraryScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 250 }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="ArtistPortal" component={ArtistPortalScreen} />
      <Stack.Screen name="ArtistSongs" component={ArtistSongsScreen} />
      <Stack.Screen name="ArtistUpload" component={ArtistUploadScreen} />
      <Stack.Screen name="ArtistAnalytics" component={ArtistAnalyticsScreen} />
      <Stack.Screen name="ArtistEarnings" component={ArtistEarningsScreen} />
      <Stack.Screen name="ArtistProfileEdit" component={ArtistProfileEditScreen} />
      <Stack.Screen name="ArtistFollowers" component={ArtistFollowersScreen} />
      <Stack.Screen name="ArtistComments" component={ArtistCommentsScreen} />
      <Stack.Screen name="ArtistAlbums" component={ArtistAlbumsScreen} />
      <Stack.Screen name="ArtistWithdrawals" component={ArtistWithdrawalsScreen} />
      <Stack.Screen name="ArtistAlbumCreate" component={ArtistAlbumCreateScreen} />
      <Stack.Screen name="ArtistPaymentMethods" component={ArtistPaymentMethodsScreen} />
      <Stack.Screen name="ArtistRequestPayout" component={ArtistRequestPayoutScreen} />
      <Stack.Screen name="ArtistNotifications" component={NotificationsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              const props = { size: size || 22, color };
              switch (route.name) {
                case "Home": return <Home {...props} />;
                case "Discover": return <Compass {...props} />;
                case "Library": return <Library {...props} />;
                case "Radio": return <Radio {...props} />;
                case "Profile": return <User {...props} />;
                default: return null;
              }
            },
            tabBarActiveTintColor: COLORS.gold,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: [styles.tabBar, { backgroundColor: colors.bg, borderTopColor: colors.border }],
            tabBarShowLabel: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Discover" component={DiscoverStack} />
          <Tab.Screen name="Radio" component={RadioScreen} />
          <Tab.Screen name="Library" component={LibraryStack} />
          <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
      </NavigationContainer>
      <MiniPlayer onExpand={() => setExpanded(true)} />
      {expanded && <FullPlayer onCollapse={() => setExpanded(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    backgroundColor: COLORS.bg,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
});
