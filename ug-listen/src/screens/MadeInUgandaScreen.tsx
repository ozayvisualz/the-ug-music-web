import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SW = SCREEN_WIDTH;

const CATEGORIES = [
  {
    emoji: "\uD83C\uDDFA\uD83C\uDDEC",
    title: "Trending in Kampala",
    description: "What's hot in the capital",
  },
  {
    emoji: "\uD83C\uDFA4",
    title: "New Ugandan Artists",
    description: "Fresh talent from Uganda",
  },
  {
    emoji: "\uD83D\uDD25",
    title: "Viral TikTok Uganda",
    description: "Songs blowing up on TikTok",
  },
  {
    emoji: "\uD83C\uDFB6",
    title: "Fresh Dancehall",
    description: "Latest dancehall bangers",
  },
  {
    emoji: "\uD83E\uDD41",
    title: "Lugaflow",
    description: "Ugandan hip hop and rap",
  },
  {
    emoji: "\uD83D\uDE4F",
    title: "Gospel Hits",
    description: "Praise and worship music",
  },
  {
    emoji: "\uD83C\uDF89",
    title: "Party Mixes",
    description: "Turn up the vibes",
  },
  {
    emoji: "\uD83D\uDCFB",
    title: "Radio Charts",
    description: "Top tracks on Ugandan radio",
  },
  {
    emoji: "\u2B50",
    title: "Editor's Picks",
    description: "Curated by our team",
  },
  {
    emoji: "\uD83D\uDC8E",
    title: "Hidden Gems",
    description: "Underrated masterpieces",
  },
  {
    emoji: "\uD83C\uDF05",
    title: "Morning Vibes",
    description: "Start your day right",
  },
  {
    emoji: "\uD83D\uDE97",
    title: "Road Trip",
    description: "Music for the journey",
  },
];

export default function MadeInUgandaScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const handleCategoryPress = useCallback(
    (title: string) => {
      navigation.navigate("CategoryPlaylist", { category: title });
    },
    [navigation],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.white }]}>
            Made in Uganda{" "}
            <Text style={styles.flag}>{"\uD83C\uDDFA\uD83C\uDDEC"}</Text>
          </Text>
          <Text style={styles.subtitle}>
            Discover the best of Ugandan music
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.title}
              style={[styles.card, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(cat.title)}
            >
              <Text style={styles.cardEmoji}>{cat.emoji}</Text>
              <Text style={[styles.cardTitle, { color: colors.white }]} numberOfLines={2}>
                {cat.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {cat.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  flag: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: (SW - 2 * Math.min(SW * 0.04, 16) - 8) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    minWidth: 0,
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
  },
  bottomSpacer: {
    height: 70,
  },
});
