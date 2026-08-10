import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useAuthStore } from "../store/authStore";

const CATEGORIES = ["General", "Payment", "Technical", "Content", "Account"] as const;
type Category = (typeof CATEGORIES)[number];

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  description?: string;
  createdAt: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case "open":
      return { bg: COLORS.goldMuted, color: COLORS.gold };
    case "in-progress":
      return { bg: "rgba(59,130,246,0.15)", color: COLORS.blue };
    case "resolved":
      return { bg: "rgba(16,185,129,0.15)", color: COLORS.green };
    case "closed":
      return { bg: COLORS.surface, color: COLORS.textMuted };
    default:
      return { bg: COLORS.surface, color: COLORS.textMuted };
  }
}

function capitalizeStatus(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SupportScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("General");
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    setTicketsLoading(true);
    trpc.business.getTickets
      .query()
      .then((data: Ticket[]) => setTickets(data))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a subject.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to submit a ticket.");
      return;
    }
    setSubmitting(true);
    try {
      await trpc.business.createTicket.mutate({
        userId: user.id,
        subject: trimmed,
        category,
      });
      Alert.alert("Success", "Your ticket has been submitted.");
      setSubject("");
      setCategory("General");
      const updated = await trpc.business.getTickets.query();
      setTickets(updated as Ticket[]);
    } catch {
      Alert.alert("Error", "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [subject, category, user]);

  const renderTicket = useCallback(
    ({ item }: { item: Ticket }) => {
      const isExpanded = expandedTicket === item.id;
      const statusStyle = statusBadgeStyle(item.status);

      return (
        <TouchableOpacity
          style={styles.ticketCard}
          activeOpacity={0.7}
          onPress={() =>
            setExpandedTicket(isExpanded ? null : item.id)
          }
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketSubject} numberOfLines={2}>
                {item.subject}
              </Text>
              <View style={styles.ticketMetaRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {capitalizeStatus(item.status)}
                  </Text>
                </View>
                <Text style={styles.ticketDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
            {isExpanded ? (
              <ChevronUp size={18} color={COLORS.textMuted} />
            ) : (
              <ChevronDown size={18} color={COLORS.textMuted} />
            )}
          </View>
          {isExpanded && (
            <View style={styles.ticketDetails}>
              <Text style={styles.ticketDetailLabel}>Category</Text>
              <Text style={styles.ticketDetailValue}>{item.category}</Text>
              {item.description ? (
                <>
                  <Text style={styles.ticketDetailLabel}>Description</Text>
                  <Text style={styles.ticketDetailValue}>
                    {item.description}
                  </Text>
                </>
              ) : null}
              <Text style={styles.ticketDetailLabel}>Status</Text>
              <Text style={styles.ticketDetailValue}>
                {capitalizeStatus(item.status)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [expandedTicket],
  );

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
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.contactCard}>
              <View style={styles.contactIconWrap}>
                <HelpCircle size={22} color={COLORS.bg} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactTitle}>Contact Support</Text>
                <Text style={styles.contactSub}>
                  Need help? Contact our team
                </Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Create Ticket</Text>

              <TextInput
                style={styles.subjectInput}
                placeholder="Subject"
                placeholderTextColor={COLORS.textMuted}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="done"
              />

              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      category === cat && styles.categoryPillActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        category === cat && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!subject.trim() || submitting) && styles.submitBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={!subject.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.bg} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.ticketsSectionTitle}>Your Tickets</Text>

            {ticketsLoading && (
              <ActivityIndicator
                color={COLORS.gold}
                style={styles.ticketsLoader}
              />
            )}

            {!ticketsLoading && tickets.length === 0 && (
              <Text style={styles.noTickets}>No tickets yet</Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextWrap: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  formSection: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
  },
  subjectInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  categoryPillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },
  categoryPillTextActive: {
    color: COLORS.gold,
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "700",
  },
  ticketsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
  },
  ticketsLoader: {
    marginVertical: 20,
  },
  noTickets: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ticketInfo: {
    flex: 1,
    marginRight: 8,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 8,
  },
  ticketMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ticketDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  ticketDetails: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  ticketDetailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 2,
    marginTop: 8,
  },
  ticketDetailValue: {
    fontSize: 13,
    color: COLORS.text,
  },
});
