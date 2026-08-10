import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
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
} from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { logout } from "../api/auth";
import { useAuthStore } from "../store/authStore";

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
      <View style={styles.root}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>You're not signed in</Text>
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
              <Text style={styles.authOutlineBtnText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Crown size={20} color={COLORS.gold} />,
      label: "Premium Plans",
      color: COLORS.gold,
      onPress: () => navigation.navigate("PremiumScreen"),
    },
    {
      icon: <Clock size={20} color={COLORS.text} />,
      label: "Listening History",
      onPress: () => {},
    },
    {
      icon: <Heart size={20} color={COLORS.text} />,
      label: "Liked Songs",
      onPress: () => {},
    },
    {
      icon: <Download size={20} color={COLORS.text} />,
      label: "Downloads",
      onPress: () => {},
    },
    {
      icon: <CreditCard size={20} color={COLORS.text} />,
      label: "Payment Methods",
      onPress: () => {},
    },
    {
      icon: <Bell size={20} color={COLORS.text} />,
      label: "Notifications",
      onPress: () => {},
    },
    {
      icon: <Share2 size={20} color={COLORS.text} />,
      label: "Invite Friends",
      onPress: () => {},
    },
    {
      icon: <Settings size={20} color={COLORS.text} />,
      label: "Settings",
      onPress: () => {},
    },
    {
      icon: <HelpCircle size={20} color={COLORS.text} />,
      label: "Support",
      onPress: () => navigation.navigate("SupportScreen"),
    },
    {
      icon: <LogOut size={20} color={COLORS.red} />,
      label: "Sign Out",
      color: COLORS.red,
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
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

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Liked Songs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
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
                  item.color ? { color: item.color } : null,
                ]}
              >
                {item.label}
              </Text>
              <ChevronRight size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
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
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  authRow: {
    flexDirection: "row",
    gap: 12,
  },
  authBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  authBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 15,
  },
  authOutlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  authOutlineBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.bg,
    fontSize: 24,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  roleArtist: {
    backgroundColor: COLORS.goldMuted,
  },
  roleListener: {
    backgroundColor: COLORS.border,
  },
  roleText: {
    fontSize: 12,
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
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 28,
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.white,
  },
});
