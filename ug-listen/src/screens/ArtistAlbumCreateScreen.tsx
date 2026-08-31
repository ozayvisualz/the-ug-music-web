import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Disc3, Check } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

const GENRE_LIST = ["Afrobeat", "Dancehall", "Reggae", "Gospel", "Lugaflow", "R&B", "Soul", "Amapiano", "Hip Hop", "Traditional", "Other"];

export default function ArtistAlbumCreateScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert("Title", "Please enter an album title."); return; }
    setSaving(true);
    try {
      await trpc.artist.uploadAlbum.mutate({
        title: title.trim(),
        description: description || undefined,
        genre: genre || undefined,
        releaseDate: releaseDate || undefined,
        songs: [],
      });
      Alert.alert("Created", "Your album has been created.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create album.");
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
          <Text style={[styles.headerTitle, { color: colors.white }]}>Create Album</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Album Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Album title" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="About this album" placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]} />

          <Text style={styles.label}>Release Date (optional)</Text>
          <TextInput value={releaseDate} onChangeText={setReleaseDate} placeholder="e.g. March 2025" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />

          <Text style={styles.label}>Genre</Text>
          <View style={styles.genreWrap}>
            {GENRE_LIST.map((g) => (
              <TouchableOpacity key={g} onPress={() => setGenre(g)} style={[styles.genrePill, { backgroundColor: genre === g ? COLORS.gold : colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: genre === g ? COLORS.bg : colors.text, fontSize: 12, fontWeight: "600" }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.bg} /> : <><Check size={18} color={COLORS.bg} /><Text style={styles.saveText}>Create Album</Text></>}
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
  textarea: { minHeight: 70, textAlignVertical: "top" },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  genrePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
});
