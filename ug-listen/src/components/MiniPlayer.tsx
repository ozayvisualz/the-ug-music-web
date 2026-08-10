import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Music2, Play, Pause, X } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";

type Props = {
  onExpand?: () => void;
};

export default function MiniPlayer({ onExpand }: Props) {
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const clear = useQueueStore((s) => s.clear);
  const [playing, setPlaying] = useState(true);

  if (currentIndex < 0 || !queue[currentIndex]) return null;

  const track = queue[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      <View style={styles.row}>
        <View style={styles.artwork}>
          <Music2 size={20} color={COLORS.bg} />
        </View>

        <TouchableOpacity
          style={styles.textArea}
          onPress={onExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.control}
          onPress={() => setPlaying((p) => !p)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {playing ? (
            <Pause size={22} color={COLORS.white} />
          ) : (
            <Play size={22} color={COLORS.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.control}
          onPress={clear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressTrack: {
    height: 2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    width: "30%",
    height: 2,
    backgroundColor: COLORS.gold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  artist: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  control: {
    padding: 6,
  },
});
