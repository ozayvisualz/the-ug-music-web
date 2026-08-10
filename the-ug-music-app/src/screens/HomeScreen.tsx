import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  Music2,
  Search,
  Play,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useQueueStore, type Track } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 140;
const ARTIST_CARD_SIZE = 110;

const CATEGORIES = [
  { label: "Trending in Kampala", emoji: "\uD83C\uDDFA\uD83C\uDDEC" },
  { label: "New Ugandan Artists", emoji: "\uD83C\uDFA4" },
  { label: "Viral on TikTok Uganda", emoji: "\uD83D\uDD25" },
  { label: "Fresh Dancehall", emoji: "\uD83C\uDFB6" },
  { label: "Lugaflow", emoji: "\uD83E\uDD41" },
  { label: "Gospel Hits", emoji: "\uD83D\uDE4F" },
  { label: "Party Mixes", emoji: "\uD83C\uDF89" },
  { label: "Radio Charts", emoji: "\uD83D\uDCFB" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={14} color={COLORS.gold} />
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
      style={styles.categoryCardWrapper}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryEmoji}>{item.emoji}</Text>
        <Text style={styles.categoryLabel} numberOfLines={2}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);

  const greeting = useMemo(() => getGreeting(), []);

  const continueQuery = trpc.sync?.getContinueListening?.useQuery
    ? trpc.sync.getContinueListening.useQuery(undefined, { enabled: !!user })
    : { data: [], isLoading: false };

  const trendingQuery = trpc.music?.getTrending?.useQuery
    ? trpc.music.getTrending.useQuery()
    : { data: [], isLoading: false };

  const newReleasesQuery = trpc.music?.getNewReleases?.useQuery
    ? trpc.music.getNewReleases.useQuery()
    : { data: [], isLoading: false };

  const artistsQuery = trpc.music?.getArtists?.useQuery
    ? trpc.music.getArtists.useQuery()
    : { data: [], isLoading: false };

  const handleSongPress = useCallback(
    (song: any) => {
      navigation.navigate("Song", { id: song.id });
    },
    [navigation]
  );

  const handlePlaySong = useCallback(
    (song: any) => {
      const track: Track = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        url: song.url ?? song.audioUrl ?? "",
        duration: song.duration ?? 0,
        coverUrl: song.coverUrl ?? undefined,
      };
      setQueue([track]);
    },
    [setQueue]
  );

  const handleArtistPress = useCallback(
    (artist: any) => {
      navigation.navigate("Artist", { id: artist.id });
    },
    [navigation]
  );

  const handleCategoryPress = useCallback(
    (category: (typeof CATEGORIES)[0]) => {
      navigation.navigate("MadeInUganda", { category: category.label });
    },
    [navigation]
  );

  const handleSearchPress = useCallback(() => {
    navigation.navigate("Search");
  }, [navigation]);

  const handleSeeAll = useCallback(
    (route: string, params?: any) => {
      navigation.navigate(route, params);
    },
    [navigation]
  );

  const renderSongItem = useCallback(
    ({ item }: { item: any }) => (
      <SongCard
        item={item}
        onPress={() => handleSongPress(item)}
        onPlay={() => handlePlaySong(item)}
      />
    ),
    [handleSongPress, handlePlaySong]
  );

  const renderArtistItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.artistCard}
        onPress={() => handleArtistPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.artistAvatar}
          />
        ) : (
          <View style={[styles.artistAvatar, styles.artistPlaceholder]}>
            <Music2 size={28} color={COLORS.textMuted} />
          </View>
        )}
        <Text style={styles.artistName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.artistSub} numberOfLines={1}>
          Artist
        </Text>
      </TouchableOpacity>
    ),
    [handleArtistPress]
  );

  const renderContinueItem = useCallback(
    ({ item }: { item: any }) => (
      <SongCard
        item={item}
        onPress={() => handleSongPress(item)}
        onPlay={() => handlePlaySong(item)}
      />
    ),
    [handleSongPress, handlePlaySong]
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <View style={styles.headerLeft}>
          <Music2 size={22} color={COLORS.gold} />
          <Text style={styles.headerTitle}>TheUgMusic</Text>
        </View>
        <TouchableOpacity
          onPress={handleSearchPress}
          style={styles.searchButton}
        >
          <Search size={20} color={COLORS.text} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.greetingSection}
        >
          <Text style={styles.greeting}>
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </Text>
          <Sparkles size={16} color={COLORS.gold} />
        </Animated.View>

        {user && continueQuery.data && (continueQuery.data as any[]).length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Continue Listening"
              onSeeAll={() => handleSeeAll("Library")}
            />
            {continueQuery.isLoading ? (
              <ActivityIndicator
                color={COLORS.gold}
                style={styles.loader}
              />
            ) : (
              <FlatList
                data={continueQuery.data as any[]}
                keyExtractor={(item: any) => item.id}
                renderItem={renderContinueItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            title="Trending Now"
            onSeeAll={() =>
              navigation.navigate("DiscoverTab", {
                screen: "Discover",
              })
            }
          />
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

        <View style={styles.section}>
          <SectionHeader
            title="New Releases"
            onSeeAll={() => handleSeeAll("DiscoverTab", { screen: "Discover" })}
          />
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
          <SectionHeader title="Made in Uganda" />
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat, index) => (
              <CategoryCard
                key={cat.label}
                item={cat}
                index={index}
                onPress={() => handleCategoryPress(cat)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Top Artists"
            onSeeAll={() => handleSeeAll("DiscoverTab", { screen: "Discover" })}
          />
          {artistsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : (artistsQuery.data as any[])?.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={artistsQuery.data as any[]}
              keyExtractor={(item: any) => item.id}
              renderItem={renderArtistItem}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.gold,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  greetingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
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
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gold,
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  categoryCardWrapper: {
    width: "25%",
    padding: 4,
  },
  categoryCard: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 14,
  },
  artistCard: {
    width: ARTIST_CARD_SIZE,
    alignItems: "center",
  },
  artistAvatar: {
    width: ARTIST_CARD_SIZE,
    height: ARTIST_CARD_SIZE,
    borderRadius: ARTIST_CARD_SIZE / 2,
  },
  artistPlaceholder: {
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  artistName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginTop: 8,
    width: ARTIST_CARD_SIZE,
  },
  artistSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
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
