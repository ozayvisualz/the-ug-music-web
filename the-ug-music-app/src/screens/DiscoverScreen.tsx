import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  Music2,
  Search,
  Play,
  TrendingUp,
  MicVocal,
  Sparkles,
  Disc,
  Music,
  ListMusic,
  Heart,
  Star,
  Flame,
  Zap,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";

const CARD_WIDTH = 140;

const GENRES = [
  { label: "Afrobeat", icon: Flame, color: "#EAB308" },
  { label: "Dancehall", icon: Music, color: "#F97316" },
  { label: "Reggae", icon: Disc, color: "#22C55E" },
  { label: "Gospel", icon: Heart, color: "#A855F7" },
  { label: "Hip Hop", icon: MicVocal, color: "#3B82F6" },
  { label: "Lugaflow", icon: Zap, color: "#EF4444" },
];

const BROWSE_ALL = [
  { label: "New Releases", icon: Sparkles, emoji: "\uD83C\uDD95" },
  { label: "Top Charts", icon: TrendingUp, emoji: "\uD83D\uDCC8" },
  { label: "Top Artists", icon: MicVocal, emoji: "\uD83C\uDFB5" },
  { label: "Made For You", icon: Heart, emoji: "\uD83D\uDC9D" },
];

const TRENDING_SEARCHES = [
  "\uD83C\uDDFA\uD83C\uDDEC Eddy Kenzo",
  "\uD83C\uDFB6 Sheebah Karungi",
  "\uD83D\uDD25 B2C Ent.",
  "\uD83E\uDD41 Fik Fameica",
  "\uD83C\uDFA4 Spice Diana",
  "\uD83C\uDFB5 Vinka",
  "\uD83C\uDFB9 Winnie Nwagi",
  "\uD83D\uDC83 David Lutalo",
  "\uD83C\uDFB8 John Blaq",
  "\uD83C\uDFA7 Azawi",
  "\uD83C\uDFB6 Rema Namakula",
  "\uD83C\uDFB9 Pallaso",
];

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SongCard({
  item,
  onPress,
  onPlay,
}: {
  item: { id: string; title: string; artist: string; coverUrl?: string };
  onPress: () => void;
  onPlay: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.songCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.songCardArt}>
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} style={styles.songCardImage} />
        ) : (
          <View style={styles.songCardPlaceholder}>
            <Music2 size={32} color={COLORS.textMuted} />
          </View>
        )}
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Play size={14} color="#000" fill="#000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.songCardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.songCardArtist} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();

  const newReleasesQuery = trpc.music?.getNewReleases?.useQuery
    ? trpc.music.getNewReleases.useQuery()
    : { data: [], isLoading: false };

  const trendingQuery = trpc.music?.getTrending?.useQuery
    ? trpc.music.getTrending.useQuery()
    : { data: [], isLoading: false };

  const handleSearchPress = useCallback(() => {
    navigation.navigate("Search");
  }, [navigation]);

  const handleTrendingSearch = useCallback(
    (query: string) => {
      navigation.navigate("Search", { query });
    },
    [navigation]
  );

  const handleSongPress = useCallback(
    (song: any) => {
      navigation.navigate("Song", { id: song.id });
    },
    [navigation]
  );

  const handleBrowsePress = useCallback(
    (item: (typeof BROWSE_ALL)[0]) => {
      if (item.label === "New Releases") {
        navigation.navigate("Discover");
      } else if (item.label === "Top Charts") {
        navigation.navigate("Discover");
      } else if (item.label === "Top Artists") {
        navigation.navigate("Discover");
      } else if (item.label === "Made For You") {
        navigation.navigate("Discover");
      }
    },
    [navigation]
  );

  const renderSongItem = useCallback(
    ({ item }: { item: any }) => (
      <SongCard
        item={item}
        onPress={() => handleSongPress(item)}
        onPlay={() => {}}
      />
    ),
    [handleSongPress]
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.searchBarContainer}
        >
          <TouchableOpacity
            style={styles.searchBar}
            onPress={handleSearchPress}
            activeOpacity={0.7}
          >
            <Search size={18} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>
              What do you want to listen to?
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.section}>
          <SectionHeader title="Trending Searches" />
          <View style={styles.chipsContainer}>
            {TRENDING_SEARCHES.map((query, index) => (
              <TouchableOpacity
                key={query}
                style={styles.chip}
                onPress={() => handleTrendingSearch(query)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{query}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular Genres" />
          <View style={styles.genreGrid}>
            {GENRES.map((genre, index) => {
              const Icon = genre.icon;
              return (
                <Animated.View
                  key={genre.label}
                  entering={FadeInRight.delay(index * 70).springify()}
                  style={styles.genreCardWrapper}
                >
                  <TouchableOpacity
                    style={styles.genreCard}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.genreIconContainer,
                        { backgroundColor: genre.color + "20" },
                      ]}
                    >
                      <Icon size={24} color={genre.color} />
                    </View>
                    <Text style={styles.genreLabel}>{genre.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Browse All" />
          <View style={styles.browseGrid}>
            {BROWSE_ALL.map((item, index) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={item.label}
                  entering={FadeInRight.delay(index * 80).springify()}
                  style={styles.browseCardWrapper}
                >
                  <TouchableOpacity
                    style={styles.browseCard}
                    onPress={() => handleBrowsePress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.browseEmoji}>{item.emoji}</Text>
                    <View style={styles.browseCardContent}>
                      <Text style={styles.browseLabel}>{item.label}</Text>
                      <Icon size={16} color={COLORS.gold} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="New Releases" />
          {newReleasesQuery.isLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : (newReleasesQuery.data as any[])?.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={newReleasesQuery.data as any[]}
              keyExtractor={(item: any) => item.id}
              renderItem={renderSongItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="This Week's Best" />
          {trendingQuery.isLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : (trendingQuery.data as any[])?.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={trendingQuery.data as any[]}
              keyExtractor={(item: any) => item.id}
              renderItem={renderSongItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A1A1AA",
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gold,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  genreCardWrapper: {
    width: "33.33%",
    padding: 4,
  },
  genreCard: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  genreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  genreLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },
  browseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  browseCardWrapper: {
    width: "50%",
    padding: 4,
  },
  browseCard: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    minHeight: 80,
    justifyContent: "space-between",
  },
  browseEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  browseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  browseLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  songCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  songCardArt: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    position: "relative",
  },
  songCardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  songCardPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
  playButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  songCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  songCardArtist: {
    fontSize: 11,
    color: COLORS.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  loader: {
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
