/* eslint-disable */
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  DimensionValue
} from "react-native";
import { Calendar, MapPin, X } from "lucide-react-native";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "../common/BookingUtils";
import PaymentInstance from "../services/paymentInstance";
import dayjs from "dayjs";

interface Booking {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: string;
  amount: string;
  bookingData: any;
  responsibilities?: {
    tasks?: any[];
    add_ons?: any[];
  };
  booking_type?: string;
  taskStatus?: string;
  engagement_id?: string;
  noOfPersons?: number;
  serviceProviderId?: number;
  customerId?: number;
  start_date?: string;
  endDate?: string;
  engagements?: string;
  timeslot?: string;
  monthlyAmount?: number;
  paymentMode?: string;
  service_type?: string;
  bookingDate?: string;
  housekeepingRole?: any;
  mealType?: any;
  experience?: any;
  childAge?: any;
  customerName?: string;
  serviceProviderName?: string;
  address?: any;
  modifiedBy?: string;
  modifiedDate?: string;
  availableTimeSlots?: any;
  customerHolidays?: any[];
  serviceProviderLeaves?: any[];
  active?: boolean;
}

interface BookingHistoryResponse {
  current?: any[];
  upcoming?: any[];
  past?: any[];
}

interface AllBookingsDialogProps {
  bookings: BookingHistoryResponse | null;
  serviceProviderId: number | null;
  trigger: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  onContactClient: (booking: Booking) => void;
}

export function AllBookingsDialog({ 
  bookings, 
  serviceProviderId, 
  trigger, 
  visible, 
  onClose, 
  onContactClient 
}: AllBookingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ongoing" | "future" | "past">("ongoing");
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  const mapApiBookingToBooking = (apiBooking: any): Booking => {
    const responsibilities = apiBooking.responsibilities || {};
    const noOfPersons = apiBooking.responsibilities?.tasks?.[0]?.persons || null;

    return {
      id: String(apiBooking.id),
      serviceProviderId: Number(apiBooking.serviceProviderId),
      customerId: Number(apiBooking.customerId),
      start_date: apiBooking.startDate,
      endDate: apiBooking.endDate,
      engagements: "",
      timeslot: apiBooking.startTime && apiBooking.endTime ? `${apiBooking.startTime} - ${apiBooking.endTime}` : "",
      monthlyAmount: Number(apiBooking.monthlyAmount || 0),
      paymentMode: "",
      booking_type: apiBooking.bookingType || "",
      service_type: apiBooking.serviceType || "",
      bookingDate: apiBooking.bookingDate,
      responsibilities,
      housekeepingRole: null,
      mealType: null,
      noOfPersons,
      experience: null,
      childAge: null,
      customerName: `${apiBooking.firstname || ""} ${apiBooking.lastname || ""}`.trim(),
      serviceProviderName: "",
      address: null,
      taskStatus: apiBooking.taskStatus || "",
      modifiedBy: "",
      modifiedDate: "",
      availableTimeSlots: null,
      customerHolidays: [],
      serviceProviderLeaves: [],
      active: true,
      clientName: `${apiBooking.firstname || ""} ${apiBooking.lastname || ""}`.trim(),
      service: apiBooking.serviceType || "",
      date: apiBooking.startDate?.split("T")[0] || "",
      time: apiBooking.startTime && apiBooking.endTime ? `${apiBooking.startTime} - ${apiBooking.endTime}` : "",
      location: "",
      status: apiBooking.taskStatus || "",
      amount: String(apiBooking.monthlyAmount || "0"),
      bookingData: apiBooking
    };
  };

  const fetchBookingsByMonth = async (
    type: "future" | "past",
    month: number,
    year: number
  ) => {
    if (!serviceProviderId) return [];

    try {
      setLoading(true);
      const formatted = `${year}-${String(month).padStart(2, "0")}`;
      const res = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${formatted}`
      );

      const apiData: BookingHistoryResponse = res.data;
      const list = type === "future" ? apiData.upcoming ?? [] : apiData.past ?? [];
      return list.map(mapApiBookingToBooking);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      Alert.alert("Error", "Failed to fetch bookings");
      return [];
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    if (!bookings) {
      setData([]);
      setTotalBookings(0);
      setInitialLoad(false);
      return;
    }

    const mapData = (list: any[]) => list.map(mapApiBookingToBooking);

    const now = dayjs();

    if (tab === "ongoing") {
      setLoading(true);
      setTimeout(() => {
        const ongoingBookings = mapData(bookings.current ?? []);
        setData(ongoingBookings);
        setTotalBookings(ongoingBookings.length);
        setSelectedMonth(now);
        setLoading(false);
        setInitialLoad(false);
      }, 500);
    } else if (tab === "future") {
      setLoading(true);
      const nextMonth = dayjs().add(1, "month").startOf("month");
      setSelectedMonth(nextMonth);
      fetchBookingsByMonth("future", nextMonth.month() + 1, nextMonth.year()).then(
        (res) => {
          setData(res ?? []);
          setTotalBookings(res.length);
        }
      );
    } else if (tab === "past") {
      setLoading(true);
      const prevMonth = dayjs().subtract(1, "month").startOf("month");
      setSelectedMonth(prevMonth);
      fetchBookingsByMonth("past", prevMonth.month() + 1, prevMonth.year()).then(
        (res) => {
          setData(res ?? []);
          setTotalBookings(res.length);
        }
      );
    }
  }, [tab, bookings]);

  useEffect(() => {
    if (!selectedMonth || tab === "ongoing") return;

    setLoading(true);
    fetchBookingsByMonth(
      tab,
      selectedMonth.month() + 1,
      selectedMonth.year()
    ).then((res) => {
      setData(res ?? []);
      setTotalBookings(res.length);
    });
  }, [selectedMonth, tab]);

  const getMonthName = (date: dayjs.Dayjs) => {
    return date.format("MMMM YYYY");
  };

  const handleMonthNavigation = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'next' 
      ? selectedMonth.add(1, 'month')
      : selectedMonth.subtract(1, 'month');
    setSelectedMonth(newMonth);
  };

  interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "destructive" | "secondary";
    style?: any;
  }

  const Badge = ({ children, variant = "default", style }: BadgeProps) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "success":
          return styles.badgeSuccess;
        case "warning":
          return styles.badgeWarning;
        case "destructive":
          return styles.badgeDestructive;
        case "secondary":
          return styles.badgeSecondary;
        default:
          return styles.badgeDefault;
      }
    };

    return (
      <View style={[styles.badge, getVariantStyle(), style]}>
        <Text style={styles.badgeText}>{children}</Text>
      </View>
    );
  };

  interface ButtonProps {
    children: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    onPress?: () => void;
  }

  const Button = ({ 
    children, 
    variant = "default", 
    size = "md", 
    onPress 
  }: ButtonProps) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "outline":
          return styles.buttonOutline;
        case "secondary":
          return styles.buttonSecondary;
        case "ghost":
          return styles.buttonGhost;
        default:
          return styles.buttonDefault;
      }
    };

    const getSizeStyle = () => {
      switch (size) {
        case "sm":
          return styles.buttonSm;
        case "lg":
          return styles.buttonLg;
        default:
          return styles.buttonMd;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.button, getVariantStyle(), getSizeStyle()]}
        onPress={onPress}
      >
        <Text style={[
          styles.buttonText,
          variant === "outline" && styles.buttonOutlineText,
          variant === "secondary" && styles.buttonSecondaryText
        ]}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  interface TabButtonProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }

  const TabButton = ({ label, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const MonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity 
        style={styles.monthNavButton}
        onPress={() => handleMonthNavigation('prev')}
      >
        <Text style={styles.monthNavText}>‹</Text>
      </TouchableOpacity>
      
      <Text style={styles.monthText}>
        {getMonthName(selectedMonth)}
      </Text>
      
      <TouchableOpacity 
        style={styles.monthNavButton}
        onPress={() => handleMonthNavigation('next')}
      >
        <Text style={styles.monthNavText}>›</Text>
      </TouchableOpacity>
    </View>
  );

  interface SkeletonLoaderProps {
    width: DimensionValue;
    height: number;
  }

  const SkeletonLoader = ({ width, height }: SkeletonLoaderProps) => (
    <View style={[styles.skeleton, { width, height }]} />
  );

  const renderResponsibilities = (booking: Booking) => {
    if (!booking.responsibilities) return null;

    const tasks = [
      ...((booking.responsibilities?.tasks || []).map((task: any) => ({ task, isAddon: false }))),
      ...((booking.responsibilities?.add_ons || []).map((task: any) => ({ task, isAddon: true }))),
    ];

    if (tasks.length === 0) return null;

    return (
      <View style={styles.responsibilitiesSection}>
        <Text style={styles.responsibilitiesTitle}>Responsibilities:</Text>
        <View style={styles.responsibilitiesList}>
          {tasks.map((item: any, index: number) => {
            const { task, isAddon } = item;
            const taskLabel = typeof task === "object" && task !== null
              ? Object.entries(task)
                  .filter(([key]) => key !== "taskType")
                  .map(([key, value]) => `${value} ${key}`)
                  .join(", ")
              : "";

            const taskName = typeof task === "object" ? task.taskType : String(task);

            return (
              <Badge 
                key={index} 
                variant="secondary" 
                style={styles.responsibilityBadge}
              >
                {isAddon ? "Add-ons - " : ""}
                {taskName} {taskLabel && `- ${taskLabel}`}
              </Badge>
            );
          })}
        </View>
      </View>
    );
  };

  const getTabLabel = (tabType: "ongoing" | "future" | "past") => {
    switch (tabType) {
      case "ongoing":
        return `Ongoing (${bookings?.current?.length || 0})`;
      case "future":
        return "Future";
      case "past":
        return "Past";
      default:
        return "";
    }
  };

  const getModalTitle = () => {
    switch (tab) {
      case "ongoing":
        return "Ongoing Bookings";
      case "future":
        return "Future Bookings";
      case "past":
        return "Past Bookings";
      default:
        return "All Bookings";
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={() => setOpen(true)}>
        <View>{trigger}</View>
      </TouchableWithoutFeedback>

      <Modal
        visible={open}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom header with close button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getModalTitle()}
              </Text>
              <TouchableOpacity 
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TabButton 
                label={getTabLabel("ongoing")}
                isActive={tab === "ongoing"}
                onPress={() => setTab("ongoing")}
              />
              <TabButton 
                label={getTabLabel("future")}
                isActive={tab === "future"}
                onPress={() => setTab("future")}
              />
              <TabButton 
                label={getTabLabel("past")}
                isActive={tab === "past"}
                onPress={() => setTab("past")}
              />
            </View>

            {/* Month Selector and Info */}
            <View style={styles.monthInfoContainer}>
              {(tab === "future" || tab === "past") ? (
                <>
                  <MonthSelector />
                  <Text style={styles.bookingCount}>
                    {loading ? (
                      <SkeletonLoader width={120} height={16} />
                    ) : (
                      `${totalBookings} booking${totalBookings !== 1 ? 's' : ''} in ${getMonthName(selectedMonth)}`
                    )}
                  </Text>
                </>
              ) : (
                <Text style={styles.bookingCount}>
                  {loading ? (
                    <SkeletonLoader width={120} height={16} />
                  ) : (
                    `${totalBookings} ongoing booking${totalBookings !== 1 ? 's' : ''}`
                  )}
                </Text>
              )}
            </View>

            <ScrollView style={styles.modalBody}>
              {loading && initialLoad ? (
                <View style={styles.loadingContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <View style={styles.skeletonHeader}>
                        <SkeletonLoader width="60%" height={24} />
                        <SkeletonLoader width="40%" height={16} />
                      </View>
                      <View style={styles.skeletonContent}>
                        <View style={styles.skeletonRow}>
                          <SkeletonLoader width="80%" height={16} />
                          <SkeletonLoader width="60%" height={16} />
                        </View>
                        <SkeletonLoader width="90%" height={16} />
                        <SkeletonLoader width="100%" height={36} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : data.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {tab === "ongoing" 
                      ? "No ongoing bookings found." 
                      : `No ${tab} bookings found for ${getMonthName(selectedMonth)}.`
                    }
                  </Text>
                </View>
              ) : (
                <View style={styles.bookingsContainer}>
                  {data.map((booking) => (
                    <View key={booking.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <Text style={styles.bookingId}>
                            Booking ID: {booking.id}
                          </Text>
                          <Text style={styles.cardTitle}>
                            {booking.clientName}
                          </Text>
                          <Text style={styles.serviceText}>
                            {getServiceTitle(booking.service)}
                          </Text>
                        </View>
                        <View style={styles.badgesContainer}>
                          {getBookingTypeBadge(booking.booking_type || "")}
                          {getStatusBadge(booking.taskStatus || "")}
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.infoGrid}>
                          <View style={styles.infoRow}>
                            <Calendar size={16} color="#9ca3af" />
                            <Text style={styles.infoText}>
                              {booking.date} at {booking.time}
                            </Text>
                          </View>
                          <Text style={styles.amountText}>
                            {booking.amount}
                          </Text>
                        </View>

                        <View style={styles.locationRow}>
                          <MapPin size={16} color="#9ca3af" />
                          <Text style={styles.locationText}>
                            {booking.location}
                          </Text>
                        </View>

                        {/* Responsibilities Section */}
                        {renderResponsibilities(booking)}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onPress={() => onContactClient(booking)}
                        >
                          Contact Client
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
  },
  monthInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  monthNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    minWidth: 120,
    textAlign: 'center',
  },
  bookingCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalBody: {
    padding: 16,
  },
  loadingContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  skeletonHeader: {
    marginBottom: 12,
    gap: 8,
  },
  skeletonContent: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  bookingsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  responsibilitiesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  responsibilitiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibilityBadge: {
    marginBottom: 4,
  },
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  badgeDefault: {
    backgroundColor: '#3b82f6',
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b',
  },
  badgeDestructive: {
    backgroundColor: '#ef4444',
  },
  badgeSecondary: {
    backgroundColor: '#6b7280',
  },
  // Button styles
  button: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMd: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonDefault: {
    backgroundColor: '#3b82f6',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: '#374151',
  },
  buttonSecondaryText: {
    color: 'white',
  },
});