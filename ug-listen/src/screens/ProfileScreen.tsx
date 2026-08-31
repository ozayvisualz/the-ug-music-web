import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Crown,
  Clock,
  Heart,
  Download,
  CreditCard,
  Bell,
  Share2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mic2,
} from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { logout, refreshUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";
import { useLikedStore } from "../store/likedStore";
import { useDownloadStore } from "../store/downloadStore";

const SW = Dimensions.get("window").width;

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  color?: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { colors } = useTheme();
  const displayName = user?.name ?? "";

  const likedCount = useLikedStore((s) => s.likedIds.size);
  const downloadCount = useDownloadStore((s) => Object.keys(s.downloaded).length);
  const loadDownloads = useDownloadStore((s) => s.load);
  const [playlistCount, setPlaylistCount] = useState(0);

  useEffect(() => {
    loadDownloads().catch(() => {});
  }, [loadDownloads]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      trpc.playlist.getMyPlaylists.query()
        .then((data: any[]) => setPlaylistCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    }, [user])
  );

  // Refresh the user's role/artist state from the server so admin role changes reflect immediately.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshUser().then((fresh) => { if (active && fresh) setUser(fresh); }).catch(() => {});
      return () => { active = false; };
    }, [setUser])
  );

  const handleLogout = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          setUser(null);
        },
      },
    ]);
  }, [setUser]);

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.white }]}>You're not signed in</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to access your profile, playlists, and more.
          </Text>
          <View style={styles.authRow}>
            <TouchableOpacity
              style={styles.authBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.authBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.authOutlineBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={[styles.authOutlineBtnText, { color: colors.white }]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Crown size={18} color={COLORS.gold} />,
      label: "Premium Plans",
      color: COLORS.gold,
      onPress: () => navigation.navigate("Premium"),
    },
    {
      icon: <Mic2 size={18} color={COLORS.gold} />,
      label: "Artist Portal",
      color: COLORS.gold,
      onPress: () => navigation.navigate("ArtistPortal"),
    },
    {
      icon: <Clock size={18} color={COLORS.text} />,
      label: "Listening History",
      onPress: () => navigation.navigate("Library", { screen: "LibraryMain", params: { tab: "History" } }),
    },
    {
      icon: <Heart size={18} color={COLORS.text} />,
      label: "Liked Songs",
      onPress: () => navigation.navigate("Library", { screen: "LibraryMain", params: { tab: "Liked" } }),
    },
    {
      icon: <Download size={18} color={COLORS.text} />,
      label: "Downloads",
      onPress: () => navigation.navigate("Library", { screen: "LibraryMain", params: { tab: "Downloads" } }),
    },
    {
      icon: <CreditCard size={18} color={COLORS.text} />,
      label: "Payment Methods",
      onPress: () => Alert.alert("Payment Methods", "Payment methods are managed securely during checkout."),
    },
    {
      icon: <Bell size={18} color={COLORS.text} />,
      label: "Notifications",
      onPress: () => navigation.navigate("Home", { screen: "Notifications" }),
    },
    {
      icon: <Share2 size={18} color={COLORS.text} />,
      label: "Invite Friends",
      onPress: () => Share.share({ message: "Join me on TheUgMusic — stream & download the best Ugandan music! https://www.theugmusic.com" }).catch(() => {}),
    },
    {
      icon: <Settings size={18} color={COLORS.text} />,
      label: "Settings",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: <HelpCircle size={18} color={COLORS.text} />,
      label: "Support",
      onPress: () => navigation.navigate("Support"),
    },
    {
      icon: <LogOut size={18} color={COLORS.red} />,
      label: "Sign Out",
      color: COLORS.red,
      onPress: handleLogout,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.name, { color: colors.white }]}>{displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View
            style={[
              styles.roleBadge,
              user.role === "ARTIST" ? styles.roleArtist : styles.roleListener,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                user.role === "ARTIST" ? styles.roleArtistText : styles.roleListenerText,
              ]}
            >
              {user.role}
            </Text>
          </View>
        </View>

          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.white }]}>{likedCount}</Text>
            <Text style={styles.statLabel}>Liked Songs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.white }]}>{playlistCount}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.white }]}>{downloadCount}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={styles.menuIconWrap}>{item.icon}</View>
              <Text
                style={[
                  styles.menuLabel,
                  item.color ? { color: item.color } : { color: colors.white },
                ]}
              >
                {item.label}
              </Text>
              <ChevronRight size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  authRow: {
    flexDirection: "row",
    gap: 10,
  },
  authBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  authBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  authOutlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  authOutlineBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingBottom: 70,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 18,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  avatarText: {
    color: COLORS.bg,
    fontSize: 20,
    fontWeight: "700",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 3,
  },
  email: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  roleArtist: {
    backgroundColor: COLORS.goldMuted,
  },
  roleListener: {
    backgroundColor: COLORS.border,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  roleArtistText: {
    color: COLORS.gold,
  },
  roleListenerText: {
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minWidth: 0,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.white,
    flexShrink: 1,
  },
});
