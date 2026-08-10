import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Music2,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Heart,
  Download,
  ListPlus,
  Share2,
  Chevrondown,
} from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";

type Props = {
  onCollapse?: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FullPlayer({ onCollapse }: Props) {
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const [playing, setPlaying] = useState(true);
  const [tab, setTab] = useState<"lyrics" | "queue" | "comments">("lyrics");
  const [liked, setLiked] = useState(false);

  const track = currentIndex >= 0 ? queue[currentIndex] : null;

  if (!track) return null;

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backdrop} onPress={onCollapse} />

      <View style={styles.sheet}>
        <View style={styles.dragBar}>
          <TouchableOpacity onPress={onCollapse} style={styles.dragPill}>
            <Chevrondown size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkLarge}>
          <Music2 size={80} color={COLORS.bg} />
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>

        <View style={styles.seekSection}>
          <View style={styles.seekTrack}>
            <View style={styles.seekFill} />
            <View style={styles.seekThumb} />
          </View>
          <View style={styles.seekTimes}>
            <Text style={styles.seekTimeText}>1:23</Text>
            <Text style={styles.seekTimeText}>3:45</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlSmall}>
            <Shuffle size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlSmall}>
            <SkipBack size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setPlaying((p) => !p)}
          >
            {playing ? (
              <Pause size={28} color={COLORS.bg} />
            ) : (
              <Play size={28} color={COLORS.bg} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlSmall}>
            <SkipForward size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlSmall}>
            <Repeat size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setLiked((l) => !l)}
          >
            <Heart
              size={20}
              color={liked ? COLORS.red : COLORS.text}
              fill={liked ? COLORS.red : "none"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Download size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <ListPlus size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {(["lyrics", "queue", "comments"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[styles.tabText, tab === t && styles.tabTextActive]}
              >
                {t === "lyrics" ? "Lyrics" : t === "queue" ? "Queue" : "Comments"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === "lyrics" && (
            <Text style={styles.tabContentText}>Lyrics</Text>
          )}
          {tab === "queue" && (
            <Text style={styles.tabContentText}>Queue ({queue.length} songs)</Text>
          )}
          {tab === "comments" && (
            <Text style={styles.tabContentText}>Comments</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9,9,11,0.7)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: (SCREEN_HEIGHT * 2) / 3,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  dragBar: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  dragPill: {
    padding: 4,
  },
  artworkLarge: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "90%",
  },
  artist: {
    color: COLORS.text,
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
    maxWidth: "90%",
  },
  seekSection: {
    width: "100%",
    marginTop: 20,
    marginBottom: 16,
  },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    justifyContent: "center",
  },
  seekFill: {
    width: "40%",
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  seekThumb: {
    position: "absolute",
    left: "40%",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    marginLeft: -6,
  },
  seekTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  seekTimeText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  controlSmall: {
    padding: 8,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  actionBtn: {
    padding: 8,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderRadius: 999,
    padding: 3,
    width: "100%",
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  tabPillActive: {
    backgroundColor: COLORS.gold,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: COLORS.bg,
  },
  tabContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContentText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
});
