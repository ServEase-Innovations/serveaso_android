import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import axiosInstance from './axiosInstance';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';

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
  responsibilities: string;
}

// Helper function to format price in Indian Rupees
const formatPrice = (amount: number) => {
  return '₹' + amount.toLocaleString('en-IN');
};

const getServiceIcon = (type: string) => {
  switch (type) {
    case 'maid':
      return <Icon name="broom" size={20} color="#f97316" />;
    case 'cleaning':
      return <Icon name="broom" size={20} color="#ec4899" />;
    case 'nanny':
      return <Icon name="heart" size={20} color="#ef4444" />;
    default:
      return <Icon name="chef-hat" size={20} color="#000" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(24, 119, 242, 0.1)', borderColor: 'rgba(24, 119, 242, 0.2)' }]}>
          <Icon name="alert-circle" size={12} color="#1877f2" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#1877f2' }]}>Active</Text>
        </View>
      );
    case 'COMPLETED':
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.2)' }]}>
          <Icon name="check-circle" size={12} color="#4ade80" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#4ade80' }]}>Completed</Text>
        </View>
      );
    case 'CANCELLED':
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <Icon name="close-circle" size={12} color="#ef4444" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#ef4444' }]}>Cancelled</Text>
        </View>
      );
    case 'IN_PROGRESS':
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(163, 163, 163, 0.5)', borderColor: '#a3a3a3' }]}>
          <Icon name="clock" size={12} color="#525252" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#525252' }]}>In Progress</Text>
        </View>
      );
    case 'NOT_STARTED':
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(163, 163, 163, 0.5)', borderColor: '#a3a3a3' }]}>
          <Icon name="clock" size={12} color="#525252" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#525252' }]}>Not Started</Text>
        </View>
      );
    default:
      return null;
  }
};

const getBookingTypeBadge = (type: string) => {
  switch (type) {
    case 'ON_DEMAND':
      return (
        <View style={[styles.badgeOutline, { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' }]}>
          <Text style={[styles.badgeOutlineText, { color: '#6b21a8' }]}>On Demand</Text>
        </View>
      );
    case 'MONTHLY':
      return (
        <View style={[styles.badgeOutline, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
          <Text style={[styles.badgeOutlineText, { color: '#1e40af' }]}>Monthly</Text>
        </View>
      );
    case 'SHORT_TERM':
      return (
        <View style={[styles.badgeOutline, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
          <Text style={[styles.badgeOutlineText, { color: '#166534' }]}>Short Term</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.badgeOutline, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]}>
          <Text style={[styles.badgeOutlineText, { color: '#374151' }]}>{type}</Text>
        </View>
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  const [customerId] = useState<number>(1); // Hardcoded customer ID

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
        `${(i + 6).toString().padStart(2, "0")}:00`
      );

      const processedSlots = engagementData.map((entry: any) => {
        const uniqueAvailableTimeSlots = Array.from(new Set(entry.availableTimeSlots)).sort();
        const missingTimeSlots = fullTimeSlots.filter(slot => !uniqueAvailableTimeSlots.includes(slot));

        return {
          id: entry.id,
          uniqueAvailableTimeSlots,
          missingTimeSlots,
        };
      });

      const uniqueMissingSlots: string[] = Array.from(
        new Set(processedSlots.flatMap((slot: any) => slot.missingTimeSlots))
      ).sort() as string[];

      setUniqueMissingSlots(uniqueMissingSlots);

      return fullTimeSlots.filter(slot => !uniqueMissingSlots.includes(slot));
    } catch (error) {
      console.error("Error fetching engagement data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const page = 0;
        const size = 100;
        const response = await axiosInstance.get(
          `api/serviceproviders/get-sp-booking-history?customerId=${customerId}&page=${page}&size=${size}`
        );

        const { past = [], current = [], future = [] } = response.data || {};
        
        const mapBookingData = (data: any[]) =>
          Array.isArray(data)
            ? data.map((item) => ({
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
                responsibilities: item.responsibilities,
              }))
            : [];

        setPastBookings(mapBookingData(past));
        setCurrentBookings(mapBookingData(current));
        setFutureBookings(mapBookingData(future));
      } catch (error) {
        console.error("Error fetching booking details:", error);
        Alert.alert("Error", "Failed to load bookings");
      }
    };

    fetchBookings();
  }, [customerId]);

  const handleModifyBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedTimeSlot(booking.timeSlot);

    const availableSlots = await generateTimeSlots(booking.serviceProviderId);
    setTimeSlots(availableSlots);

    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const handleTimeSlotChange = (value: string) => {
    setSelectedTimeSlot(value);
  };

  const handleSave = async () => {
    if (selectedBooking && selectedTimeSlot) {
      try {
        const updatePayload = {
          id: selectedBooking.id,
          serviceProviderId: selectedBooking.serviceProviderId,
          customerId: customerId,
          startDate: selectedBooking.startDate,
          endDate: selectedBooking.endDate,
          engagements: selectedBooking.engagements,
          timeslot: selectedTimeSlot,
          monthlyAmount: selectedBooking.monthlyAmount,
          paymentMode: selectedBooking.paymentMode,
          bookingType: selectedBooking.bookingType,
          bookingDate: selectedBooking.bookingDate,
          responsibilities: selectedBooking.responsibilities,
          serviceType: selectedBooking.serviceType,
          mealType: selectedBooking.mealType,
          noOfPersons: selectedBooking.noOfPersons,
          experience: selectedBooking.experience,
          childAge: selectedBooking.childAge,
          customerName: selectedBooking.customerName,
          serviceProviderName: selectedBooking.serviceProviderName,
          address: selectedBooking.address,
          taskStatus: selectedBooking.taskStatus,
        };

        await axiosInstance.put(
          `/api/serviceproviders/update/engagement/${selectedBooking.id}`,
          updatePayload
        );

        setCurrentBookings(prev =>
          prev.map(b => b.id === selectedBooking.id ? { ...b, timeSlot: selectedTimeSlot } : b)
        );
        setFutureBookings(prev =>
          prev.map(b => b.id === selectedBooking.id ? { ...b, timeSlot: selectedTimeSlot } : b)
        );

        setOpenDialog(false);
        setSelectedBooking(null);
        setOpenSnackbar(true);
        Alert.alert("Success", "Booking updated successfully!");
      } catch (error) {
        console.error("Error updating booking:", error);
        Alert.alert("Error", "Failed to update booking");
      }
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      const updatedStatus = "CANCELLED";
      const updatePayload = {
        id: booking.id,
        customerId: customerId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        engagements: booking.engagements,
        timeslot: booking.timeSlot,
        monthlyAmount: booking.monthlyAmount,
        paymentMode: booking.paymentMode,
        bookingType: booking.bookingType,
        bookingDate: booking.bookingDate,
        responsibilities: booking.responsibilities,
        serviceType: booking.serviceType.toUpperCase(),
        mealType: booking.mealType,
        noOfPersons: booking.noOfPersons,
        experience: booking.experience,
        childAge: booking.childAge,
        customerName: booking.customerName,
        address: booking.address,
        taskStatus: updatedStatus,
        ...(booking.bookingType !== "ON_DEMAND" && {
          serviceProviderId: booking.serviceProviderId,
          serviceProviderName: booking.serviceProviderName
        })
      };

      await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );

      setCurrentBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, taskStatus: updatedStatus } : b)
      );
      setFutureBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, taskStatus: updatedStatus } : b)
      );

      setOpenSnackbar(true);
      Alert.alert("Success", "Booking cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", "Failed to cancel booking");
    }
  };

  const handleLeaveSubmit = async (startDate: string, endDate: string) => {
    try {
      await axiosInstance.post('/api/customer/add-customer-holiday', {
        customerId: customerId,
        startDate: startDate,
        endDate: endDate
      });
      setOpenSnackbar(true);
      Alert.alert("Success", "Leave application submitted successfully!");
    } catch (error) {
      console.error("Error applying leave:", error);
      Alert.alert("Error", "Failed to submit leave application");
    }
  };

  const handleApplyLeaveClick = (booking: Booking) => {
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  const upcomingBookings = [...currentBookings, ...futureBookings].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your household service appointments</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="alert-circle" size={24} color="#1877f2" />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
              <Text style={styles.sectionSubtitle}>
                {upcomingBookings.length} {upcomingBookings.length === 1 ? 'booking' : 'bookings'} scheduled
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(24, 119, 242, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#1877f2' }]}>{upcomingBookings.length}</Text>
            </View>
          </View>
          
          {upcomingBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View style={styles.bookingTitleContainer}>
                      {getServiceIcon(booking.serviceType)}
                      <View style={styles.bookingTitleText}>
                        <Text style={styles.bookingTitle}>{getServiceTitle(booking.serviceType)}</Text>
                        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                      </View>
                    </View>
                    <View style={styles.badgeContainer}>
                      {getBookingTypeBadge(booking.bookingType)}
                      {getStatusBadge(booking.taskStatus)}
                    </View>
                  </View>
                  
                  <View style={styles.bookingCardContent}>
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDetailColumn}>
                        <View style={styles.detailRow}>
                          <Icon name="calendar" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Icon name="clock" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{booking.timeSlot}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Icon name="map-marker" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{booking.address}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.bookingDetailColumn}>
                        <View>
                          <Text style={styles.providerName}>{booking.serviceProviderName}</Text>
                          <View style={styles.ratingContainer}>
                            <Icon name="star" size={16} color="#f59e0b" />
                            <Text style={styles.ratingText}>{4.5}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>{formatPrice(booking.monthlyAmount)}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.separator} />
                    
                    <View style={styles.actionButtons}>
                      {booking.taskStatus === 'CANCELLED' ? (
                        <TouchableOpacity style={styles.actionButton}>
                          <Text style={styles.actionButtonText}>Book Again</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity style={styles.actionButton}>
                            <Icon name="phone" size={16} color="#000" style={styles.buttonIcon} />
                            <Text style={styles.actionButtonText}>Call Provider</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionButton}>
                            <Icon name="message" size={16} color="#000" style={styles.buttonIcon} />
                            <Text style={styles.actionButtonText}>Message</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleApplyLeaveClick(booking)}
                          >
                            <Icon name="calendar" size={16} color="#000" style={styles.buttonIcon} />
                            <Text style={styles.actionButtonText}>Apply Holiday</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleCancelBooking(booking)}
                          >
                            <Icon name="close-circle" size={16} color="#ef4444" style={styles.buttonIcon} />
                            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Booking</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleModifyBooking(booking)}
                          >
                            <Icon name="pencil" size={16} color="#000" style={styles.buttonIcon} />
                            <Text style={styles.actionButtonText}>Modify Booking</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="calendar" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Upcoming Bookings</Text>
              <Text style={styles.emptyStateText}>Ready to book your next service?</Text>
              <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book a Service</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderLeftColor: '#9ca3af' }]}>
            <Icon name="history" size={24} color="#6b7280" />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Past Bookings</Text>
              <Text style={styles.sectionSubtitle}>
                {pastBookings.length} {pastBookings.length === 1 ? 'booking' : 'bookings'} in history
              </Text>
            </View>
            <View style={[styles.badgeOutline, { borderColor: '#9ca3af' }]}>
              <Text style={[styles.badgeOutlineText, { color: '#6b7280' }]}>{pastBookings.length}</Text>
            </View>
          </View>
          
          {pastBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {pastBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View style={styles.bookingTitleContainer}>
                      {getServiceIcon(booking.serviceType)}
                      <View style={styles.bookingTitleText}>
                        <Text style={styles.bookingTitle}>{getServiceTitle(booking.serviceType)}</Text>
                        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                      </View>
                    </View>
                    <View style={styles.badgeContainer}>
                      {getBookingTypeBadge(booking.bookingType)}
                      {getStatusBadge(booking.taskStatus)}
                    </View>
                  </View>
                  
                  <View style={styles.bookingCardContent}>
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDetailColumn}>
                        <View style={styles.detailRow}>
                          <Icon name="calendar" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Icon name="clock" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{booking.startDate} ({booking.endDate})</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Icon name="map-marker" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{booking.address}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.bookingDetailColumn}>
                        <View>
                          <Text style={styles.providerName}>{booking.serviceProviderName}</Text>
                          <View style={styles.ratingContainer}>
                            <Icon name="star" size={16} color="#f59e0b" />
                            <Text style={styles.ratingText}>{4.5}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>{formatPrice(booking.monthlyAmount)}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.separator} />
                    
                    <View style={styles.actionButtons}>
                      {booking.taskStatus === 'COMPLETED' && (
                        <TouchableOpacity style={styles.actionButton}>
                          <Icon name="star" size={16} color="#000" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>Rate Service</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Book Again</Text>
                      </TouchableOpacity>
                      {booking.taskStatus === 'COMPLETED' && (
                        <TouchableOpacity style={styles.actionButton}>
                          <Icon name="message" size={16} color="#000" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>Leave Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="clock" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Past Bookings</Text>
              <Text style={styles.emptyStateText}>Your completed and cancelled bookings will appear here.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={openDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={handleDialogClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Booking</Text>
            
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Time Slot:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTimeSlot}
                  onValueChange={handleTimeSlotChange}
                >
                  {timeSlots.map((slot) => (
                    <Picker.Item key={slot} label={slot} value={slot} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleDialogClose}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {openSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Operation completed successfully!</Text>
          <TouchableOpacity onPress={() => setOpenSnackbar(false)}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1877f2',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2',
    marginBottom: 16,
  },
  sectionHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeOutline: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeOutlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
  },
  bookingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookingTitleText: {
    gap: 2,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookingCardContent: {
    padding: 16,
    gap: 16,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingDetailColumn: {
    flex: 1,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1877f2',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  cancelButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookButton: {
    backgroundColor: '#1877f2',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#1877f2',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default Booking;