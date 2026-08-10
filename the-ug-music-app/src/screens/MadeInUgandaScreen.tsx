import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/theme";

const CATEGORIES = [
  {
    id: "trending-kampala",
    title: "Trending in Kampala",
    emoji: "\uD83C\uDDFA\uD83C\uDDEC",
    description: "What's hot in the capital",
    colors: ["#EAB308", "#09090B"],
  },
  {
    id: "new-ugandan-artists",
    title: "New Ugandan Artists",
    emoji: "\uD83C\uDFA4",
    description: "Fresh talent from UG",
    colors: ["#10B981", "#09090B"],
  },
  {
    id: "viral-tiktok",
    title: "Viral on TikTok Uganda",
    emoji: "\uD83D\uDD25",
    description: "Trending on the app",
    colors: ["#EF4444", "#09090B"],
  },
  {
    id: "fresh-dancehall",
    title: "Fresh Dancehall",
    emoji: "\uD83C\uDFB6",
    description: "Latest dancehall bangers",
    colors: ["#F97316", "#09090B"],
  },
  {
    id: "lugaflow",
    title: "Lugaflow",
    emoji: "\uD83E\uDD41",
    description: "Ugandan hip hop flows",
    colors: ["#A855F7", "#09090B"],
  },
  {
    id: "gospel-hits",
    title: "Gospel Hits",
    emoji: "\uD83D\uDE4F",
    description: "Praise & worship anthems",
    colors: ["#3B82F6", "#09090B"],
  },
  {
    id: "party-mixes",
    title: "Party Mixes",
    emoji: "\uD83C\uDF89",
    description: "Turn up the vibes",
    colors: ["#EC4899", "#09090B"],
  },
  {
    id: "radio-charts",
    title: "Radio Charts",
    emoji: "\uD83D\uDCFB",
    description: "Top radio picks",
    colors: ["#6366F1", "#09090B"],
  },
  {
    id: "editors-picks",
    title: "Editor's Picks",
    emoji: "\u2B50",
    description: "Curated by our team",
    colors: ["#EAB308", "#09090B"],
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    emoji: "\uD83D\uDC8E",
    description: "Underrated treasures",
    colors: ["#14B8A6", "#09090B"],
  },
  {
    id: "morning-vibes",
    title: "Morning Vibes",
    emoji: "\uD83C\uDF05",
    description: "Start your day right",
    colors: ["#D97706", "#09090B"],
  },
  {
    id: "road-trip",
    title: "Road Trip",
    emoji: "\uD83D\uDE97",
    description: "Tunes for the journey",
    colors: ["#3B82F6", "#09090B"],
  },
];

function CategoryCard({
  item,
  onPress,
  index,
}: {
  item: (typeof CATEGORIES)[0];
  onPress: () => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).springify()}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardGradient}
        >
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MadeInUgandaScreen() {
  const navigation = useNavigation<any>();

  const handleCategoryPress = useCallback(
    (category: (typeof CATEGORIES)[0]) => {
      navigation.navigate("Search", { query: category.title });
    },
    [navigation]
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>{String.fromCodePoint(0x1F1FA, 0x1F1EC)}</Text>
          <Text style={styles.heroTitle}>Made in Uganda</Text>
          <Text style={styles.heroSubtitle}>
            Discover the best of Ugandan music
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {CATEGORIES.map((cat, index) => (
            <CategoryCard
              key={cat.id}
              item={cat}
              index={index}
              onPress={() => handleCategoryPress(cat)}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  cardWrapper: {
    width: "50%",
    padding: 6,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 20,
    minHeight: 150,
    justifyContent: "flex-end",
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
