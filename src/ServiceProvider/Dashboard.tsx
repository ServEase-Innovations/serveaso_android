import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { DashboardMetricCard } from './DashboardMetricCard';
import { BookingCard } from './BookingCard';
import { PaymentHistory } from './PaymentHistory';
import { useAuth0 } from 'react-native-auth0';

// Mock data
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
    title: "Active Bookings",
    value: "8",
    change: "+3",
    changeType: "positive" as const,
    icon: "calendar" as const,
    description: "Upcoming services"
  },
  {
    title: "Average Rating",
    value: "4.8",
    change: "+0.2",
    changeType: "positive" as const,
    icon: "star" as const,
    description: "From 156 reviews"
  },
  {
    title: "Completion Rate",
    value: "98%",
    change: "+2%",
    changeType: "positive" as const,
    icon: "trending-up" as const,
    description: "Last 30 days"
  }
];

const recentBookings = [
  {
    id: "1",
    clientName: "Priya Sharma",
    service: "House Cleaning",
    date: "Dec 28, 2024",
    time: "10:00 AM",
    location: "Koramangala, Bangalore",
    status: "upcoming" as const,
    amount: "₹800",
    contact: "+91 98765 43210"
  },
  {
    id: "2",
    clientName: "Rajesh Kumar",
    service: "Cooking Service",
    date: "Dec 27, 2024",
    time: "6:00 PM",
    location: "Indiranagar, Bangalore",
    status: "completed" as const,
    amount: "₹1,200",
    contact: "+91 87654 32109"
  },
  {
    id: "3",
    clientName: "Anita Patel",
    service: "Elderly Care",
    date: "Dec 29, 2024",
    time: "2:00 PM",
    location: "Whitefield, Bangalore",
    status: "upcoming" as const,
    amount: "₹1,500",
    contact: "+91 76543 21098"
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

interface DashboardProps {
  onProfilePress: () => void;
}

export default function Dashboard({ onProfilePress }: DashboardProps) {
  const { clearSession } = useAuth0();

  const handleContactClient = (booking: any) => {
    console.log(`Call ${booking.clientName} at ${booking.contact}`);
  };

  const onLogout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <MaterialIcon name="home" size={24} color="#ffffff" />
              <Text style={styles.logoText}>ServEase Provider</Text>
            </View>
          </View>
           
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="bell" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileContainer} 
              onPress={onProfilePress}
            >
              <View style={styles.profileText}>
                <Text style={styles.profileName}>Maya Patel</Text>
                <Text style={styles.profileRole}>Cleaning Specialist</Text>
              </View>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>MP</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back, Maya! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Here's what's happening with your services today.
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <DashboardMetricCard key={index} {...metric} />
          ))}
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Recent Bookings */}
          <View style={styles.recentBookings}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Bookings</Text>
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingBadgeText}>
                    {recentBookings.filter(b => b.status === "upcoming").length} upcoming
                  </Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                {recentBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onContactClient={handleContactClient}
                  />
                ))}
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
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="users" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>View All Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="rupee" size={16} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Request Withdrawal</Text>
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

        {/* Charts and Payment History */}
        <View style={styles.bottomSection}>
          <PaymentHistory payments={paymentHistory} />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={onLogout}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
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
    color: '#ffffff', // Changed to white
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
    color: '#ffffff', // Changed to white
  },
  profileRole: {
    fontSize: 12,
    color: '#e5e7eb', // Changed to light gray for better visibility on dark background
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
  mainContent: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#6b7280',
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
  upcomingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upcomingBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
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
