import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import {
  Crown,
  Check,
  ShieldCheck,
  Headphones,
  Download,
  Radio,
  Star,
  Zap,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";

const PREMIUM_FEATURES = [
  { label: "Ad-free listening", icon: ShieldCheck },
  { label: "HD Audio quality", icon: Headphones },
  { label: "Offline Downloads", icon: Download },
  { label: "Premium Radio", icon: Radio },
  { label: "Exclusive Content", icon: Star },
];

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "10,000",
    period: "/month",
    billing: "Billed monthly",
    features: [
      "Ad-free listening",
      "HD Audio quality",
      "Unlimited downloads",
      "Premium radio access",
    ],
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: "25,000",
    period: "/3 months",
    billing: "Billed quarterly",
    savePercent: "17%",
    recommended: true,
    features: [
      "All Monthly features",
      "Save 17% vs monthly",
      "Priority support",
      "Early access to new content",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    price: "80,000",
    period: "/year",
    billing: "Billed annually",
    savePercent: "33%",
    features: [
      "All Quarterly features",
      "Save 33% vs monthly",
      "Exclusive artist meetups",
      "Merch discounts",
    ],
  },
];

function FeatureItem({
  label,
  icon: Icon,
  checked,
}: {
  label: string;
  icon: React.ComponentType<any>;
  checked: boolean;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, checked && styles.featureIconChecked]}>
        <Icon size={16} color={checked ? COLORS.gold : COLORS.textMuted} />
      </View>
      <Text style={[styles.featureLabel, checked && styles.featureLabelChecked]}>
        {label}
      </Text>
    </View>
  );
}

function PlanCard({
  plan,
  index,
  currentPlanId,
  selectedPlanId,
  isSubscribing,
  onSelect,
  checkFeature,
}: {
  plan: (typeof PLANS)[0];
  index: number;
  currentPlanId: string | null;
  selectedPlanId: string | null;
  isSubscribing: boolean;
  onSelect: () => void;
  checkFeature: (feature: string) => boolean;
}) {
  const isCurrent = currentPlanId === plan.id;
  const isSelected = selectedPlanId === plan.id;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={[styles.planCard, isCurrent && styles.planCardCurrent]}
    >
      {plan.recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}
      {plan.savePercent && (
        <View style={styles.saveBadge}>
          <Text style={styles.saveText}>Save {plan.savePercent}</Text>
        </View>
      )}

      <Text style={styles.planName}>{plan.name}</Text>

      <View style={styles.planPriceRow}>
        <Text style={styles.planPrice}>UGX {plan.price}</Text>
        <Text style={styles.planPeriod}>{plan.period}</Text>
      </View>

      <Text style={styles.planBilling}>{plan.billing}</Text>

      <View style={styles.planFeaturesList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.planFeatureRow}>
            <Check size={14} color={COLORS.gold} />
            <Text style={styles.planFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {isCurrent ? (
        <View style={styles.currentPlanButton}>
          <Crown size={16} color={COLORS.gold} />
          <Text style={styles.currentPlanText}>Current Plan</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.subscribeButton, isSelected && styles.subscribeButtonActive]}
          onPress={onSelect}
          disabled={isSubscribing}
          activeOpacity={0.8}
        >
          {isSubscribing && isSelected ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {isSelected ? "Processing..." : "Subscribe"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function PremiumScreen() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const subscriptionQuery = trpc.payments?.checkSubscription?.useQuery
    ? trpc.payments.checkSubscription.useQuery()
    : { data: null, isLoading: false, error: null };

  const currentPlan = (subscriptionQuery.data as any)?.plan ?? null;
  const currentPlanId = currentPlan?.id ?? "free";
  const currentPlanName = currentPlan?.name ?? "Free Plan";

  const handleSubscribe = useCallback(
    async (plan: (typeof PLANS)[0]) => {
      try {
        setSubscribeError(null);
        setSelectedPlanId(plan.id);
        setIsSubscribing(true);
        await trpc.payments.initiateSubscription.mutate({ plan: plan.id });
        Alert.alert(
          "Payment Processing",
          "Payment processing coming soon. You will be redirected to Flutterwave to complete your subscription.",
          [{ text: "OK" }]
        );
      } catch (err: any) {
        setSubscribeError(err?.message ?? "Failed to initiate subscription");
        Alert.alert(
          "Error",
          err?.message ?? "Failed to initiate subscription"
        );
      } finally {
        setIsSubscribing(false);
        setSelectedPlanId(null);
      }
    },
    []
  );

  const checkFeature = useCallback(
    (feature: string) => {
      return true;
    },
    []
  );

  if (subscriptionQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Premium Plans</Text>
        </Animated.View>
        <View style={styles.centerLoader}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      </View>
    );
  }

  if (subscriptionQuery.error && !subscriptionQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Crown size={28} color={COLORS.gold} />
          <Text style={styles.headerTitle}>Premium Plans</Text>
        </Animated.View>
        <View style={styles.centerLoader}>
          <Text style={styles.errorText}>
            Failed to load subscription info. Pull to refresh.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <View style={styles.headerIconRow}>
          <Crown size={28} color={COLORS.gold} />
        </View>
        <Text style={styles.headerTitle}>Premium Plans</Text>
        <Text style={styles.headerSubtitle}>
          Unlock the full Ugandan music experience with ad-free listening, HD
          audio, offline downloads, and more.
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.currentPlanBar}
        >
          <View style={styles.currentPlanBarLeft}>
            <Crown size={16} color={COLORS.gold} />
            <Text style={styles.currentPlanBarLabel}>Current Plan:</Text>
          </View>
          <Text style={styles.currentPlanBarValue}>{currentPlanName}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={styles.featuresSection}
        >
          <Text style={styles.featuresTitle}>Premium Features</Text>
          <Text style={styles.featuresSubtitle}>
            Everything you get with any premium plan
          </Text>
          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <View key={feature.label} style={styles.featureCard}>
                  <Icon size={24} color={COLORS.gold} />
                  <Text style={styles.featureCardLabel}>{feature.label}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {subscribeError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{subscribeError}</Text>
          </View>
        )}

        <View style={styles.plansSection}>
          {PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              currentPlanId={currentPlanId}
              selectedPlanId={selectedPlanId}
              isSubscribing={isSubscribing}
              onSelect={() => handleSubscribe(plan)}
              checkFeature={checkFeature}
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
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 6,
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  currentPlanBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.goldMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  currentPlanBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentPlanBarLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gold,
  },
  currentPlanBarValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gold,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  featuresSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureCardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconChecked: {
    backgroundColor: COLORS.goldMuted,
  },
  featureLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  featureLabelChecked: {
    color: COLORS.text,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.red,
    textAlign: "center",
  },
  plansSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 16,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planCardCurrent: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.5,
  },
  saveBadge: {
    position: "absolute",
    top: 12,
    right: 16,
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  saveText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.green,
  },
  planName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gold,
  },
  planPeriod: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  planBilling: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  planFeaturesList: {
    marginBottom: 16,
  },
  planFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 13,
    color: COLORS.text,
  },
  currentPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gold,
  },
  subscribeButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeButtonActive: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  bottomSpacer: {
    height: 40,
  },
});
