import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Crown, Check } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";

const SW = Dimensions.get("window").width;

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: string;
  savings?: number;
  bestValue?: boolean;
};

type Subscription = {
  plan: string;
  status: string;
  expiresAt?: string;
};

const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 10000,
    interval: "/mo",
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: 25000,
    interval: "/3mo",
    savings: 17,
    bestValue: true,
  },
  {
    id: "annual",
    name: "Annual",
    price: 80000,
    interval: "/yr",
    savings: 33,
  },
];

const FEATURES = [
  "Ad-free Listening",
  "HD Audio",
  "Offline Downloads",
  "Premium Radio",
  "Exclusive Content",
];

function formatUGX(amount: number): string {
  return amount.toLocaleString("en-UG") + " UGX";
}

export default function PremiumScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    setSubLoading(true);
    (async () => {
      const token = await getStoredToken();
      const url = token ? `https://www.theugmusic.com/api/mobile/premium?token=${encodeURIComponent(token)}` : "https://www.theugmusic.com/api/mobile/premium";
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.subscription) {
            setSubscription(data.subscription);
            setActivePlan(data.subscription.plan);
          } else {
            setSubscription(null);
            setActivePlan(null);
          }
        })
        .catch(() => { setSubscription(null); setActivePlan(null); })
        .finally(() => setSubLoading(false));
    })();
  }, []);

  const handleSubscribe = useCallback(async (plan: Plan) => {
    if (subscribing) return;
    setSubscribing(plan.id);
    try {
      const token = await getStoredToken();
      const planId = plan.id.toUpperCase();
      const url = `https://www.theugmusic.com/api/mobile/premium?action=subscribe&plan=${planId}&token=${encodeURIComponent(token || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      Alert.alert(
        "Payment",
        `Redirecting to Flutterwave to complete your ${plan.name} subscription (UGX ${plan.price}).`,
        [{ text: "OK" }],
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to initiate subscription. Please try again.");
    } finally {
      setSubscribing(null);
    }
  }, [subscribing]);

  if (subLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

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
          <View style={styles.headerTitleRow}>
            <Crown size={20} color={COLORS.gold} />
            <Text style={styles.headerTitle}>Premium Plans</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.currentBadge, { backgroundColor: colors.surface }]}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <Text style={[styles.currentPlan, { color: colors.white }]}>
            {subscription ? `${subscription.plan} (${subscription.status})` : "Free Plan"}
          </Text>
        </View>

        {PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          const isSubscribing = subscribing === plan.id;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: colors.surface },
                isActive && styles.planCardActive,
                plan.bestValue && styles.planCardBestValue,
              ]}
            >
              {plan.bestValue && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <Text style={[styles.planName, { color: colors.white }]}>{plan.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{formatUGX(plan.price)}</Text>
                <Text style={styles.planInterval}>{plan.interval}</Text>
              </View>
              {plan.savings != null && (
                <Text style={styles.savingsText}>Save {plan.savings}%</Text>
              )}
              {isActive ? (
                <View style={[styles.activeBadge, { backgroundColor: colors.surface }]}>
                  <Check size={12} color={COLORS.green} />
                  <Text style={styles.activeText}>Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.subscribeBtn,
                    isSubscribing && styles.subscribeBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSubscribe(plan)}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <ActivityIndicator size="small" color={COLORS.bg} />
                  ) : (
                    <Text style={styles.subscribeBtnText}>Subscribe</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: colors.white }]}>Premium Features</Text>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Check size={14} color={COLORS.green} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
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
  loader: {
    marginTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
  },
  currentBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  currentPlan: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  planCardActive: {
    borderColor: COLORS.gold,
  },
  planCardBestValue: {
    borderColor: COLORS.green,
  },
  bestValueBadge: {
    position: "absolute",
    top: -9,
    right: 14,
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  bestValueText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: "700",
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginBottom: 3,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gold,
  },
  planInterval: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  savingsText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: "600",
    marginBottom: 10,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  activeText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "600",
  },
  subscribeBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 110,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: "700",
  },
  featuresSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 13,
  },
  bottomSpacer: {
    height: 70,
  },
});
