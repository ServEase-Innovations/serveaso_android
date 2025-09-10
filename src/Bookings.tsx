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
  StyleProp,
  Modal,
  RefreshControl
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from './axiosInstance';
import dayjs from 'dayjs';
import axios from 'axios';

// Import existing components
import UserHoliday from './UserHoliday';
import ModifyBookingDialog from './ModifyBookingDialog';

// Import new components
import ConfirmationDialog from './ConfirmationDialog';
import AddReviewDialog from './AddReviewDialog';
import WalletDialog from './WalletDialog';
import LinearGradient from 'react-native-linear-gradient';

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

interface CustomerHoliday {
  id: number;
  engagementId: number;
  customerId: number;
  applyHolidayDate: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  active: boolean;
}

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
  customerHolidays?: CustomerHoliday[];
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

const hasMatchingHolidayIds = (booking: Booking): boolean => {
  if (!booking.customerHolidays || booking.customerHolidays.length === 0) {
    return false;
  }
  
  return booking.customerHolidays.some(
    (holiday) => holiday.engagementId === booking.id
  );
};

const Booking: React.FC = () => {
  // STATE VARIABLES (grouped by category)
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingForLeave, setSelectedBookingForLeave] = useState<Booking | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modifiedBookings, setModifiedBookings] = useState<number[]>([]);
  const [bookingsWithVacation, setBookingsWithVacation] = useState<number[]>([]);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Other states
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Add these state variables near your other dialog states
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    type: 'cancel' | 'modify' | 'vacation' | null;
    booking: Booking | null;
    message: string;
    title: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>({
    open: false,
    type: null,
    booking: null,
    message: '',
    title: '',
    severity: 'info'
  });

  // AUTH & INITIALIZATION
  const { user: auth0User } = useAuth0();
  const isAuthenticated = auth0User !== undefined && auth0User !== null;

  useEffect(() => {
    if (auth0User) {
      setCustomerId(auth0User.customerid ? Number(auth0User.customerid) : null);
    }
  }, [auth0User]);

  // DATA FETCHING FUNCTIONS
  useEffect(() => {
    setIsLoading(true);
    
    const fetchBookings = async () => {
      try {
        if (customerId !== null && customerId !== undefined) {
          const response = await axios.get(
            `https://payments-j5id.onrender.com/api/customers/${customerId}/engagements`
          );
          
          const { past = [], ongoing = [], upcoming = [] } = response.data || {};
          setPastBookings(mapBookingData(past));
          setCurrentBookings(mapBookingData(ongoing));
          setFutureBookings(mapBookingData(upcoming));
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId !== null && customerId !== undefined) {
      fetchBookings();
    } else if (isAuthenticated) {
      // Customer ID will be set by the other useEffect, which will trigger this flow
    } else {
      setIsLoading(false);
    }
  }, [customerId, isAuthenticated]);

  // DATA MAPPING & UTILITY FUNCTIONS
  const mapBookingData = (data: any[]) => {
    return Array.isArray(data)
      ? data.map((item) => {
          return {
            id: item.engagement_id,
            customerId: item.customerId,
            serviceProviderId: item.serviceProviderId,
            name: item.customerName,
            timeSlot: item.start_time,
            date: item.start_date,
            startDate: item.start_date,
            endDate: item.end_date,
            bookingType: item.booking_type,
            monthlyAmount: item.monthlyAmount,
            paymentMode: item.paymentMode,
            address: item.address || 'No address specified',
            customerName: item.customerName,
            serviceProviderName: item.serviceProviderName === "undefined undefined" ? "Not Assigned" : item.serviceProviderName,
            taskStatus: item.task_status,
            engagements: item.engagements,
            bookingDate: item.created_at,
            serviceType: item.serviceType?.toLowerCase() || 'other',
            childAge: item.childAge,
            experience: item.experience,
            noOfPersons: item.noOfPersons,
            mealType: item.mealType,
            modifiedDate: Array.isArray(item.modifications) && item.modifications.length > 0
              ? item.modifications[item.modifications.length - 1]?.created_at
              : item.created_at,
            responsibilities: item.responsibilities,
            customerHolidays: item.customerHolidays || [],
          };
        })
      : [];
  };

  // FILTER & SORT FUNCTIONS
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

 

  // Refresh function
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (customerId !== null) {
        const response = await axios.get(
          `https://payments-j5id.onrender.com/api/customers/${customerId}/engagements`
        );
        const { past = [], ongoing = [], upcoming = [] } = response.data || {};
        setPastBookings(mapBookingData(past));
        setCurrentBookings(mapBookingData(ongoing));
        setFutureBookings(mapBookingData(upcoming));
      }
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ACTION HANDLERS - CONFIRMATION DIALOG
  const showConfirmation = (
    type: 'cancel' | 'modify' | 'vacation',
    booking: Booking,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => {
    setConfirmationDialog({
      open: true,
      type,
      booking,
      message,
      title,
      severity
    });
  };

  const handleConfirmAction = async () => {
    const { type, booking } = confirmationDialog;
    if (!booking) return;

    setActionLoading(true);

    try {
      switch (type) {
        case 'cancel':
          await handleCancelBooking(booking);
          break;
        case 'modify':
          setModifyDialogOpen(true);
          setSelectedBooking(booking);
          break;
        case 'vacation':
          setSelectedBookingForLeave(booking);
          setHolidayDialogOpen(true);
          break;
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(false);
      setConfirmationDialog(prev => ({ ...prev, open: false }));
    }
  };

  // ACTION HANDLERS - BUTTON CLICKS
  const handleCancelClick = (booking: Booking) => {
    showConfirmation(
      'cancel',
      booking,
      'Cancel Booking',
      `Are you sure you want to cancel your ${getServiceTitle(booking.serviceType)} booking? This action cannot be undone.`,
      'warning'
    );
  };

  const handleLeaveReviewClick = (booking: Booking) => {
    setSelectedReviewBooking(booking);
    setReviewDialogVisible(true);
  };

  const closeReviewDialog = () => {
    setReviewDialogVisible(false);
    setSelectedReviewBooking(null);
  };

  const handleReviewSubmitted = (bookingId: number) => {
    setReviewedBookings(prev => [...prev, bookingId]);
    if (customerId !== null) {
      onRefresh();
    }
  };

  const hasReview = (booking: Booking): boolean => {
    return reviewedBookings.includes(booking.id);
  };

  const handleModifyClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setModifyDialogOpen(true);
  };

  const handleVacationClick = (booking: Booking) => {
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  const handleApplyLeaveClick = (booking: Booking) => {
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  // ACTION HANDLERS - API CALLS
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

  const handleSaveModifiedBooking = async (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => {
    if (!selectedBooking) return;

    try {
      setIsRefreshing(true);
      
      // Update local state
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
      setModifyDialogOpen(false);
      setOpenSnackbar(true);
      
      // Refresh data
      if (customerId !== null) {
        await axios
          .get(`https://payments-j5id.onrender.com/api/customers/${customerId}/engagements`)
          .then((response) => {
            const { past = [], ongoing = [], upcoming = [] } = response.data || {};
            setPastBookings(mapBookingData(past));
            setCurrentBookings(mapBookingData(ongoing));
            setFutureBookings(mapBookingData(upcoming));
          });
      }
    } catch (error: any) {
      console.error("Error updating booking:", error);
      if (error.response) {
        console.error("Full error response:", error.response.data);
      }
    }
  };

  const handleLeaveSubmit = async (startDate: string, endDate: string, serviceType: string): Promise<void> => {
    if (!selectedBookingForLeave || !customerId) {
      throw new Error("Missing required information for leave application");
    }

    try {
      setIsRefreshing(true);
      
      await axios.post(
        `https://payments-j5id.onrender.com/api/customer/${customerId}/leaves`,
        {
          engagement_id: selectedBookingForLeave.id,
          leave_start_date: startDate,
          leave_end_date: endDate,
          leave_type: 'VACATION',
        }
      );

      setBookingsWithVacation(prev => [...prev, selectedBookingForLeave.id]);

      // Refresh data
      if (customerId !== null) {
        const response = await axios.get(
          `https://payments-j5id.onrender.com/api/customers/${customerId}/engagements`
        );
        const { past = [], ongoing = [], upcoming = [] } = response.data || {};
        setPastBookings(mapBookingData(past));
        setCurrentBookings(mapBookingData(ongoing));
        setFutureBookings(mapBookingData(upcoming));
      }

      setOpenSnackbar(true);
      setHolidayDialogOpen(false);
    } catch (error) {
      console.error("Error applying leave:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  // DATA PROCESSING
  const upcomingBookings = sortUpcomingBookings([...currentBookings, ...futureBookings]);
  const filteredByStatus = statusFilter === 'ALL' 
    ? upcomingBookings 
    : upcomingBookings.filter(booking => booking.taskStatus === statusFilter);
  const filteredUpcomingBookings = filterBookings(filteredByStatus, searchTerm);
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
   // Define status options for tabs
  const statusTabs = [
    { value: 'ALL', label: 'All', count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: 'Not Started', count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'ACTIVE', label: 'Active', count: upcomingBookings.filter(b => b.taskStatus === 'ACTIVE').length },
    { value: 'IN_PROGRESS', label: 'In Progress', count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Completed', count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
  ];

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
        {/* ACTIVE Status */}
        {item.taskStatus === "ACTIVE" && (
          <>
            {/* Call Provider Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="phone" size={16} color="#000" />
              <Text>Call Provider</Text>
            </Button>

            {/* Message Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>

            {/* Cancel Booking Button - Show for all booking types */}
            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelClick(item)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>

            {/* Modify Booking Button - Show only for MONTHLY bookings */}
            {item.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleModifyClick(item)}
              >
                <Icon name="pencil" size={16} color="#000" />
                <Text>Modify Booking</Text>
              </Button>
            )}

            {/* Add Vacation Button - Show only for MONTHLY bookings */}
            {item.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleVacationClick(item)}
                disabled={hasMatchingHolidayIds(item) || isRefreshing}
              >
                <Text>
                  {hasMatchingHolidayIds(item)
                    ? "Vacation Added"
                    : "Add Vacation"}
                </Text>
              </Button>
            )}
          </>
        )}

        {/* IN_PROGRESS Status */}
        {item.taskStatus === "IN_PROGRESS" && (
          <>
            {/* Call Provider Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="phone" size={16} color="#000" />
              <Text>Call Provider</Text>
            </Button>

            {/* Message Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>

            {/* Cancel Booking Button - Show for all booking types */}
            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelClick(item)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>

            {/* Add Vacation Button - Show only for MONTHLY bookings */}
            {item.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleVacationClick(item)}
                disabled={hasMatchingHolidayIds(item) || isRefreshing}
              >
                <Text>
                  {hasMatchingHolidayIds(item)
                    ? "Vacation Added"
                    : "Add Vacation"}
                </Text>
              </Button>
            )}
          </>
        )}

        {/* NOT_STARTED Status */}
        {item.taskStatus === "NOT_STARTED" && (
          <>
            {/* Call Provider Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="phone" size={16} color="#000" />
              <Text>Call Provider</Text>
            </Button>

            {/* Message Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>

            {/* Cancel Booking Button - Show for all booking types */}
            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelClick(item)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>

            {/* Modify Booking Button - Show only for MONTHLY bookings */}
            {item.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleModifyClick(item)}
              >
                <Icon name="pencil" size={16} color="#000" />
                <Text>Modify Booking</Text>
              </Button>
            )}

            {/* Add Vacation Button - Show only for MONTHLY bookings */}
            {item.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleVacationClick(item)}
                disabled={hasMatchingHolidayIds(item) || isRefreshing}
              >
                <Text>
                  {hasMatchingHolidayIds(item)
                    ? "Vacation Added"
                    : "Add Vacation"}
                </Text>
              </Button>
            )}
          </>
        )}

        {/* COMPLETED Status */}
        {item.taskStatus === "COMPLETED" && (
          <>
            {/* Leave Review Button - Show for all booking types */}
            {hasReview(item) ? (
              <Button
                style={[styles.actionButton, styles.disabledButton]}
                disabled={true}
              >
                <Icon name="check-circle" size={16} color="#000" />
                <Text>Review Submitted</Text>
              </Button>
            ) : (
              <Button
                style={styles.actionButton}
                onPress={() => handleLeaveReviewClick(item)}
              >
                <Icon name="message-text" size={16} color="#000" />
                <Text>Leave Review</Text>
              </Button>
            )}

            {/* Book Again Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Text>Book Again</Text>
            </Button>
          </>
        )}

        {/* CANCELLED Status */}
        {item.taskStatus === "CANCELLED" && (
          <>
            {/* Book Again Button - Show for all booking types */}
            <Button style={styles.actionButton} onPress={() => {}}>
              <Text>Book Again</Text>
            </Button>
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
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[
          'rgba(139, 187, 221, 0.8)', // Blue tone
          'rgba(213, 229, 233, 0.8)', // Lighter blue
          'rgba(255,255,255,1)'       // White at the bottom
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}} // Vertical fade
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage your household service appointments</Text>
        </View>
        <View style={styles.headerRight}>
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
          <TouchableOpacity 
            style={styles.walletButton}
            onPress={() => setWalletDialogOpen(true)}
          >
            <Icon name="wallet" size={24} color="#fff" />
            <Text style={styles.walletText}>Wallet</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
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

          {/* Status Filter Tabs */}
          <View style={styles.statusFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statusTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.statusTab,
                    statusFilter === tab.value && styles.statusTabActive
                  ]}
                  onPress={() => setStatusFilter(tab.value)}
                >
                  <Text style={[
                    styles.statusTabText,
                    statusFilter === tab.value && styles.statusTabTextActive
                  ]}>
                    {tab.label}
                  </Text>
                  <View style={styles.statusTabCount}>
                    <Text style={styles.statusTabCountText}>{tab.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
          <View style={[styles.sectionHeader, styles.pastSectionHeader]}>
            <Icon name="history" size={24} color="#6b7280" />
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Past Bookings</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'booking' : 'bookings'} in history
              </Text>
            </View>
            <Badge style={[styles.sectionBadge, styles.pastBadge]}>
              <Text style={[styles.sectionBadgeText, styles.pastBadgeText]}>{pastBookings.length}</Text>
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
      </ScrollView>

      {/* Dialogs */}
      <UserHoliday 
        open={holidayDialogOpen}
        onClose={() => setHolidayDialogOpen(false)}
        booking={selectedBookingForLeave}
        onLeaveSubmit={handleLeaveSubmit}
      />
      
      <ModifyBookingDialog
        open={modifyDialogOpen}
        onClose={() => setModifyDialogOpen(false)}
        booking={selectedBooking}
        timeSlots={timeSlots}
        onSave={handleSaveModifiedBooking}
        customerId={customerId}
      />

      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.type === 'cancel' ? 'Yes, Cancel' : 'Confirm'}
        loading={actionLoading}
        severity={confirmationDialog.severity}
      />

      <AddReviewDialog
        visible={reviewDialogVisible}
        onClose={closeReviewDialog}
        booking={selectedReviewBooking}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <WalletDialog 
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
      />

      {/* Snackbar for notifications */}
      {openSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Operation completed successfully!</Text>
          <TouchableOpacity onPress={() => setOpenSnackbar(false)}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    margin: 4,
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
    marginHorizontal: 4,
  },
  separatorBase: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },

  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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

  // Header styles
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(14, 48, 92)',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(14, 48, 92, 0.8)',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    marginRight: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  walletButton: {
    backgroundColor: 'rgb(14, 48, 92)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  walletText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },

  // Section styles
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
    fontSize: 14,
    fontWeight: '600',
  },
  pastBadgeText: {
    color: '#6b7280',
  },

  // Status filter styles
  statusFilterContainer: {
    marginBottom: 16,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  statusTabActive: {
    backgroundColor: '#3b82f6',
  },
  statusTabText: {
    color: '#4b5563',
    fontWeight: '500',
    marginRight: 8,
  },
  statusTabTextActive: {
    color: '#fff',
  },
  statusTabCount: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusTabCountText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },

  // Booking card styles
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

  // Empty state styles
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

  // Badge styles
  activeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  activeBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  completedBadgeText: {
    color: '#10b981',
    fontSize: 12,
    marginLeft: 4,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cancelledBadgeText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
  },
  inProgressBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  inProgressBadgeText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  notStartedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  notStartedBadgeText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  onDemandBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  onDemandBadgeText: {
    color: '#8b5cf6',
    fontSize: 12,
  },
  monthlyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  monthlyBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
  },
  shortTermBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  shortTermBadgeText: {
    color: '#10b981',
    fontSize: 12,
  },
  defaultBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  defaultBadgeText: {
    color: '#6b7280',
    fontSize: 12,
  },

  // Snackbar styles
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10b981',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snackbarText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Booking;