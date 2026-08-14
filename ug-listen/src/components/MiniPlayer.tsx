import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Image } from "react-native";
import { Music2, Play, Pause, SkipForward, X } from "lucide-react-native";
import { COLORS, RADIUS, HIT_SLOP } from "../constants/theme";
import { usePlayer } from "./PlayerContext";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;

type Props = { onExpand?: () => void };

export default function MiniPlayer({ onExpand }: Props) {
  const { currentTrack, isPlaying, isLoaded, position, duration, togglePlay, skipNext, stopPlayback } = usePlayer();
  const { colors } = useTheme();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={[styles.bar, { backgroundColor: colors.gold, width: `${progress * 100}%` }]} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.infoWrap} activeOpacity={0.9} onPress={onExpand}>
          <View style={[styles.art, { backgroundColor: colors.gold }]}>
            {currentTrack.coverUrl ? (
              <Image source={{ uri: currentTrack.coverUrl }} style={styles.artImg} />
            ) : isLoaded ? <Music2 size={18} color={colors.bg} /> : <ActivityIndicator size="small" color={colors.bg} />}
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={[styles.artist, { color: colors.textMuted }]} numberOfLines={1}>{isLoaded ? currentTrack.artist : "Loading..."}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} hitSlop={HIT_SLOP} style={styles.btn} disabled={!isLoaded}>
          {!isLoaded ? <ActivityIndicator size="small" color={colors.gold} /> : isPlaying ? <Pause size={20} color={colors.gold} /> : <Play size={20} color={colors.gold} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={skipNext} hitSlop={HIT_SLOP} style={styles.btn}>
          <SkipForward size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={stopPlayback} hitSlop={HIT_SLOP} style={styles.btn}>
          <X size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MINI_MARGIN = Math.min(SW * 0.02, 8);
const miniHeight = SW < 360 ? 48 : 54;
const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: Math.min(60, SW * 0.16), left: MINI_MARGIN, right: MINI_MARGIN, height: miniHeight, borderRadius: RADIUS.lg, borderTopWidth: 0, borderWidth: 1, overflow: "hidden" },
  bar: { position: "absolute", top: 0, left: 0, height: 2 },
  row: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: Math.min(SW * 0.025, 10), gap: Math.min(SW * 0.02, 10) },
  art: { width: miniHeight - 18, height: miniHeight - 18, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  artImg: { width: "100%", height: "100%", resizeMode: "cover" },
  infoWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: Math.min(SW * 0.02, 10) },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: SW < 360 ? 11 : 13, fontWeight: "600", flexShrink: 1 },
  artist: { fontSize: SW < 360 ? 9 : 11, marginTop: 1, flexShrink: 1 },
  btn: { padding: 4 },
});
