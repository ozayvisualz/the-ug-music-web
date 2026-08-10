import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
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
  Music2,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { logout } from "../api/auth";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

function MenuItem({
  icon: Icon,
  label,
  color = COLORS.text,
  onPress,
  isLast = false,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  color?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: color + "20" }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={[styles.menuItemLabel, color !== COLORS.text && { color }]}>
          {label}
        </Text>
      </View>
      <ChevronRight size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const likedQuery =
    trpc.social?.getLikedSongs?.useQuery
      ? trpc.social.getLikedSongs.useQuery(undefined, { enabled: !!user })
      : { data: [] };

  const playlistsQuery =
    trpc.playlist?.getMyPlaylists?.useQuery
      ? trpc.playlist.getMyPlaylists.useQuery(undefined, { enabled: !!user })
      : { data: [] };

  const likedCount = user ? (likedQuery.data as any[])?.length ?? 0 : 0;
  const playlistCount = user ? (playlistsQuery.data as any[])?.length ?? 0 : 0;

  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              setUser(null);
            } catch {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [setUser]);

  const handleLoginPress = useCallback(() => {
    navigation.navigate("ProfileTab", { screen: "Profile" });
  }, [navigation]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </Animated.View>
        <View style={styles.notLoggedIn}>
          <View style={styles.avatarPlaceholderLarge}>
            <Music2 size={40} color={COLORS.textMuted} />
          </View>
          <Text style={styles.notLoggedInTitle}>
            Sign in to your account
          </Text>
          <Text style={styles.notLoggedInSubtitle}>
            Access your profile, playlists, and more
          </Text>
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const firstLetter = user.name?.charAt(0)?.toUpperCase() ?? "?";
  const isArtist = user.role === "ARTIST";

  const menuItems = [
    {
      icon: Crown,
      label: "Premium Plans",
      color: COLORS.gold,
      onPress: () => navigation.navigate("Premium"),
    },
    {
      icon: Clock,
      label: "Listening History",
      color: COLORS.text,
      onPress: () => navigation.navigate("ProfileTab", { screen: "Profile" }),
    },
    {
      icon: Heart,
      label: "Liked Songs",
      color: COLORS.red,
      onPress: () => navigation.navigate("LibraryTab", { screen: "Library" }),
    },
    {
      icon: Download,
      label: "Downloads",
      color: COLORS.text,
      onPress: () => navigation.navigate("LibraryTab", { screen: "Library" }),
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      color: COLORS.text,
      onPress: undefined,
    },
    {
      icon: Bell,
      label: "Notifications",
      color: COLORS.text,
      onPress: undefined,
    },
    {
      icon: Share2,
      label: "Invite Friends",
      color: COLORS.text,
      onPress: undefined,
    },
    {
      icon: Settings,
      label: "Settings",
      color: COLORS.text,
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: HelpCircle,
      label: "Support",
      color: COLORS.text,
      onPress: () => navigation.navigate("Support"),
    },
    {
      icon: LogOut,
      label: "Sign Out",
      color: COLORS.red,
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.userCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: isArtist ? COLORS.gold : COLORS.surface },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                { color: isArtist ? "#000" : COLORS.textMuted },
              ]}
            >
              {user.role}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={styles.statsRow}
        >
          <StatBadge label="Liked" value={likedCount} />
          <View style={styles.statsDivider} />
          <StatBadge label="Playlists" value={playlistCount} />
          <View style={styles.statsDivider} />
          <StatBadge label="Downloads" value={0} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).springify()}
          style={styles.menuSection}
        >
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInRight.delay(180 + index * 30).springify()}
            >
              <MenuItem
                icon={item.icon}
                label={item.label}
                color={item.color}
                onPress={item.onPress}
                isLast={index === menuItems.length - 1}
              />
            </Animated.View>
          ))}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notLoggedIn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  avatarPlaceholderLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  notLoggedInTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 8,
  },
  notLoggedInSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  authButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  loginBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  registerBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  userCard: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 50,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginTop: 8,
  },
  statBadge: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#27272A",
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#27272A",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  bottomSpacer: {
    height: 40,
  },
});
