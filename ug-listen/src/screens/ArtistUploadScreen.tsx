import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Music2, Image as ImageIcon, Upload, Check } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";
import { uploadFile } from "../lib/upload";

const GENRE_LIST = ["Afrobeat", "Dancehall", "Reggae", "Gospel", "Lugaflow", "R&B", "Soul", "Amapiano", "Hip Hop", "Traditional", "Other"];

export default function ArtistUploadScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [audio, setAudio] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [cover, setCover] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["audio/*"], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      setAudio({ uri: a.uri, name: a.name || "song.mp3", mimeType: a.mimeType || "audio/mpeg" });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not pick audio file.");
    }
  };

  const pickCover = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      setCover({ uri: a.uri, name: a.fileName || "cover.jpg", mimeType: a.mimeType || "image/jpeg" });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not pick cover art.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Title", "Please enter a song title."); return; }
    if (!audio) { Alert.alert("Audio", "Please select an audio file."); return; }
    setSubmitting(true);
    try {
      const fileUrl = await uploadFile(audio.uri, audio.name, audio.mimeType);
      let coverUrl: string | undefined;
      if (cover) {
        coverUrl = await uploadFile(cover.uri, cover.name, cover.mimeType);
      }
      await trpc.artist.uploadSong.mutate({
        title: title.trim(),
        genre: genre || undefined,
        description: description || undefined,
        duration: 180,
        fileUrl,
        coverUrl,
      });
      Alert.alert("Submitted", "Your song has been submitted for review.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Upload Failed", e?.message || "Could not upload song.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Upload Song</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={[styles.pickBox, { borderColor: audio ? COLORS.green : colors.border }]} onPress={pickAudio}>
            {audio ? <Check size={20} color={COLORS.green} /> : <Music2 size={20} color={colors.textMuted} />}
            <Text style={[styles.pickText, { color: audio ? COLORS.green : colors.text }]} numberOfLines={1}>
              {audio ? audio.name : "Select audio file (MP3, WAV, M4A)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pickBox, { borderColor: cover ? COLORS.green : colors.border }]} onPress={pickCover}>
            {cover ? <Image source={{ uri: cover.uri }} style={styles.coverThumb} /> : <ImageIcon size={20} color={colors.textMuted} />}
            <Text style={[styles.pickText, { color: cover ? COLORS.green : colors.text }]} numberOfLines={1}>
              {cover ? "Cover art selected" : "Select cover art (optional)"}
            </Text>
          </TouchableOpacity>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Song title"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.white, borderColor: colors.border }]}
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]}
          />

          <Text style={styles.label}>Genre</Text>
          <View style={styles.genreWrap}>
            {GENRE_LIST.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGenre(g)}
                style={[styles.genrePill, { backgroundColor: genre === g ? COLORS.gold : colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: genre === g ? COLORS.bg : colors.text, fontSize: 12, fontWeight: "600" }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={COLORS.bg} /> : <><Upload size={18} color={COLORS.bg} /><Text style={styles.submitText}>Submit for Review</Text></>}
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
  pickBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  pickText: { flex: 1, fontSize: 13, flexShrink: 1 },
  coverThumb: { width: 20, height: 20, borderRadius: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, fontWeight: "600" },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  genrePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  submitText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
});
