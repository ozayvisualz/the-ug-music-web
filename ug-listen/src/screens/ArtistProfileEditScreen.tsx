import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Check } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

const GENRE_LIST = ["Afrobeat", "Dancehall", "Reggae", "Gospel", "Lugaflow", "R&B", "Soul", "Amapiano", "Hip Hop", "Traditional", "Other"];

export default function ArtistProfileEditScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [artistName, setArtistName] = useState(user?.artist?.artistName || "");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = artistName.trim();
    if (name.length < 2) { Alert.alert("Artist Name", "Enter your artist / stage name."); return; }
    setSaving(true);
    try {
      await trpc.artist.updateArtistProfile.mutate({
        artistName: name,
        genre: genre || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      Alert.alert("Saved", "Your artist profile has been updated.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Artist / Stage Name</Text>
          <TextInput value={artistName} onChangeText={setArtistName} placeholder="Artist name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} autoCapitalize="words" />

          <Text style={styles.label}>Genre</Text>
          <View style={styles.genreWrap}>
            {GENRE_LIST.map((g) => (
              <TouchableOpacity key={g} onPress={() => setGenre(g)} style={[styles.genrePill, { backgroundColor: genre === g ? COLORS.gold : colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: genre === g ? COLORS.bg : colors.text, fontSize: 12, fontWeight: "600" }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Kampala, Uganda" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />

          <Text style={styles.label}>Bio</Text>
          <TextInput value={bio} onChangeText={setBio} placeholder="Tell listeners about you" placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.bg} /> : <><Check size={18} color={COLORS.bg} /><Text style={styles.saveText}>Save Changes</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  content: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  genrePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
});
