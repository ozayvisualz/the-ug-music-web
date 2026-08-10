import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Music2, Play, Pause, X } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { useQueueStore } from "../store/playerStore";
import { COLORS } from "../constants/theme";

interface MiniPlayerProps {
  onExpand?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { queue, currentIndex, clear } = useQueueStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleClose = useCallback(() => {
    clear();
  }, [clear]);

  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onExpand}
      style={styles.container}
    >
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "30%" }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.artwork}>
          <Music2 size={20} color={COLORS.textMuted} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity
          onPress={togglePlay}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.playButton}
        >
          {isPlaying ? (
            <Pause size={22} color={COLORS.white} />
          ) : (
            <Play size={22} color={COLORS.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <X size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.gold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  artist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  playButton: {
    padding: 6,
  },
  closeButton: {
    padding: 6,
    marginLeft: 4,
  },
});
