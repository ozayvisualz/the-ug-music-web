import { useState, useEffect, useRef } from "react";
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
import { ChevronLeft, Music2, Image as ImageIcon, Upload, Check, Mic2 } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";
import { uploadFile } from "../lib/upload";

const GENRE_LIST = ["Afrobeat", "Dancehall", "Reggae", "Gospel", "Lugaflow", "R&B", "Soul", "Amapiano", "Hip Hop", "Traditional", "Other"];

const MOODS = [
  { id: "chill-relax", emoji: "😌", label: "Chill & Relax" },
  { id: "party-time", emoji: "🎉", label: "Party Time" },
  { id: "love-songs", emoji: "💕", label: "Love Songs" },
  { id: "workout", emoji: "💪", label: "Workout" },
  { id: "road-trip", emoji: "🚗", label: "Road Trip" },
  { id: "late-night", emoji: "🌙", label: "Late Night" },
  { id: "morning-vibes", emoji: "🌅", label: "Morning Vibes" },
  { id: "study-focus", emoji: "📚", label: "Study & Focus" },
  { id: "dancehall-energy", emoji: "🔥", label: "Dancehall Energy" },
  { id: "afrobeat-vibes", emoji: "🎶", label: "Afrobeat Vibes" },
  { id: "gospel-worship", emoji: "🙏", label: "Gospel Worship" },
  { id: "lugaflow-heat", emoji: "🥁", label: "Lugaflow Heat" },
  { id: "amapiano-groove", emoji: "🕺", label: "Amapiano Groove" },
  { id: "emotional", emoji: "🥺", label: "Emotional" },
  { id: "romantic", emoji: "🌹", label: "Romantic" },
  { id: "inspirational", emoji: "✨", label: "Inspirational" },
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "sad", emoji: "💔", label: "Sad" },
  { id: "motivational", emoji: "🚀", label: "Motivational" },
  { id: "street-vibes", emoji: "🏙️", label: "Street Vibes" },
  { id: "celebration", emoji: "🎊", label: "Celebration" },
  { id: "cultural", emoji: "🏛️", label: "Cultural" },
  { id: "acoustic", emoji: "🎸", label: "Acoustic" },
  { id: "rnb", emoji: "🎤", label: "R&B" },
  { id: "reggae", emoji: "🟡", label: "Reggae" },
  { id: "soul", emoji: "🎷", label: "Soul" },
  { id: "jazz", emoji: "🎹", label: "Jazz" },
  { id: "instrumental", emoji: "🎻", label: "Instrumental" },
];

export default function ArtistUploadScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [songwriters, setSongwriters] = useState("");
  const [producer, setProducer] = useState("");
  const [beatProducer, setBeatProducer] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [audio, setAudio] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [cover, setCover] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const [featuredArtistId, setFeaturedArtistId] = useState("");
  const [featuredArtistName, setFeaturedArtistName] = useState("");
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredResults, setFeaturedResults] = useState<any[]>([]);
  const featuredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (featuredTimer.current) clearTimeout(featuredTimer.current);
    const q = featuredSearch.trim();
    if (!q) { setFeaturedResults([]); return; }
    featuredTimer.current = setTimeout(async () => {
      try {
        const data = await trpc.music.getArtists.query({ search: q, limit: 6 });
        setFeaturedResults(Array.isArray(data) ? data : []);
      } catch {
        setFeaturedResults([]);
      }
    }, 250);
    return () => { if (featuredTimer.current) clearTimeout(featuredTimer.current); };
  }, [featuredSearch]);

  const [submitting, setSubmitting] = useState(false);

  async function readDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      const d = status && "durationMillis" in status && status.durationMillis ? Math.round(status.durationMillis / 1000) : 0;
      try { await sound.unloadAsync(); } catch {}
      return d;
    } catch {
      return 0;
    }
  }

  const toggleMood = (id: string) => {
    setMoods((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.length < 5 ? [...m, id] : m));
  };

  const toggleGenre = (g: string) => {
    setGenres((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : cur.length < 2 ? [...cur, g] : cur));
  };

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
      const duration = (await readDuration(audio.uri)) || 180;
      await trpc.artist.uploadSong.mutate({
        title: title.trim(),
        genre: genres[0] || undefined,
        genres: genres.length > 0 ? JSON.stringify(genres) : undefined,
        description: description || undefined,
        duration,
        fileUrl,
        coverUrl: coverUrl || undefined,
        featuredArtistId: featuredArtistId || undefined,
        story: story.trim() || undefined,
        releaseDate: releaseDate.trim() || undefined,
        songwriters: songwriters.trim() || undefined,
        producer: producer.trim() || undefined,
        beatProducer: beatProducer.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        moods: moods.length > 0 ? JSON.stringify(moods) : undefined,
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
          {/* Audio + Cover */}
          <TouchableOpacity style={[styles.pickBox, { borderColor: audio ? COLORS.green : colors.border }]} onPress={pickAudio}>
            {audio ? <Check size={20} color={COLORS.green} /> : <Upload size={20} color={colors.textMuted} />}
            <Text style={[styles.pickText, { color: audio ? COLORS.green : colors.text }]} numberOfLines={1}>
              {audio ? audio.name : "Select audio file (MP3, WAV, M4A, FLAC)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pickBox, { borderColor: cover ? COLORS.green : colors.border }]} onPress={pickCover}>
            {cover ? <Image source={{ uri: cover.uri }} style={styles.coverThumb} /> : <ImageIcon size={20} color={colors.textMuted} />}
            <Text style={[styles.pickText, { color: cover ? COLORS.green : colors.text }]} numberOfLines={1}>
              {cover ? "Cover art selected" : "Select cover art (optional)"}
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Song title" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />

          {/* Featured Artist */}
          {featuredArtistName ? (
            <View style={[styles.featuredRow, { borderColor: colors.border }]}>
              <Mic2 size={16} color={COLORS.gold} />
              <Text style={[styles.featuredText, { color: colors.white }]}>{featuredArtistName}</Text>
              <TouchableOpacity onPress={() => { setFeaturedArtistId(""); setFeaturedArtistName(""); }}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Featured Artist</Text>
              <TextInput value={featuredSearch} onChangeText={setFeaturedSearch} placeholder="Search artist to feature..." placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
              {featuredResults.length > 0 && (
                <View style={[styles.featuredResults, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {featuredResults.map((a: any) => (
                    <TouchableOpacity key={a.id} onPress={() => { setFeaturedArtistId(a.id); setFeaturedArtistName(a.artistName || a.user?.name || "Artist"); setFeaturedSearch(""); }} style={styles.featuredItem}>
                      <Text style={[styles.featuredResultText, { color: colors.white }]}>{a.artistName || a.user?.name || "Artist"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Genre */}
          <Text style={styles.label}>Genres (up to 2)</Text>
          <View style={styles.genreWrap}>
            {GENRE_LIST.map((g) => (
              <TouchableOpacity key={g} onPress={() => toggleGenre(g)} style={[styles.genrePill, { backgroundColor: genres.includes(g) ? COLORS.gold : colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: genres.includes(g) ? COLORS.bg : colors.text, fontSize: 12, fontWeight: "600" }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Moods */}
          <Text style={styles.label}>Moods (up to 5)</Text>
          <View style={styles.genreWrap}>
            {MOODS.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => toggleMood(m.id)} style={[styles.genrePill, { backgroundColor: moods.includes(m.id) ? COLORS.gold : colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: moods.includes(m.id) ? COLORS.bg : colors.text, fontSize: 12 }}>{m.emoji} {m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Tell listeners about this song..." placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]} />

          {/* Behind the Song */}
          <Text style={[styles.sectionTitle, { color: colors.gold }]}>Behind the Song</Text>
          <Text style={styles.label}>Story</Text>
          <TextInput value={story} onChangeText={setStory} placeholder="The story behind this song..." placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]} />
          <Text style={styles.label}>Release Date</Text>
          <TextInput value={releaseDate} onChangeText={setReleaseDate} placeholder="e.g. March 2025" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
          <Text style={styles.label}>Songwriters / Producers</Text>
          <TextInput value={songwriters} onChangeText={setSongwriters} placeholder="Name the songwriters" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
          <Text style={styles.label}>Music Producer</Text>
          <TextInput value={producer} onChangeText={setProducer} placeholder="Music producer name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
          <Text style={styles.label}>Beat Producer</Text>
          <TextInput value={beatProducer} onChangeText={setBeatProducer} placeholder="Beat producer name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
          <Text style={styles.label}>Music Video URL</Text>
          <TextInput value={videoUrl} onChangeText={setVideoUrl} placeholder="YouTube link (optional)" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />

          {/* Lyrics */}
          <Text style={styles.label}>Lyrics</Text>
          <TextInput value={lyrics} onChangeText={setLyrics} placeholder="Add song lyrics..." placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.textarea, { color: colors.white, borderColor: colors.border }]} />

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
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10, marginTop: 6 },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  genrePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  featuredRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  featuredText: { flex: 1, fontSize: 14 },
  remove: { fontSize: 12, color: COLORS.textMuted },
  featuredResults: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  featuredItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  featuredResultText: { fontSize: 13 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  submitText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
});
