
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from './axiosInstance';
import dayjs from 'dayjs';

// Keep these imports as they are
import UserHoliday from './UserHoliday';
import ModifyBookingDialog from './ModifyBookingDialog';

// Implement Card component
const Card: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

// Implement Button component
const Button: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}> = ({ children, onPress, style, disabled = false }) => {
  return (
    <Pressable
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
};

// Implement Badge component
const Badge: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  return (
    <View style={[styles.badgeBase, style]}>
      {children}
    </View>
  );
};

// Implement Separator component
const Separator: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.separatorBase, style]} />
  );
};

interface Booking {
  id: number;
  name: string;
  serviceProviderId: number;
  timeSlot: string;
  date: string;
  startDate: string;
  endDate: string;
  bookingType: string;
  monthlyAmount: number;
  paymentMode: string;
  address: string;
  customerName: string;
  serviceProviderName: string;
  taskStatus: string;
  bookingDate: string;
  engagements: string;
  serviceType: string;
  childAge: string;
  experience: string;
  noOfPersons: string;
  mealType: string;
  modifiedDate: string;
  responsibilities: string;
}

const getServiceIcon = (type: string) => {
  switch (type) {
    case 'maid':
      return 'broom';
    case 'cleaning':
      return 'broom';
    case 'nanny':
      return 'heart';
    default:
      return 'chef-hat';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge style={styles.activeBadge}>
          <Icon name="alert-circle" size={14} color="#3b82f6" />
          <Text style={styles.activeBadgeText}>Active</Text>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge style={styles.completedBadge}>
          <Icon name="check-circle" size={14} color="#10b981" />
          <Text style={styles.completedBadgeText}>Completed</Text>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge style={styles.cancelledBadge}>
          <Icon name="close-circle" size={14} color="#ef4444" />
          <Text style={styles.cancelledBadgeText}>Cancelled</Text>
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge style={styles.inProgressBadge}>
          <Icon name="clock" size={14} color="#6b7280" />
          <Text style={styles.inProgressBadgeText}>In Progress</Text>
        </Badge>
      );
    case 'NOT_STARTED':
      return (
        <Badge style={styles.notStartedBadge}>
          <Icon name="clock" size={14} color="#6b7280" />
          <Text style={styles.notStartedBadgeText}>NOT_STARTED</Text>
        </Badge>
      );
    default:
      return null;
  }
};

const getBookingTypeBadge = (type: string) => {
  switch (type) {
    case 'ON_DEMAND':
      return (
        <Badge style={styles.onDemandBadge}>
          <Text style={styles.onDemandBadgeText}>On Demand</Text>
        </Badge>
      );
    case 'MONTHLY':
      return (
        <Badge style={styles.monthlyBadge}>
          <Text style={styles.monthlyBadgeText}>Monthly</Text>
        </Badge>
      );
    case 'SHORT_TERM':
      return (
        <Badge style={styles.shortTermBadge}>
          <Text style={styles.shortTermBadgeText}>Short Term</Text>
        </Badge>
      );
    default:
      return (
        <Badge style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>{type}</Text>
        </Badge>
      );
  }
};

const getServiceTitle = (type: string) => {
  switch (type) {
    case 'cook':
      return 'Home Cook';
    case 'maid':
      return 'Maid Service';
    case 'nanny':
      return 'Caregiver Service';
    default:
      return 'Home Service';
  }
};

const Booking: React.FC = () => {
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [selectedBookingForLeave, setSelectedBookingForLeave] = useState<Booking | null>(null);
  // const { user: auth0User, isAuthenticated } = useAuth0();
  // const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modifiedBookings, setModifiedBookings] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
const { user: auth0User } = useAuth0();
  const isAuthenticated = auth0User !== undefined && auth0User !== null;

  // Update your state initialization
  const [customerId, setCustomerId] = useState<number | null>(
    auth0User?.customerid ? Number(auth0User.customerid) : null
  );

  // useEffect(() => {
  //   if (isAuthenticated && auth0User) {
  //     setCustomerId(auth0User.customerid);
  //   }
  // }, [isAuthenticated, auth0User]);
 // Update your useEffect
  useEffect(() => {
    if (auth0User) {
      setCustomerId(auth0User.customerid ? Number(auth0User.customerid) : null);
    }
  }, [auth0User]);
  
  const generateTimeSlots = async (serviceProviderId: number): Promise<string[]> => {
    try {
      const response = await axiosInstance.get(
        `/api/serviceproviders/get/engagement/by/serviceProvider/${serviceProviderId}`
      );

      const engagementData = response.data.map((engagement: { id?: number; availableTimeSlots?: string[] }) => ({
        id: engagement.id ?? Math.random(),
        availableTimeSlots: engagement.availableTimeSlots || [],
      }));

      const fullTimeSlots: string[] = Array.from({ length: 15 }, (_, i) =>
        `${(i + 6).toString().padStart(2, '0')}:00`
      );

      const processedSlots = engagementData.map((entry: { availableTimeSlots: Iterable<unknown> | null | undefined; id: any; }) => {
        const uniqueAvailableTimeSlots = Array.from(new Set(entry.availableTimeSlots)).sort();
        const missingTimeSlots = fullTimeSlots.filter(slot => !uniqueAvailableTimeSlots.includes(slot));

        return {
          id: entry.id,
          uniqueAvailableTimeSlots,
          missingTimeSlots,
        };
      });

      const uniqueMissingSlots: string[] = Array.from(
        new Set(processedSlots.flatMap((slot: { missingTimeSlots: any; }) => slot.missingTimeSlots))
      ).sort() as string[];

      setUniqueMissingSlots(uniqueMissingSlots);

      return fullTimeSlots.filter(slot => !uniqueMissingSlots.includes(slot));
    } catch (error) {
      console.error("Error fetching engagement data:", error);
      return [];
    }
  };

  const mapBookingData = (data: any[]) => {
    return Array.isArray(data)
      ? data.map((item) => {
          return {
            id: item.id,
            customerId: item.customerId,
            serviceProviderId: item.serviceProviderId,
            name: item.customerName,
            timeSlot: item.timeslot,
            date: item.startDate,
            startDate: item.startDate,
            endDate: item.endDate,
            bookingType: item.bookingType,
            monthlyAmount: item.monthlyAmount,
            paymentMode: item.paymentMode,
            address: item.address || 'No address specified',
            customerName: item.customerName,
            serviceProviderName: item.serviceProviderName === "undefined undefined" ? "Not Assigned" : item.serviceProviderName,
            taskStatus: item.taskStatus,
            engagements: item.engagements,
            bookingDate: item.bookingDate,
            serviceType: item.serviceType?.toLowerCase() || 'other',
            childAge: item.childAge,
            experience: item.experience,
            noOfPersons: item.noOfPersons,
            mealType: item.mealType,
            modifiedDate: item.modifiedDate,
            responsibilities: item.responsibilities,
          };
        })
      : [];
  };

  useEffect(() => {
    if (customerId !== null && customerId !== undefined) {
      setIsLoading(true);
      axiosInstance
        .get(`api/serviceproviders/get-sp-booking-history-by-customer?customerId=${customerId}`)
        .then((response) => {
          const { past = [], current = [], future = [] } = response.data || {};
          setPastBookings(mapBookingData(past));
          setCurrentBookings(mapBookingData(current));
          setFutureBookings(mapBookingData(future));
        })
        .catch((error) => {
          console.error("Error fetching booking details:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [customerId]);

  const handleModifyBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleSaveModifiedBooking = async (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => {
    if (!selectedBooking) return;

    const serviceTypeUpperCase = selectedBooking.serviceType.toUpperCase();

    let updatePayload: any = {
      customerId: customerId,
      startDate: updatedData.startDate,
      endDate: updatedData.endDate,
      timeslot: updatedData.timeSlot,
      modifiedBy: "CUSTOMER",
    };

    try {
      setIsRefreshing(true);
      const response = await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${selectedBooking.id}`,
        updatePayload
      );

      setCurrentBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? { 
                ...b, 
                startDate: updatedData.startDate,
                endDate: updatedData.endDate,
                timeSlot: updatedData.timeSlot 
              }
            : b
        )
      );
      setFutureBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? { 
                ...b, 
                startDate: updatedData.startDate,
                endDate: updatedData.endDate,
                timeSlot: updatedData.timeSlot 
              }
            : b
        )
      );
      setModifiedBookings(prev => [...prev, selectedBooking.id]);
      setOpenDialog(false);
      setOpenSnackbar(true);
      
      if (customerId !== null) {
        await axiosInstance
          .get(`api/serviceproviders/get-sp-booking-history-by-customer?customerId=${customerId}`)
          .then((response) => {
            const { past = [], current = [], future = [] } = response.data || {};
            setPastBookings(mapBookingData(past));
            setCurrentBookings(mapBookingData(current));
            setFutureBookings(mapBookingData(future));
          });
      }
    } catch (error: any) {
      console.error("Error updating booking:", error);
      if (error.response) {
        console.error("Full error response:", error.response.data);
      }
    }
  };

  const isBookingModified = (bookingId: number) => {
    return modifiedBookings.includes(bookingId);
  };

  const isModificationAllowed = (startDate: string) => {
    const today = dayjs();
    const bookingStartDate = dayjs(startDate);
    const daysDifference = bookingStartDate.diff(today, 'day');
    return daysDifference >= 2;
  };

  const handleCancelBooking = async (booking: Booking) => {
    const updatedStatus = "CANCELLED";
    const serviceTypeUpperCase = booking.serviceType.toUpperCase();

    let updatePayload: any = {
      customerId: customerId,
      taskStatus: updatedStatus,
      modifiedBy: "CUSTOMER"
    };

    try {
      const response = await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );

      setCurrentBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: updatedStatus } : b
        )
      );
      setFutureBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: updatedStatus } : b
        )
      );
    } catch (error: any) {
      console.error("Error updating task status:", error);
      if (error.response) {
        console.error("Full error response:", error.response.data);
      } else if (error.message) {
        console.error("Error message:", error.message);
      } else {
        console.error("Unknown error occurred");
      }
    }

    setOpenSnackbar(true);
  };

  const handleLeaveSubmit = async (startDate: string, endDate: string, serviceType: string): Promise<void> => {
    if (!selectedBookingForLeave || !customerId) {
      throw new Error("Missing required information for leave application");
    }

    try {
      await axiosInstance.post(
        '/api/customer/add-customer-holiday',
        {
          customerId: customerId,
          startDate: startDate,
          endDate: endDate,
          serviceType: serviceType.toUpperCase()
        }
      );
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error applying leave:", error);
      throw error;
    }
  };

  const handleApplyLeaveClick = (booking: Booking) => {
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term) return bookings;
    
    return bookings.filter(booking => 
      getServiceTitle(booking?.serviceType).toLowerCase().includes(term?.toLowerCase()) ||
      booking.serviceProviderName?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.address?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.bookingType?.toLowerCase().includes(term?.toLowerCase())
    );
  };

  const sortUpcomingBookings = (bookings: Booking[]): Booking[] => {
    const statusOrder: Record<string, number> = {
      'ACTIVE': 1,
      'IN_PROGRESS': 2,
      'NOT_STARTED': 3,
      'COMPLETED': 4,
      'CANCELLED': 5
    };

    return [...bookings].sort((a, b) => {
      const statusComparison = statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  };

  const upcomingBookings = sortUpcomingBookings([...currentBookings, ...futureBookings]);
  const filteredUpcomingBookings = filterBookings(upcomingBookings, searchTerm);
  const filteredPastBookings = filterBookings(pastBookings, searchTerm);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceInfo}>
          <Icon 
            name={getServiceIcon(item.serviceType)} 
            size={24} 
            color={
              item.serviceType === 'maid' ? '#f97316' : 
              item.serviceType === 'cleaning' ? '#ec4899' : 
              item.serviceType === 'nanny' ? '#ef4444' : '#000'
            } 
          />
          <View>
            <Text style={styles.serviceTitle}>{getServiceTitle(item.serviceType)}</Text>
            <Text style={styles.bookingId}>Booking #{item.id}</Text>
          </View>
        </View>
        <View style={styles.badgeContainer}>
          {getBookingTypeBadge(item.bookingType)}
          {getStatusBadge(item.taskStatus)}
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={18} color="#6b7280" />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock" size={18} color="#6b7280" />
            <Text style={styles.detailText}>{item.timeSlot}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={18} color="#6b7280" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.providerInfo}>
          <View>
            <Text style={styles.providerName}>{item.serviceProviderName}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{4.5}</Text>
            </View>
          </View>
          <Text style={styles.priceText}>₹{item.monthlyAmount}</Text>
        </View>
      </View>

      <Separator style={styles.separator} />

      <View style={styles.actionButtons}>
        {item.taskStatus === 'CANCELLED' ? (
          <Button style={styles.actionButton} onPress={() => {}}>
            <Text>Book Again</Text>
          </Button>
        ) : (
          <>
            {item.address && (
              <Button style={styles.actionButton} onPress={() => {}}>
                <Icon name="phone" size={16} color="#000" />
                <Text>Call Provider</Text>
              </Button>
            )}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>
            {item.bookingType !== 'ON_DEMAND' && item.bookingType !== 'SHORT_TERM' && (
              <Button 
                style={styles.actionButton}
                onPress={() => handleApplyLeaveClick(item)}
              >
                <Text>Add Vacation</Text>
              </Button>
            )}
            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(item)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>
            {item.bookingType === 'MONTHLY' && (
              <Button
                style={styles.actionButton}
                onPress={() => handleModifyBooking(item)}
                disabled={
                  new Date(item.modifiedDate).getTime() !==
                  new Date(item.bookingDate).getTime()
                }
              >
                <Icon name="pencil" size={16} color="#000" />
                <Text>Modify Booking</Text>
              </Button>
            )}
          </>
        )}
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage your household service appointments</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchTerm('')}
            >
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="alert-circle" size={24} color="#3b82f6" />
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? 'booking' : 'bookings'} scheduled
            </Text>
          </View>
          <Badge style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{upcomingBookings.length}</Text>
          </Badge>
        </View>

        {filteredUpcomingBookings.length > 0 ? (
          <FlatList
            data={filteredUpcomingBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Card style={styles.emptyStateCard}>
            <Icon name="calendar" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Upcoming Bookings</Text>
            <Text style={styles.emptyStateText}>Ready to book your next service?</Text>
            <Button style={styles.emptyStateButton}>
              <Text>Book a Service</Text>
            </Button>
          </Card>
        )}
      </View>

      {/* Past Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="history" size={24} color="#6b7280" />
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>Past Bookings</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'booking' : 'bookings'} in history
            </Text>
          </View>
          <Badge style={[styles.sectionBadge, styles.pastBadge]}>
            <Text style={styles.sectionBadgeText}>{pastBookings.length}</Text>
          </Badge>
        </View>

        {filteredPastBookings.length > 0 ? (
          <FlatList
            data={filteredPastBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Card style={styles.emptyStateCard}>
            <Icon name="clock" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Past Bookings</Text>
            <Text style={styles.emptyStateText}>Your completed and cancelled bookings will appear here.</Text>
          </Card>
        )}
      </View>

      <UserHoliday 
        open={holidayDialogOpen}
        onClose={() => setHolidayDialogOpen(false)}
        booking={selectedBookingForLeave}
        onLeaveSubmit={handleLeaveSubmit}
      />
      <ModifyBookingDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        booking={selectedBooking}
        timeSlots={timeSlots}
        onSave={handleSaveModifiedBooking}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Base components styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    opacity: 0.6,
  },
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  separatorBase: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },

  // Other styles from previous implementation
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(23, 43, 77, 0.8)',
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  pastSectionHeader: {
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
    borderLeftColor: 'rgba(156, 163, 175, 0.3)',
  },
  sectionHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  pastBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  sectionBadgeText: {
    color: '#3b82f6',
  },
  pastBadgeText: {
    color: '#6b7280',
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
  },
  bookingDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#4b5563',
  },
  providerInfo: {
    alignItems: 'flex-end',
  },
  providerName: {
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 8,
  },
  separator: {
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#fff',
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateText: {
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
  },
  // Badge styles
  activeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  completedBadgeText: {
    color: '#10b981',
    fontSize: 12,
    marginLeft: 4,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cancelledBadgeText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
  },
  inProgressBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  inProgressBadgeText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  notStartedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  notStartedBadgeText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  onDemandBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  onDemandBadgeText: {
    color: '#8b5cf6',
    fontSize: 12,
  },
  monthlyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  monthlyBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
  },
  shortTermBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shortTermBadgeText: {
    color: '#10b981',
    fontSize: 12,
  },
  defaultBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  defaultBadgeText: {
    color: '#6b7280',
    fontSize: 12,
  },
});

export default Booking;