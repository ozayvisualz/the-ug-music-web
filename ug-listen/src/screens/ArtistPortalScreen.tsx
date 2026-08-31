import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  Mic2,
  Music2,
  Upload,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Plus,
  TrendingUp,
  Wallet,
  User,
  Users,
  MessageCircle,
  Disc3,
  Banknote,
  Bell,
  CreditCard,
} from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";
import { getStoredToken } from "../api/auth";

type Status = "loading" | "listener" | "pending" | "approved" | "rejected" | "error";

export default function ArtistPortalScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { colors } = useTheme();

  const [status, setStatus] = useState<Status>("loading");
  const [artist, setArtist] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [artistName, setArtistName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!user) { setStatus("listener"); return; }
    const isArtist = user.role === "ARTIST" || !!user.artist;
    if (!isArtist) { setStatus("listener"); return; }
    try {
      const token = await getStoredToken();
      const res = await fetch("https://www.theugmusic.com/api/artist/apply", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArtist(data || null);
      if (data?.verificationStatus === "approved") {
        setStatus("approved");
        trpc.artist.getMyAnalytics.query({ days: 30 }).then(setStats).catch(() => {});
      } else if (data?.verificationStatus === "rejected") {
        setStatus("rejected");
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("error");
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => { loadStatus(); }, [loadStatus])
  );

  const handleBecomeArtist = async () => {
    const name = artistName.trim();
    if (name.length < 2) { Alert.alert("Artist name", "Enter your artist / stage name."); return; }
    setSubmitting(true);
    try {
      await trpc.auth.becomeArtist.mutate({ artistName: name });
      setUser({ ...(user as any), role: "ARTIST", artist: { artistName: name } });
      setStatus("pending");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create your artist account.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => navigation.goBack();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Artist Portal</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {status === "loading" && (
            <View style={styles.center}><ActivityIndicator color={COLORS.gold} /></View>
          )}

          {status === "error" && (
            <View style={styles.center}>
              <Text style={[styles.emptyTitle, { color: colors.white }]}>Something went wrong</Text>
              <TouchableOpacity onPress={loadStatus} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Retry</Text></TouchableOpacity>
            </View>
          )}

          {status === "listener" && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.iconCircle}><Mic2 size={28} color={COLORS.gold} /></View>
              <Text style={[styles.cardTitle, { color: colors.white }]}>Become an Artist</Text>
              <Text style={styles.cardBody}>
                Create your artist account to upload music, track plays and downloads, and manage your artist profile.
              </Text>
              <TextInput
                value={artistName}
                onChangeText={setArtistName}
                placeholder="Artist / Stage Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.white, borderColor: colors.border }]}
                autoCapitalize="words"
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleBecomeArtist} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.primaryBtnText}>Become an Artist</Text>}
              </TouchableOpacity>
            </View>
          )}

          {status === "pending" && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.goldMuted }]}><Clock size={28} color={COLORS.gold} /></View>
              <Text style={[styles.cardTitle, { color: colors.white }]}>Verification Pending</Text>
              <Text style={styles.cardBody}>
                Your artist account{artist?.artistName ? ` "${artist.artistName}"` : ""} is awaiting admin verification. You'll be able to upload music once approved.
              </Text>
              {artist?.rejectionReason ? <Text style={styles.rejection}>Reason: {artist.rejectionReason}</Text> : null}
              <TouchableOpacity onPress={goBack} style={styles.ghostBtn}><Text style={[styles.ghostBtnText, { color: colors.text }]}>Back to Profile</Text></TouchableOpacity>
            </View>
          )}

          {status === "rejected" && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.redMuted }]}><ShieldAlert size={28} color={COLORS.red} /></View>
              <Text style={[styles.cardTitle, { color: colors.white }]}>Application Rejected</Text>
              <Text style={styles.cardBody}>
                Your artist application was not approved.
                {artist?.rejectionReason ? `\n\nReason: ${artist.rejectionReason}` : ""}
              </Text>
              <TouchableOpacity onPress={goBack} style={styles.ghostBtn}><Text style={[styles.ghostBtnText, { color: colors.text }]}>Back to Profile</Text></TouchableOpacity>
            </View>
          )}

          {status === "approved" && (
            <>
              <View style={[styles.banner, { backgroundColor: COLORS.goldMuted, borderColor: COLORS.gold }]}>
                <ShieldCheck size={18} color={COLORS.gold} />
                <Text style={[styles.bannerText, { color: COLORS.gold }]}>Approved Artist</Text>
              </View>

              <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.white }]}>{stats?.totalStreams ?? 0}</Text>
                  <Text style={styles.statLabel}>Plays</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.white }]}>{stats?.totalDownloads ?? 0}</Text>
                  <Text style={styles.statLabel}>Downloads</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.white }]}>{stats?.totalSongs ?? 0}</Text>
                  <Text style={styles.statLabel}>Songs</Text>
                </View>
              </View>

              <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistUpload")}>
                  <View style={styles.menuIcon}><Upload size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Upload Song</Text>
                  <Plus size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistSongs")}>
                  <View style={styles.menuIcon}><Music2 size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>My Songs</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistAnalytics")}>
                  <View style={styles.menuIcon}><TrendingUp size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Analytics</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistAlbums")}>
                  <View style={styles.menuIcon}><Disc3 size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Albums</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistAlbumCreate")}>
                  <View style={styles.menuIcon}><Plus size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Create Album</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistEarnings")}>
                  <View style={styles.menuIcon}><Wallet size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Earnings</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistRequestPayout")}>
                  <View style={styles.menuIcon}><Banknote size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Request Withdrawal</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistWithdrawals")}>
                  <View style={styles.menuIcon}><Banknote size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Withdrawals</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistPaymentMethods")}>
                  <View style={styles.menuIcon}><CreditCard size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Payment Methods</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistFollowers")}>
                  <View style={styles.menuIcon}><Users size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Followers</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistComments")}>
                  <View style={styles.menuIcon}><MessageCircle size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Comments</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ArtistNotifications")}>
                  <View style={styles.menuIcon}><Bell size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Notifications</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate("ArtistProfileEdit")}>
                  <View style={styles.menuIcon}><User size={18} color={COLORS.gold} /></View>
                  <Text style={[styles.menuLabel, { color: colors.white }]}>Edit Profile</Text>
                  <ChevronLeft size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.white, marginBottom: 16 },
  card: { borderRadius: 16, padding: 20, alignItems: "center" },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.goldMuted, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  cardBody: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  input: { width: "100%", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14 },
  primaryBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: COLORS.bg, fontWeight: "700", fontSize: 14 },
  ghostBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  ghostBtnText: { fontSize: 13, fontWeight: "600" },
  rejection: { fontSize: 13, color: COLORS.red, textAlign: "center", marginBottom: 12 },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  bannerText: { fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", borderRadius: 12, paddingVertical: 14, marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statNumber: { fontSize: 18, fontWeight: "700", marginBottom: 3 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },
  menuSection: { borderRadius: 12, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 28, alignItems: "center", marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
});
