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
import axiosInstance from '../services/axiosInstance';
import dayjs from 'dayjs';
import axios from 'axios';

// Import existing components
import UserHoliday from './UserHoliday';
import ModifyBookingDialog from './ModifyBookingDialog';
import VacationManagementDialog from './VacationManagement';

// Import new components
import ConfirmationDialog from './ConfirmationDialog';
import AddReviewDialog from './AddReviewDialog';
import WalletDialog from './WalletDialog';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
// Add this import at the top with other dialog imports
import ServicesDialog from '../ServiceDialogs/ServicesDialog';


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

interface Task {
  taskType: string;
  [key: string]: any;
}

interface Responsibilities {
  tasks: Task[];
  add_ons?: Task[];
}

interface Modification {
  date: string;
  action: string;
  changes?: {
    new_start_date?: string;
    new_end_date?: string;
    new_start_time?: string;
    start_date?: { from: string; to: string };
    end_date?: { from: string; to: string };
    start_time?: { from: string; to: string };
  };
  refund?: number;
  penalty?: number;
}

interface Booking {
  id: number;
  name: string;
  serviceProviderId: number;
  timeSlot: string;
  date: string;
  startDate: string;
  endDate: string;
  start_time: string;
  end_time: string;
  bookingType: string;
  monthlyAmount: number;
  paymentMode: string;
  address: string;
  customerName: string;
  serviceProviderName: string;
  taskStatus: string;
  bookingDate: string;
  engagements: string;
  service_type: string;
  serviceType: string;
  childAge: string;
  experience: string;
  noOfPersons: string;
  mealType: string;
  modifiedDate: string;
  responsibilities: Responsibilities;
  customerHolidays?: CustomerHoliday[];
  hasVacation?: boolean;
  vacationDetails?: {
    leave_type?: string;
    total_days?: number;
    refund_amount?: number;
    leave_end_date?: string;
    leave_start_date?: string;
    end_date?: string;
    start_date?: string;
  };
  modifications: Modification[];
}

const getServiceIcon = (type: string) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'maid':
      return 'broom';
    case 'cleaning':
      return 'broom';
    case 'nanny':
      return 'heart';
    case 'cook':
      return 'chef-hat';
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
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'cook':
      return 'Home Cook';
    case 'maid':
      return 'Maid Service';
    case 'nanny':
      return 'Caregiver Service';
    case 'cleaning':
      return 'Cleaning Service';
    default:
      return 'Home Service';
  }
};

const hasVacation = (booking: Booking): boolean => {
  return booking.hasVacation || false;
};

// NEW: Modification restriction functions from React code
const isModificationTimeAllowed = (startDate: string, timeSlot: string): boolean => {
  const now = dayjs();
  const [time, period] = timeSlot.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const bookingDateTime = dayjs(startDate)
    .set('hour', hours)
    .set('minute', minutes)
    .set('second', 0);
  
  return now.isBefore(bookingDateTime.subtract(30, 'minute'));
};

const isBookingAlreadyModified = (booking: Booking | null): boolean => {
  if (!booking) return false;
  
  const hasExplicitModifications = booking.modifications && 
    booking.modifications.length > 0 && 
    booking.modifications.some(mod => 
      mod.action === "Date Rescheduled" || 
      mod.action === "Time Rescheduled" ||
      mod.action === "Modified" || 
      mod.action?.includes("Modified") ||
      mod.action?.includes("modified") ||
      mod.action === "Rescheduled" ||
      mod.action?.includes("Reschedule")
    );
  
  return !!hasExplicitModifications;
};

const isModificationDisabled = (booking: Booking | null): boolean => {
  if (!booking) return true;
  
  return !isModificationTimeAllowed(booking.startDate, booking.timeSlot) || 
         isBookingAlreadyModified(booking);
};

const getModificationTooltip = (booking: Booking | null): string => {
  if (!booking) return "";
  
  if (isBookingAlreadyModified(booking)) {
    return "This booking has already been modified and cannot be modified again.";
  }
  if (!isModificationTimeAllowed(booking.startDate, booking.timeSlot)) {
    return "Modification is only allowed at least 30 minutes before the scheduled time.";
  }
  return "Modify this booking";
};

// NEW: Get detailed modification information for display
const getModificationDetails = (booking: Booking): string => {
  if (!booking.modifications || booking.modifications.length === 0) return "";
  
  const lastMod = booking.modifications[booking.modifications.length - 1];
  
  if (lastMod.action === "Date Rescheduled" && lastMod.changes) {
    if (lastMod.changes.new_start_date && lastMod.changes.new_end_date) {
      return `Date rescheduled to ${lastMod.changes.new_start_date}`;
    } else if (lastMod.changes.start_date) {
      return `Date changed from ${dayjs(lastMod.changes.start_date.from).format('MMM D, YYYY')} to ${dayjs(lastMod.changes.start_date.to).format('MMM D, YYYY')}`;
    }
  } else if (lastMod.action === "Time Rescheduled" && lastMod.changes) {
    if (lastMod.changes.new_start_time) {
      return `Time rescheduled to ${lastMod.changes.new_start_time}`;
    } else if (lastMod.changes.start_time) {
      return `Time changed from ${lastMod.changes.start_time.from} to ${lastMod.changes.start_time.to}`;
    }
  }
  
  return `Last modified: ${lastMod.action}`;
};

// NEW: Time formatting utilities from React code
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12, 13 to 1, etc.
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if parsing fails
  }
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

const Booking: React.FC = () => {
  // STATE VARIABLES
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
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = useState(false);
  const [selectedBookingForVacationManagement, setSelectedBookingForVacationManagement] = useState<Booking | null>(null);
  // Add this state variable with other state declarations
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Other states
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Review dialog state
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

  // Vacation dialog state
  const [vacationDialogOpen, setVacationDialogOpen] = useState(false);
  const [selectedBookingForVacation, setSelectedBookingForVacation] = useState<Booking | null>(null);

  // AUTH & INITIALIZATION
  const { user: auth0User } = useAuth0();
  const isAuthenticated = auth0User !== undefined && auth0User !== null;
  const { appUser } = useAppUser();

  // Helper function to convert Booking for child components
  const convertBookingForChildComponents = (booking: Booking | null): any => {
    if (!booking) return null;
    
    return {
      ...booking,
      serviceType: booking.serviceType || booking.service_type,
      vacationDetails: booking.vacationDetails ? {
        ...booking.vacationDetails,
        leave_start_date: booking.vacationDetails.leave_start_date || booking.vacationDetails.start_date,
        leave_end_date: booking.vacationDetails.leave_end_date || booking.vacationDetails.end_date,
      } : null
    };
  };

  // DATA FETCHING FUNCTIONS
  useEffect(() => {
    if (isAuthenticated && appUser?.customerid) {
      setIsLoading(true);
      setCustomerId(appUser.customerid);
      fetchBookings(appUser.customerid);
    } else {
      setIsLoading(false);
    }
  }, [appUser, isAuthenticated]);

  // Refresh function from React code
  const refreshBookings = async (id?: string) => {
    const effectiveId = id || customerId;
    if (effectiveId !== null && effectiveId !== undefined) {
      console.log("Fetching bookings for customerId:", effectiveId);

      const response = await PaymentInstance.get(
        `/api/customers/${effectiveId}/engagements`
      );

      const { past = [], ongoing = [], upcoming = [], cancelled = [] } = response.data || {};

      setPastBookings(mapBookingData(past));
      setCurrentBookings(mapBookingData(ongoing));
      setFutureBookings(mapBookingData(upcoming));
    }
  };

  const fetchBookings = async (id: string) => {
    try {
      await refreshBookings(id);
    } catch (error) {
      console.error("Error fetching booking details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Improved mapBookingData function with modifications support
  const mapBookingData = (data: any[]) => {
    return Array.isArray(data)
      ? data.map((item) => {
          const hasVacation = item?.vacation?.leave_days > 0;
          const serviceType = item.service_type?.toLowerCase() || item.serviceType?.toLowerCase() || 'other';
          const modifications = item.modifications || [];
          const hasModifications = modifications.length > 0;

          // Use the current dates from API (which should reflect modifications)
          const effectiveStartDate = item.start_date;
          const effectiveEndDate = item.end_date;

          return {
            id: item.engagement_id,
            customerId: item.customerId,
            serviceProviderId: item.serviceProviderId,
            name: item.customerName,
            timeSlot: item.start_time,
            date: effectiveStartDate,
            startDate: effectiveStartDate,
            endDate: effectiveEndDate,
            start_time: item.start_time,
            end_time: item.end_time,
            bookingType: item.booking_type,
            monthlyAmount: item.monthlyAmount,
            paymentMode: item.paymentMode,
            address: item.address || 'No address specified',
            customerName: item.customerName,
            serviceProviderName: item.serviceProviderName === "undefined undefined" ? "Not Assigned" : item.serviceProviderName,
            taskStatus: item.task_status,
            engagements: item.engagements,
            bookingDate: item.created_at,
            service_type: serviceType,
            serviceType: serviceType,
            childAge: item.childAge,
            experience: item.experience,
            noOfPersons: item.noOfPersons,
            mealType: item.mealType,
            modifiedDate: hasModifications
              ? modifications[modifications.length - 1]?.date || item.created_at
              : item.created_at,
            responsibilities: item.responsibilities,
            customerHolidays: item.customerHolidays || [],
            hasVacation: hasVacation,
            vacationDetails: hasVacation && item.vacation?.leave_days > 0 
              ? {
                  ...item.vacation,
                  leave_start_date: item.vacation.start_date || item.vacation.leave_start_date,
                  leave_end_date: item.vacation.end_date || item.vacation.leave_end_date,
                }
              : null,
            modifications: modifications
          };
        })
      : [];
  };

  // FILTER & SORT FUNCTIONS
  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term) return bookings;
    
    return bookings.filter(booking => 
      getServiceTitle(booking?.service_type).toLowerCase().includes(term?.toLowerCase()) ||
      booking.serviceProviderName?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.address?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.bookingType?.toLowerCase().includes(term?.toLowerCase())
    );
  };

  const sortUpcomingBookings = (bookings: Booking[]): Booking[] => {
    const statusOrder: Record<string, number> = {
      'NOT_STARTED': 2,
      'IN_PROGRESS': 1,
      'COMPLETED': 3,
      'CANCELLED': 4
    };

    return [...bookings].sort((a, b) => {
      const statusComparison = statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  };

  // Improved refresh function
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (customerId !== null) {
        await refreshBookings();
      }
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Vacation success handler from React code
  const handleVacationSuccess = async () => {
    setOpenSnackbar(true);
    await refreshBookings();
  };

  // NEW: Handle modify vacation click from React code
  const handleModifyVacationClick = (booking: Booking) => {
    setSelectedBookingForVacationManagement(booking);
    setVacationManagementDialogOpen(true);
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
      `Are you sure you want to cancel your ${getServiceTitle(booking.service_type)} booking? This action cannot be undone.`,
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

  // Improved cancel booking with PaymentInstance
  const handleCancelBooking = async (booking: Booking) => {
    try {
      setActionLoading(true);
      
      const response = await PaymentInstance.put(
        `/api/engagements/${booking.id}`,
        {
          task_status: "CANCELLED"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh bookings after cancellation
      await refreshBookings();
      setOpenSnackbar(true);
      
    } catch (error: any) {
      console.error("Error cancelling engagement:", error);
      // Fallback update local state
      setCurrentBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b
        )
      );
      setFutureBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Improved modify booking handling
  const handleSaveModifiedBooking = async (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => {
    setModifyDialogOpen(false);
  };

  // Improved leave submit with PaymentInstance
  const handleLeaveSubmit = async (startDate: string, endDate: string, service_type: string): Promise<void> => {
    if (!selectedBookingForLeave || !customerId) {
      throw new Error("Missing required information for leave application");
    }

    try {
      setIsRefreshing(true);
      
      await PaymentInstance.put(
        `api/engagements/${selectedBookingForLeave.id}`,
        {
          modified_by_role: appUser?.role || 'CUSTOMER',
          vacation_start_date: startDate,
          vacation_end_date: endDate,
          modified_by_id: customerId,
        }
      );

      setBookingsWithVacation(prev => [...prev, selectedBookingForLeave.id]);

      // Refresh bookings after applying leave
      await refreshBookings();
      setOpenSnackbar(true);
      setHolidayDialogOpen(false);
    } catch (error) {
      console.error("Error applying leave:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Improved renderActionButtons function from React code
  const renderActionButtons = (booking: Booking) => {
    const modificationDisabled = isModificationDisabled(booking);
    const modificationTooltip = getModificationTooltip(booking);
    const hasExistingVacation = hasVacation(booking);

    switch (booking.taskStatus) {
      case 'NOT_STARTED':
        return (
          <>
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="phone" size={16} color="#000" />
              <Text>Call Provider</Text>
            </Button>

            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>

            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelClick(booking)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>

            {booking.bookingType === "MONTHLY" && (
              <Button
                style={styles.actionButton}
                onPress={() => handleModifyClick(booking)}
                disabled={modificationDisabled}
              >
                <Icon name="pencil" size={16} color="#000" />
                <Text>{modificationDisabled ? "Modify (Unavailable)" : "Modify Booking"}</Text>
              </Button>
            )}

            {booking.bookingType === "MONTHLY" && (
              <>
                {hasExistingVacation ? (
                  <Button
                    style={[styles.actionButton, styles.vacationModifiedButton]}
                    onPress={() => handleModifyVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="pencil" size={16} color="#1e40af" />
                    <Text style={styles.vacationModifiedText}>Modify Vacation</Text>
                  </Button>
                ) : (
                  <Button
                    style={styles.actionButton}
                    onPress={() => handleVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="calendar" size={16} color="#000" />
                    <Text>Add Vacation</Text>
                  </Button>
                )}
              </>
            )}
          </>
        );

      case 'IN_PROGRESS':
        return (
          <>
            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="phone" size={16} color="#000" />
              <Text>Call Provider</Text>
            </Button>

            <Button style={styles.actionButton} onPress={() => {}}>
              <Icon name="message-text" size={16} color="#000" />
              <Text>Message</Text>
            </Button>

            <Button 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelClick(booking)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Button>

            {booking.bookingType === "MONTHLY" && (
              <>
                {hasExistingVacation ? (
                  <Button
                    style={[styles.actionButton, styles.vacationModifiedButton]}
                    onPress={() => handleModifyVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="pencil" size={16} color="#1e40af" />
                    <Text style={styles.vacationModifiedText}>Modify Vacation</Text>
                  </Button>
                ) : (
                  <Button
                    style={styles.actionButton}
                    onPress={() => handleVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="calendar" size={16} color="#000" />
                    <Text>Add Vacation</Text>
                  </Button>
                )}
              </>
            )}
          </>
        );

      case 'COMPLETED':
        return (
          <>
            {hasReview(booking) ? (
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
                onPress={() => handleLeaveReviewClick(booking)}
              >
                <Icon name="message-text" size={16} color="#000" />
                <Text>Leave Review</Text>
              </Button>
            )}

            <Button style={styles.actionButton} onPress={() => {}}>
              <Text>Book Again</Text>
            </Button>
          </>
        );

      case 'CANCELLED':
        return (
          <Button style={styles.actionButton} onPress={() => {}}>
            <Text>Book Again</Text>
          </Button>
        );

      default:
        return null;
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

  // Define status options for tabs - UPDATED to match React version
  const statusTabs = [
    { value: 'ALL', label: 'All', count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: 'Not Started', count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'IN_PROGRESS', label: 'In Progress', count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Completed', count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
  ];

  // Improved renderBookingItem with new action buttons logic
  const renderBookingItem = ({ item }: { item: Booking }) => {
    const serviceType = item.serviceType || item.service_type;
    const hasModifications = item.modifications && item.modifications.length > 0;
    const modificationDetails = getModificationDetails(item);
    
    return (
      <Card style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Icon 
              name={getServiceIcon(serviceType)} 
              size={24} 
              color={
                serviceType === 'maid' ? '#f97316' : 
                serviceType === 'cleaning' ? '#ec4899' : 
                serviceType === 'nanny' ? '#ef4444' : '#000'
              } 
            />
            <View>
              <Text style={styles.serviceTitle}>{getServiceTitle(serviceType)}</Text>
              <Text style={styles.bookingId}>Booking #{item.id}</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            {getBookingTypeBadge(item.bookingType)}
            {getStatusBadge(item.taskStatus)}
            {hasModifications && (
              <Badge style={styles.modifiedBadge}>
                <Text style={styles.modifiedBadgeText}>Modified</Text>
              </Badge>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Icon name="calendar" size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {formatDate(item.date)}
                {hasModifications && (
                  <Text style={styles.rescheduledText}> (Rescheduled)</Text>
                )}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="clock" size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {formatTimeRange(item.start_time, item.end_time)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={18} color="#6b7280" />
              <Text style={styles.detailText}>{item.address}</Text>
            </View>

            {/* Show modification details if available */}
            {modificationDetails ? (
              <View style={styles.modificationDetails}>
                <Text style={styles.modificationText}>{modificationDetails}</Text>
              </View>
            ) : null}
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
          
          {item.responsibilities && (
            <View style={styles.responsibilitiesContainer}>
              <Text style={styles.responsibilitiesTitle}>Responsibilities:</Text>
              <View style={styles.responsibilitiesList}>
                {[
                  ...(item.responsibilities.tasks || []).map(task => ({ task, isAddon: false })),
                  ...(item.responsibilities.add_ons || []).map(task => ({ task, isAddon: true })),
                ].map((item: any, index: number) => {
                  const { task, isAddon } = item;

                  const taskLabel =
                    typeof task === "object" && task !== null
                      ? Object.entries(task)
                          .filter(([key]) => key !== "taskType")
                          .map(([key, value]) => `${value} ${key}`)
                          .join(", ")
                      : "";

                  const taskName = typeof task === "object" ? task.taskType : task;

                  return (
                    <View key={index} style={styles.responsibilityBadge}>
                      <Text style={styles.responsibilityText}>
                        {isAddon ? "Add-ons - " : ""}
                        {taskName} {taskLabel && `- ${taskLabel}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <Separator style={styles.separator} />

        <View style={styles.actionButtons}>
          {renderActionButtons(item)}
        </View>
      </Card>
    );
  };

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
              {/* Update the empty state button in the upcoming bookings section */}
              <Button 
                style={styles.emptyStateButton}
                onPress={() => setServicesDialogOpen(true)}
              >
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
        booking={convertBookingForChildComponents(selectedBookingForLeave)}
        onLeaveSubmit={handleLeaveSubmit}
      />
      
      <VacationManagementDialog
        open={vacationManagementDialogOpen}
        onClose={() => {
          setVacationManagementDialogOpen(false);
          setSelectedBookingForVacationManagement(null);
        }}
        booking={convertBookingForChildComponents(selectedBookingForVacationManagement)}
        customerId={customerId}
        onSuccess={handleVacationSuccess}
      />

      <ModifyBookingDialog
        open={modifyDialogOpen}
        onClose={() => setModifyDialogOpen(false)}
        booking={convertBookingForChildComponents(selectedBooking)}
        timeSlots={timeSlots}
        onSave={handleSaveModifiedBooking}
        customerId={customerId}
        refreshBookings={refreshBookings}
        setOpenSnackbar={setOpenSnackbar}
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
        booking={convertBookingForChildComponents(selectedReviewBooking)}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <WalletDialog 
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
      />

      {/* Add the ServicesDialog component with other dialog components at the bottom */}
      <ServicesDialog
        open={servicesDialogOpen}
        onClose={() => setServicesDialogOpen(false)}
        onServiceSelect={(serviceType) => {
          // Handle service selection
          console.log('Selected service type:', serviceType);
          // You can navigate to booking form or handle the selection
          // Example: navigation.navigate('BookingForm', { serviceType });
        }}
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

// Updated Styles with new styles for modification features
const styles = StyleSheet.create({
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
  vacationModifiedButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  vacationModifiedText: {
    color: '#1e40af',
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
  modifiedBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  modifiedBadgeText: {
    color: '#ca8a04',
    fontSize: 12,
  },
  responsibilitiesContainer: {
    marginTop: 12,
  },
  responsibilitiesTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  responsibilityBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  responsibilityText: {
    fontSize: 12,
    color: '#4b5563',
  },
  modificationDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  modificationText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  rescheduledText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
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