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
              <ChevronUp size={16} color={COLORS.textMuted} />
            ) : (
              <ChevronDown size={16} color={COLORS.textMuted} />
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
          <ArrowLeft size={22} color={COLORS.white} />
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
                <HelpCircle size={20} color={COLORS.bg} />
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
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
    paddingBottom: 70,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextWrap: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 1,
  },
  contactSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  formSection: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
  },
  subjectInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 13,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  categoryPill: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  categoryPillText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "500",
  },
  categoryPillTextActive: {
    color: COLORS.gold,
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  ticketsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
  },
  ticketsLoader: {
    marginVertical: 16,
  },
  noTickets: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ticketInfo: {
    flex: 1,
    marginRight: 6,
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 6,
  },
  ticketMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  ticketDate: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  ticketDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  ticketDetailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 1,
    marginTop: 6,
  },
  ticketDetailValue: {
    fontSize: 12,
    color: COLORS.text,
  },
});
