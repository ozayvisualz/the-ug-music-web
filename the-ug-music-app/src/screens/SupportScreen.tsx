import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import {
  MessageCircle,
  Send,
  ChevronDown,
  Clock,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

const CATEGORY_OPTIONS = [
  "General",
  "Payment",
  "Technical",
  "Content",
  "Account",
] as const;

type TicketCategory = (typeof CATEGORY_OPTIONS)[number];

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.gold,
  "in-progress": COLORS.blue,
  resolved: COLORS.green,
  closed: COLORS.textMuted,
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function TicketItem({
  ticket,
  index,
  onPress,
}: {
  ticket: any;
  index: number;
  onPress: () => void;
}) {
  const statusColor = STATUS_COLORS[ticket.status] ?? COLORS.textMuted;
  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status;

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(ticket.createdAt);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const day = d.getDate();
      const mon = months[d.getMonth()];
      const year = d.getFullYear();
      return `${mon} ${String(day).padStart(2, "0")}, ${year}`;
    } catch {
      return ticket.createdAt ?? "";
    }
  }, [ticket.createdAt]);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify()}
    >
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.ticketTop}>
          <Text style={styles.ticketSubject} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <View
            style={[
              styles.ticketStatusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <View
              style={[styles.ticketStatusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.ticketStatusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        <View style={styles.ticketBottom}>
          <Text style={styles.ticketCategory}>
            {ticket.category ?? "General"}
          </Text>
          <Text style={styles.ticketDate}>{formattedDate}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SupportScreen() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("General");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const ticketsQuery = trpc.business?.getTickets?.useQuery
    ? trpc.business.getTickets.useQuery(
        { userId },
        { enabled: !!userId }
      )
    : { data: [], isLoading: false, error: null };

  const tickets: any[] = useMemo(
    () => (ticketsQuery.data as any[]) ?? [],
    [ticketsQuery.data]
  );

  const handleSubmit = useCallback(async () => {
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      Alert.alert("Validation", "Please enter a subject for your ticket.");
      return;
    }

    try {
      setSubmitError(null);
      setSubmitSuccess(false);
      setIsSubmitting(true);

      await trpc.business.createTicket.mutate({
        userId,
        subject: trimmedSubject,
        category,
      });

      setSubmitSuccess(true);
      setSubject("");
      setCategory("General");
      ticketsQuery.refetch?.();

      Alert.alert(
        "Ticket Submitted",
        "Your support ticket has been created. Our team will get back to you soon.",
        [{ text: "OK" }]
      );
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to submit ticket");
      Alert.alert("Error", err?.message ?? "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  }, [subject, category, userId, ticketsQuery]);

  const handleTicketPress = useCallback((ticketId: string) => {
    setSelectedTicket((prev) => (prev === ticketId ? null : ticketId));
  }, []);

  const selectedTicketData = useMemo(() => {
    if (!selectedTicket) return null;
    return tickets.find((t: any) => t.id === selectedTicket) ?? null;
  }, [selectedTicket, tickets]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.contactCard}
        >
          <View style={styles.contactTop}>
            <View style={styles.contactIcon}>
              <MessageCircle size={24} color={COLORS.gold} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Contact Support</Text>
              <Text style={styles.contactSubtitle}>
                Need help? Create a ticket and we'll respond within 24 hours.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={styles.formSection}
        >
          <Text style={styles.formTitle}>Create New Ticket</Text>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Describe your issue..."
              placeholderTextColor={COLORS.textMuted}
              maxLength={200}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.categorySelectorText}>{category}</Text>
              <ChevronDown
                size={16}
                color={COLORS.textMuted}
                style={{
                  transform: [
                    { rotate: showCategoryPicker ? "180deg" : "0deg" },
                  ],
                }}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryDropdown}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.categoryOption,
                      category === opt && styles.categoryOptionActive,
                    ]}
                    onPress={() => {
                      setCategory(opt);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === opt && styles.categoryOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {submitError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          )}

          {submitSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>
                Ticket submitted successfully!
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!subject.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Send size={16} color="#000" />
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).springify()}
          style={styles.ticketsSection}
        >
          <Text style={styles.ticketsSectionTitle}>Your Tickets</Text>

          {ticketsQuery.isLoading ? (
            <ActivityIndicator
              color={COLORS.gold}
              style={styles.ticketsLoader}
            />
          ) : ticketsQuery.error ? (
            <Text style={styles.emptyText}>
              Failed to load tickets. Pull to refresh.
            </Text>
          ) : tickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No tickets yet</Text>
              <Text style={styles.emptySubtitle}>
                Your submitted support tickets will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {tickets.map((ticket: any, index: number) => (
                <TicketItem
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onPress={() => handleTicketPress(ticket.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {selectedTicketData && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.ticketDetail}
          >
            <Text style={styles.detailTitle}>Ticket Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subject</Text>
              <Text style={styles.detailValue}>
                {selectedTicketData.subject}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>
                {selectedTicketData.category ?? "General"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View
                style={[
                  styles.ticketStatusBadge,
                  {
                    backgroundColor:
                      (STATUS_COLORS[selectedTicketData.status] ?? COLORS.textMuted) + "20",
                  },
                ]}
              >
                <View
                  style={[
                    styles.ticketStatusDot,
                    {
                      backgroundColor:
                        STATUS_COLORS[selectedTicketData.status] ?? COLORS.textMuted,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.ticketStatusText,
                    {
                      color:
                        STATUS_COLORS[selectedTicketData.status] ?? COLORS.textMuted,
                    },
                  ]}
                >
                  {STATUS_LABELS[selectedTicketData.status] ??
                    selectedTicketData.status}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {selectedTicketData.createdAt
                  ? new Date(selectedTicketData.createdAt).toLocaleDateString()
                  : ""}
              </Text>
            </View>
          </Animated.View>
        )}

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
  contactCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  contactSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  formSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categorySelector: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categorySelectorText: {
    fontSize: 15,
    color: COLORS.white,
  },
  categoryDropdown: {
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.goldMuted,
  },
  categoryOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryOptionTextActive: {
    color: COLORS.gold,
    fontWeight: "600",
  },
  errorBanner: {
    padding: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.red,
    textAlign: "center",
  },
  successBanner: {
    padding: 12,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 13,
    color: COLORS.green,
    textAlign: "center",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  ticketsSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  ticketsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 16,
  },
  ticketsLoader: {
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingVertical: 20,
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  ticketsList: {
    gap: 10,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
    marginRight: 12,
  },
  ticketStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  ticketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  ticketBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  ticketDetail: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gold,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  bottomSpacer: {
    height: 40,
  },
});
