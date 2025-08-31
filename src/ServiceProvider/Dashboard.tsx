import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { DashboardMetricCard } from './DashboardMetricCard';
import { BookingCard } from './BookingCard';
import { PaymentHistory } from './PaymentHistory';
import { useAuth0 } from 'react-native-auth0';
import { AllBookingsDialog } from './AllBookingsDialog';
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from '../common/BookingUtils';
import axiosInstance from '../axiosInstance';
// import axiosInstance from './axiosInstance';
import LinearGradient from 'react-native-linear-gradient';

// Types for API response
interface CustomerHoliday {
  id: number;
  customerId: number;
  applyHolidayDate: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  active: boolean;
}

interface ServiceProviderLeave {
  id: number;
  serviceProviderId: number;
  applyLeaveDate: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  active: boolean;
}

interface Booking {
  id: number;
  serviceProviderId: number;
  customerId: number;
  startDate: string;
  endDate: string;
  engagements: string;
  timeslot: string;
  monthlyAmount: number;
  paymentMode: string;
  bookingType: string;
  serviceType: string;
  bookingDate: string;
  responsibilities: string[];
  housekeepingRole: string | null;
  mealType: string | null;
  noOfPersons: number | null;
  experience: string | null;
  childAge: number | null;
  customerName: string;
  serviceProviderName: string;
  address: string | null;
  taskStatus: string;
  modifiedBy: string;
  modifiedDate: string;
  availableTimeSlots: string | null;
  customerHolidays: CustomerHoliday[];
  serviceProviderLeaves: ServiceProviderLeave[];
  active: boolean;
}

interface BookingHistoryResponse {
  current: Booking[];
  future: Booking[];
  past: Booking[];
}

// Mock data for metrics and payments
const metrics = [
  {
    title: "Total Earnings",
    value: "₹24,580",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: "rupee" as const,
    description: "This month"
  },
  {
    title: "Security Deposit",
    value: "₹2,500",
    change: "Held",
    changeType: "neutral" as const,
    icon: "home" as const,
    description: "For active bookings"
  },
  {
    title: "Service Fee",
    value: "₹1,230",
    change: "-10%",
    changeType: "negative" as const,
    icon: "rupee" as const,
    description: "Service charges"
  },
  {
    title: "Actual Payout",
    value: "₹20,850",
    change: "+10.2%",
    changeType: "positive" as const,
    icon: "rupee" as const,
    description: "After deductions"
  }
];

const paymentHistory = [
  {
    id: "1",
    date: "Dec 25, 2024",
    description: "Cleaning Service - Priya S.",
    amount: "₹800",
    status: "completed" as const,
    type: "earning" as const
  },
  {
    id: "2",
    date: "Dec 24, 2024",
    description: "Cooking Service - Rajesh K.",
    amount: "₹1,200",
    status: "completed" as const,
    type: "earning" as const
  },
  {
    id: "3",
    date: "Dec 23, 2024",
    description: "Withdrawal to Bank",
    amount: "₹5,000",
    status: "completed" as const,
    type: "withdrawal" as const
  },
  {
    id: "4",
    date: "Dec 22, 2024",
    description: "Care Service - Anita P.",
    amount: "₹1,500",
    status: "pending" as const,
    type: "earning" as const
  }
];

// Function to format API booking data for the BookingCard component
const formatBookingForCard = (booking: Booking) => {
  const status = booking.taskStatus === "COMPLETED" ? "completed" : 
                booking.taskStatus === "IN_PROGRESS" ? "in-progress" : "upcoming";
  
  return {
    id: booking.id.toString(),
    clientName: booking.customerName,
    service: getServiceTitle(booking.serviceType),
    date: new Date(booking.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: booking.timeslot,
    location: booking.address || "Address not provided",
    status: status,
    amount: `₹${booking.monthlyAmount}`,
    contact: "Contact info not available",
    bookingData: booking
  };
};

interface DashboardProps {
  onProfilePress: () => void;
}

export default function Dashboard({ onProfilePress }: DashboardProps) {
  const { clearSession, user: auth0User } = useAuth0();
  const [bookings, setBookings] = useState<BookingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [serviceProviderId, setServiceProviderId] = useState<number | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);

  // Extract name and serviceProviderId from Auth0 user
  useEffect(() => {
    if (auth0User) {
      const name = auth0User.name || null;
      const id = auth0User.serviceProviderId || null;

      setUserName(name);
      setServiceProviderId(id ? Number(id) : null);
    }
  }, [auth0User]);

  // Fetch booking history once serviceProviderId is available
  useEffect(() => {
    if (!serviceProviderId) return;

    const fetchBookingHistory = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/api/serviceproviders/get-sp-booking-history-by-serviceprovider?serviceProviderId=${serviceProviderId}`
        );
        if (response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BookingHistoryResponse = response.data;
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch booking history');
        Alert.alert("Error", "Failed to load booking data");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingHistory();
  }, [serviceProviderId]);

  const handleContactClient = (booking: any) => {
    Alert.alert(
      "Contact Information",
      `Call ${booking.clientName} at ${booking.contact}`,
      [{ text: "OK" }]
    );
  };

  // Combine current and future bookings for display
  const upcomingBookings = bookings ? [
    ...(bookings.current || []),
    ...(bookings.future || [])
  ].map(formatBookingForCard) : [];

  // Get the most recent booking for display
  const latestBooking = upcomingBookings.length > 0 ? [upcomingBookings[0]] : [];

  const onLogout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* Welcome Section */}
       <LinearGradient
  colors={[
    'rgba(139, 187, 221, 0.8)', // Blue tone
    'rgba(213, 229, 233, 0.8)', // Lighter blue
    'rgba(255,255,255,1)'       // White at the bottom
  ]}
  start={{x: 0, y: 0}}
  end={{x: 0, y: 1}} // Vertical fade
  style={styles.welcomeBanner}
>
      {/* <View style={styles.welcomeBanner}> */}
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeTextContainer}>
           <View style={styles.welcomeIconRow}>
  <MaterialIcon name="home" size={16} color="#0e305c" />
  <View>
    <Text style={styles.welcomeBackText}>Welcome back,</Text>
    <Text style={styles.userNameText}>{userName || "Guest"}</Text>
  </View>
</View>
            
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Icon name="calendar" size={16} color="#3b82f6" />
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>+3</Text>
                </View>
              </View>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Icon name="star" size={16} color="#f59e0b" />
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>+2%</Text>
                </View>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Icon name="trending-up" size={16} color="#10b981" />
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>+2%</Text>
                </View>
              </View>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </View>
      {/* </View> */}
</LinearGradient>

      <View style={styles.mainContent}>
        <Text style={styles.welcomeSubtitle}>
              Here's what's happening with your services today.
            </Text>
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <DashboardMetricCard key={index} {...metric} />
          ))}
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Recent Booking */}
          <View style={styles.recentBookings}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Booking</Text>
                {!loading && latestBooking.length > 0 && (
                  <View style={styles.latestBadge}>
                    <Text style={styles.latestBadgeText}>Latest</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                  </View>
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load bookings. Please try again.</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={() => {
                        setError(null);
                        setLoading(true);
                        if (serviceProviderId) {
                          axiosInstance.get(
                            `/api/serviceproviders/get-sp-booking-history-by-serviceprovider?serviceProviderId=${serviceProviderId}`
                          ).then(response => {
                            setBookings(response.data);
                            setLoading(false);
                          }).catch(err => {
                            setError(err instanceof Error ? err.message : 'Failed to fetch booking history');
                            setLoading(false);
                          });
                        }
                      }}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : latestBooking.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No upcoming bookings found.</Text>
                  </View>
                ) : (
                  latestBooking.map((booking) => (
                    <View key={booking.id} style={styles.bookingItem}>
                      <View style={styles.bookingHeader}>
                        <View>
                          <Text style={styles.clientName}>{booking.clientName}</Text>
                          <Text style={styles.serviceType}>{booking.service}</Text>
                        </View>
                        <View style={styles.badgeContainer}>
                          {getBookingTypeBadge(booking.bookingData.bookingType)}
                          {getStatusBadge(booking.bookingData.taskStatus)}
                        </View>
                      </View>
                      
                      <View style={styles.bookingDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Date & Time</Text>
                          <Text style={styles.detailValue}>{booking.date} at {booking.time}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Amount</Text>
                          <Text style={styles.detailValue}>{booking.amount}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.addressContainer}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue}>{booking.location}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.contactButton}
                        onPress={() => handleContactClient(booking)}
                      >
                        <Text style={styles.contactButtonText}>Contact Client</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
              </View>
              <View style={styles.cardContent}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowAllBookings(true)}
                >
                  <Icon name="users" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>View All Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="rupee" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Request Withdrawal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="calendar" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Apply Leave</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="clock-o" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Update Availability</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="star" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>View Reviews</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Service Status */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Service Status</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Profile Status</Text>
                  <View style={[styles.statusBadge, styles.activeBadge]}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Verification</Text>
                  <View style={[styles.statusBadge, styles.activeBadge]}>
                    <Text style={styles.statusBadgeText}>Verified</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Availability</Text>
                  <View style={[styles.statusBadge, styles.availableBadge]}>
                    <Text style={styles.statusBadgeText}>Available</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.bottomSection}>
          <PaymentHistory payments={paymentHistory} />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={onLogout}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* All Bookings Dialog */}
      <AllBookingsDialog
        visible={showAllBookings}
        onClose={() => setShowAllBookings(false)}
        bookings={upcomingBookings}
        onContactClient={handleContactClient} trigger={undefined}      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'rgba(23, 43, 77, 0.8)',
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 1,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  profileName: {
    fontWeight: '600',
    color: '#ffffff',
  },
  profileRole: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  welcomeBanner: {
    backgroundColor: 'rgba(177, 213, 232, 1)',
    padding: 10,
    paddingTop: 30,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  welcomeTextContainer: {
    flex: 1,
    minWidth: 180,
  },
  welcomeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
   welcomeBackText: {
    fontSize: 13,
    color: '#0e305c',
    marginLeft: 4,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 20,
    color: '#0e305c',
    marginLeft: 4,
    fontWeight: 'bold',
    marginTop: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e305c',
    marginLeft: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#004aad',
    opacity: 0.9,
    textAlign: 'center', // Center the subtitle
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(135, 206, 235, 1)',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeText: {
    fontSize: 9,
    color: '#0e305c',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#0e305c',
  },
  mainContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  recentBookings: {
    width: '100%',
    marginBottom: 16,
  },
  quickActions: {
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  latestBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  latestBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
  },
  bookingItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  serviceType: {
    color: '#6b7280',
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  addressContainer: {
    marginBottom: 12,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#111827',
  },
  buttonIcon: {
    color: '#6b7280',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#6b7280',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  availableBadge: {
    backgroundColor: '#3b82f6',
  },
  bottomSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});