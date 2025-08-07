import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calendar, Clock, MapPin, Phone, MessageCircle, Star, CheckCircle, XCircle, AlertCircle, History, Edit } from 'lucide-react-native';
import axiosInstance from './axiosInstance';
import UserHoliday from './UserHoliday';
import ModifyBookingDialog from './ModifyBookingDialog';
import dayjs from 'dayjs';

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
  providerRating?: number; // Added optional providerRating property
}

const getServiceIcon = (type: string) => {
  switch (type) {
    case 'maid':
      return '🧹';
    case 'cleaning':
      return '🧹';
    case 'nanny':
      return '❤️';
    default:
      return '👩‍🍳';
  }
};

const getStatusBadge = (status: string) => {
  console.log("Status:", status);
  switch (status) {
    case 'ACTIVE':
      return (
        <View style={[styles.badge, styles.activeBadge]}>
          <AlertCircle size={12} color="#3b82f6" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, styles.activeText]}>Active</Text>
        </View>
      );
    case 'COMPLETED':
      return (
        <View style={[styles.badge, styles.completedBadge]}>
          <CheckCircle size={12} color="#10b981" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, styles.completedText]}>Completed</Text>
        </View>
      );
    case 'CANCELLED':
      return (
        <View style={[styles.badge, styles.cancelledBadge]}>
          <XCircle size={12} color="#ef4444" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, styles.cancelledText]}>Cancelled</Text>
        </View>
      );
    case 'IN_PROGRESS':
      return (
        <View style={[styles.badge, styles.inProgressBadge]}>
          <Clock size={12} color="#64748b" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, styles.inProgressText]}>In Progress</Text>
        </View>
      );
    case 'NOT_STARTED':
      return (
        <View style={[styles.badge, styles.notStartedBadge]}>
          <Clock size={12} color="#64748b" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, styles.notStartedText]}>NOT_STARTED</Text>
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
        <View style={[styles.typeBadge, styles.onDemandBadge]}>
          <Text style={[styles.typeBadgeText, styles.onDemandText]}>On Demand</Text>
        </View>
      );
    case 'MONTHLY':
      return (
        <View style={[styles.typeBadge, styles.monthlyBadge]}>
          <Text style={[styles.typeBadgeText, styles.monthlyText]}>Monthly</Text>
        </View>
      );
    case 'SHORT_TERM':
      return (
        <View style={[styles.typeBadge, styles.shortTermBadge]}>
          <Text style={[styles.typeBadgeText, styles.shortTermText]}>Short Term</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.typeBadge, styles.defaultBadge]}>
          <Text style={[styles.typeBadgeText, styles.defaultText]}>{type}</Text>
        </View>
      );
  }
};

const getServiceTitle = (type: string) => {
  switch (type) {
    case 'cook':
      return 'Home Cook';
    case 'maid':
      return 'Maid';
    case 'nanny':
      return 'Caregiver';
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
  // const [customerId] = useState<number>(1); // Fixed customer ID
  const [searchTerm, setSearchTerm] = useState('');

   const customerId = 1;

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
          `api/serviceproviders/get-sp-booking-history?page=${page}&size=${size}`
        );

        const { past = [], current = [], future = [] } = response.data || {};

        const mapBookingData = (data: any[]): Booking[] => {
          if (!Array.isArray(data)) return [];
          
          return data
            .filter((item) => item.customerId === customerId)
            .map((item) => ({
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
              serviceProviderName: item.serviceProviderName === "undefined undefined" 
                ? "Not Assigned" 
                : item.serviceProviderName,
              taskStatus: item.taskStatus,
              engagements: item.engagements,
              bookingDate: item.bookingDate,
              serviceType: item.serviceType?.toLowerCase() || 'other',
              childAge: item.childAge,
              experience: item.experience,
              noOfPersons: item.noOfPersons,
              mealType: item.mealType,
              responsibilities: item.responsibilities,
              providerRating: item.providerRating || 4.5 // Default rating if not provided
            }));
        };

        setPastBookings(mapBookingData(past));
        setCurrentBookings(mapBookingData(current));
        setFutureBookings(mapBookingData(future));
      } catch (error) {
        console.error("Error fetching booking details:", error);
      }
    };

    fetchBookings();
  }, []); 
  
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
      id: selectedBooking.id,
      customerId: customerId,
      startDate: updatedData.startDate,
      endDate: updatedData.endDate,
      engagements: selectedBooking.engagements,
      timeslot: updatedData.timeSlot,
      monthlyAmount: selectedBooking.monthlyAmount,
      paymentMode: selectedBooking.paymentMode,
      bookingType: selectedBooking.bookingType,
      bookingDate: selectedBooking.bookingDate,
      responsibilities: selectedBooking.responsibilities,
      serviceType: serviceTypeUpperCase,
      mealType: selectedBooking.mealType,
      noOfPersons: selectedBooking.noOfPersons,
      experience: selectedBooking.experience,
      childAge: selectedBooking.childAge,
      customerName: selectedBooking.customerName,
      address: selectedBooking.address,
      taskStatus: selectedBooking.taskStatus,
      role: "CUSTOMER",
    };

    if (selectedBooking.bookingType !== "ON_DEMAND") {
      updatePayload.serviceProviderId = selectedBooking.serviceProviderId;
      updatePayload.serviceProviderName = selectedBooking.serviceProviderName;
    }

    updatePayload = removeNullFields(updatePayload);

    try {
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

      setOpenDialog(false);
      setOpenSnackbar(true);
    } catch (error: any) {
      console.error("Error updating booking:", error);
      if (error.response) {
        console.error("Full error response:", error.response.data);
      }
    }
  };

  const isModificationAllowed = (startDate: string) => {
    const today = dayjs();
    const bookingStartDate = dayjs(startDate);
    const daysDifference = bookingStartDate.diff(today, 'day');
    return daysDifference >= 2;
  };

  const removeNullFields = (obj: any) =>
    Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
    );

  const handleCancelBooking = async (booking: Booking) => {
    const updatedStatus = "CANCELLED";
    const serviceTypeUpperCase = booking.serviceType.toUpperCase();

    let updatePayload: any = {
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
      serviceType: serviceTypeUpperCase,
      mealType: booking.mealType,
      noOfPersons: booking.noOfPersons,
      experience: booking.experience,
      childAge: booking.childAge,
      customerName: booking.customerName,
      address: booking.address,
      taskStatus: updatedStatus,
      role: "CUSTOMER"
    };

    if (booking.bookingType !== "ON_DEMAND") {
      updatePayload.serviceProviderId = booking.serviceProviderId;
      updatePayload.serviceProviderName = booking.serviceProviderName;
    }

    updatePayload = removeNullFields(updatePayload);

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
      getServiceTitle(booking.serviceType).toLowerCase().includes(term.toLowerCase()) ||
      booking.serviceProviderName.toLowerCase().includes(term.toLowerCase()) ||
      booking.address.toLowerCase().includes(term.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(term.toLowerCase())
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage your household service appointments</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3afff"
          />
          {searchTerm && (
            <TouchableOpacity
              onPress={() => setSearchTerm('')}
              style={styles.clearSearchButton}
            >
              <XCircle size={20} color="#07090dff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={24} color="#3b82f6" />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? 'booking' : 'bookings'} scheduled
            </Text>
          </View>
          <View style={[styles.badge, styles.countBadge]}>
            <Text style={styles.countText}>{upcomingBookings.length}</Text>
          </View>
        </View>

        {upcomingBookings.length > 0 ? (
          <View style={styles.bookingList}>
            {filteredUpcomingBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingTitleContainer}>
                    <Text style={styles.serviceIcon}>{getServiceIcon(booking.serviceType)}</Text>
                    <View>
                      <Text style={styles.bookingTitle}>{getServiceTitle(booking.serviceType)}</Text>
                      <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingHeaderRight}>
                    <View style={styles.badgeRow}>
                      {getBookingTypeBadge(booking.bookingType)}
                      {getStatusBadge(booking.taskStatus)}
                    </View>
                    <Text style={styles.bookingDate}>
                      Booking Date: {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingContent}>
                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{booking.timeSlot}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{booking.address}</Text>
                    </View>
                  </View>

                  <View style={styles.providerInfo}>
                    <View>
                      <Text style={styles.providerName}>{booking.serviceProviderName}</Text>
                      <View style={styles.ratingContainer}>
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                        <Text style={styles.ratingText}>{booking['providerRating'] || 4.5}</Text>
                      </View>
                    </View>
                    <Text style={styles.priceText}>₹{booking.monthlyAmount}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.bookingActions}>
                  {booking.taskStatus === 'CANCELLED' ? (
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Book Again</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {booking.address && (
                        <TouchableOpacity style={styles.actionButton}>
                          <Phone size={16} color="#3b82f6" style={styles.actionIcon} />
                          <Text style={styles.actionButtonText}>Call Provider</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionButton}>
                        <MessageCircle size={16} color="#3b82f6" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Message</Text>
                      </TouchableOpacity>
                      {booking.bookingType !== 'ON_DEMAND' && booking.bookingType !== 'SHORT_TERM' && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleApplyLeaveClick(booking)}
                        >
                          <Text style={styles.actionButtonText}>Add Vaccation</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelBooking(booking)}
                      >
                        <XCircle size={16} color="#ef4444" style={styles.actionIcon} />
                        <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Booking</Text>
                      </TouchableOpacity>
                      {isModificationAllowed(booking.startDate) && booking.bookingType === 'MONTHLY' && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleModifyBooking(booking)}
                        >
                          <Edit size={16} color="#3b82f6" style={styles.actionIcon} />
                          <Text style={styles.actionButtonText}>Modify Booking</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Upcoming Bookings</Text>
            <Text style={styles.emptyStateText}>Ready to book your next service?</Text>
            <TouchableOpacity style={styles.bookServiceButton}>
              <Text style={styles.bookServiceButtonText}>Book a Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Past Bookings */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, styles.pastSectionHeader]}>
          <History size={24} color="#9ca3af" />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Past Bookings</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'booking' : 'bookings'} in history
            </Text>
          </View>
          <View style={[styles.badge, styles.pastCountBadge]}>
            <Text style={styles.countText}>{pastBookings.length}</Text>
          </View>
        </View>

        {pastBookings.length > 0 ? (
          <View style={styles.bookingList}>
            {filteredPastBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingTitleContainer}>
                    <Text style={styles.serviceIcon}>{getServiceIcon(booking.serviceType)}</Text>
                    <View>
                      <Text style={styles.bookingTitle}>{getServiceTitle(booking.serviceType)}</Text>
                      <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                    </View>
                  </View>
                  <View style={styles.badgeRow}>
                    {getBookingTypeBadge(booking.bookingType)}
                    {getStatusBadge(booking.taskStatus)}
                  </View>
                </View>

                <View style={styles.bookingContent}>
                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{booking.startDate} ({booking.endDate})</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{booking.address}</Text>
                    </View>
                  </View>

                  <View style={styles.providerInfo}>
                    <View>
                      <Text style={styles.providerName}>{booking.serviceProviderName}</Text>
                      <View style={styles.ratingContainer}>
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                        <Text style={styles.ratingText}>{booking['providerRating'] || 4.5}</Text>
                      </View>
                    </View>
                    <Text style={styles.priceText}>₹{booking.monthlyAmount}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.bookingActions}>
                  {booking.taskStatus === 'completed' && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Star size={16} color="#3b82f6" style={styles.actionIcon} />
                      <Text style={styles.actionButtonText}>Rate Service</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Book Again</Text>
                  </TouchableOpacity>
                  {booking.taskStatus === 'completed' && (
                    <TouchableOpacity style={styles.actionButton}>
                      <MessageCircle size={16} color="#3b82f6" style={styles.actionIcon} />
                      <Text style={styles.actionButtonText}>Leave Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Past Bookings</Text>
            <Text style={styles.emptyStateText}>Your completed and cancelled bookings will appear here.</Text>
          </View>
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
  container: {
    paddingTop:15,
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    marginTop: 20,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 15,
    color: 'black',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  section: {
    marginTop: -15,
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  pastSectionHeader: {
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
    borderLeftColor: '#9ca3af',
  },
  sectionHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  activeText: {
    color: '#3b82f6',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  completedText: {
    color: '#10b981',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cancelledText: {
    color: '#ef4444',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: '#64748b',
  },
  inProgressText: {
    color: '#1e293b',
  },
  notStartedBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: '#64748b',
  },
  notStartedText: {
    color: '#1e293b',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 5,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  onDemandBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  onDemandText: {
    color: '#a855f7',
  },
  monthlyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  monthlyText: {
    color: '#3b82f6',
  },
  shortTermBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  shortTermText: {
    color: '#22c55e',
  },
  defaultBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  defaultText: {
    color: '#6b7280',
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  pastCountBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  countText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  bookingList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  bookingId: {
    fontSize: 12,
    color: '#64748b',
  },
  bookingHeaderRight: {
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  bookingContent: {
    flexDirection: 'row',
    gap: 20,
  },
  bookingDetails: {
    flex: 1,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
  },
  providerInfo: {
    width: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  bookingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 100,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  actionIcon: {
    marginRight: 6,
  },
  cancelButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  bookServiceButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  bookServiceButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default Booking;