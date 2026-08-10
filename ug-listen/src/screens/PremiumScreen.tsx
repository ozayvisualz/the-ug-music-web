import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Crown, Check } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";

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

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    setSubLoading(true);
    trpc.payments.checkSubscription
      .query()
      .then((data: Subscription | null) => {
        setSubscription(data);
        setActivePlan(data?.plan ?? null);
      })
      .catch(() => {
        setSubscription(null);
        setActivePlan(null);
      })
      .finally(() => setSubLoading(false));
  }, []);

  const handleSubscribe = useCallback(async (plan: Plan) => {
    if (subscribing) return;
    setSubscribing(plan.id);
    try {
      await trpc.payments.initiateSubscription.mutate({ plan: plan.id });
      Alert.alert(
        "Payment",
        "Redirecting to Flutterwave for payment. (Placeholder - integrate Flutterwave SDK here)",
        [{ text: "OK" }],
      );
    } catch {
      Alert.alert("Error", "Failed to initiate subscription. Please try again.");
    } finally {
      setSubscribing(null);
    }
  }, [subscribing]);

  if (subLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Crown size={22} color={COLORS.gold} />
            <Text style={styles.headerTitle}>Premium Plans</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.currentBadge}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <Text style={styles.currentPlan}>
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
                isActive && styles.planCardActive,
                plan.bestValue && styles.planCardBestValue,
              ]}
            >
              {plan.bestValue && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{formatUGX(plan.price)}</Text>
                <Text style={styles.planInterval}>{plan.interval}</Text>
              </View>
              {plan.savings != null && (
                <Text style={styles.savingsText}>Save {plan.savings}%</Text>
              )}
              {isActive ? (
                <View style={styles.activeBadge}>
                  <Check size={14} color={COLORS.green} />
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
          <Text style={styles.featuresTitle}>Premium Features</Text>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Check size={16} color={COLORS.green} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loader: {
    marginTop: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  currentBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  currentPlan: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
    top: -10,
    right: 16,
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  bestValueText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: "700",
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 6,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.gold,
  },
  planInterval: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  savingsText: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: "600",
    marginBottom: 12,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  activeText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "600",
  },
  subscribeBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 120,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  featuresSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 80,
  },
});
