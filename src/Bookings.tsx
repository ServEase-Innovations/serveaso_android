import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import axiosInstance from './axiosInstance';
import { useSelector } from 'react-redux';
import { RootState } from './store/userStore';
import ProviderDetails from './ProviderDetails';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
interface BookingProps {
  goBack: () => void;
}

type UserState = {
  value?: {
    serviceeType?: string;
    customerDetails?: {
      customerId: number;
      firstName: string;
      lastName: string;
    };
  } | null;
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
  serviceeType: string;
  serviceType: string;
  childAge: string;
  experience: string;
  noOfPersons: string;
  mealType: string;
  responsibilities: string;
}

const Booking: React.FC<BookingProps> = ({ goBack }) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const user = useSelector((state: RootState) => state.user as UserState);
  const customerId = user?.value?.customerDetails?.customerId ?? null;
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);

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

  useEffect(() => {
    if (customerId !== null) {
      const page = 0;
      const size = 100;

      axiosInstance
        .get(`api/serviceproviders/get-sp-booking-history?page=${page}&size=${size}`)
        .then((response) => {
          const { past = [], current = [], future = [] } = response.data || {};
          console.log('Past Bookings:', past);
          const mapBookingData = (data: any[]) =>
            Array.isArray(data)
              ? data
                  .filter((item) => item.customerId === customerId)
                  .map((item) => {
                    console.log("Service Provider ID:", item.serviceProviderId);

                    return {
                      id: item.id,
                      customerId: item.customerId,
                      serviceProviderId: item.serviceProviderId,
                      name: item.customerName,
                      serviceeType: item.serviceeType,
                      timeSlot: item.timeslot,
                      date: new Date(item.startDate).toLocaleDateString(),
                      startDate: item.startDate,
                      endDate: item.endDate,
                      bookingType: item.bookingType,
                      monthlyAmount: item.monthlyAmount,
                      paymentMode: item.paymentMode,
                      address: item.address,
                      customerName: item.customerName,
                      serviceProviderName: item.serviceProviderName,
                      taskStatus: item.taskStatus,
                      engagements: item.engagements,
                      bookingDate: item.bookingDate,
                      serviceType: item.serviceType,
                      childAge: item.childAge,
                      experience: item.experience,
                      noOfPersons: item.noOfPersons,
                      mealType: item.mealType,
                      responsibilities: item.responsibilities,
                    };
                  })
              : [];

          setPastBookings(mapBookingData(past));
          console.log('Past :', setPastBookings);
          setCurrentBookings(mapBookingData(current));
          setFutureBookings(mapBookingData(future));
        })
        .catch((error) => {
          console.error("Error fetching booking details:", error);
        });
    }
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
        serviceeType: selectedBooking.serviceeType,
        customerName: selectedBooking.customerName,
        serviceProviderName: selectedBooking.serviceProviderName,
        address: selectedBooking.address,
        taskStatus: selectedBooking.taskStatus,
      };

      try {
        const response = await axiosInstance.put(
          `/api/serviceproviders/update/engagement/${selectedBooking.id}`,
          updatePayload
        );

        console.log("Update Response:", response.data);

        setCurrentBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id ? { ...b, timeSlot: selectedTimeSlot } : b
          )
        );
        setFutureBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id ? { ...b, timeSlot: selectedTimeSlot } : b
          )
        );

        setOpenDialog(false);
        setSelectedBooking(null);
        setOpenSnackbar(true);
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
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    const updatedStatus = "CANCELLED";

    const updatePayload = {
      id: booking.id,
      serviceProviderId: booking.serviceProviderId,
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
      serviceType: booking.serviceType,
      mealType: booking.mealType,
      noOfPersons: booking.noOfPersons,
      experience: booking.experience,
      childAge: booking.childAge,
      serviceeType: booking.serviceeType,
      customerName: booking.customerName,
      serviceProviderName: booking.serviceProviderName,
      address: booking.address,
      taskStatus: updatedStatus,
    };

    try {
      console.log(`Updating engagement with ID ${booking.id} to status ${updatedStatus}`);
      const response = await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );

      console.log("Update Response:", response.data);

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

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {item.taskStatus === "CANCELLED" && (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledText}>Task Status: CANCELLED</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>Service Provider: {item.serviceProviderName}</Text>

        <Text style={styles.cardText}>Service Type: {item.serviceeType}</Text>

        <Text style={styles.cardText}>Start Date: {item.startDate}</Text>

        <Text style={styles.cardText}>End Date: {item.endDate}</Text>

        <Text style={styles.cardText}>Payment Mode: {item.paymentMode}</Text>

        <Text style={styles.cardText}>Booking Date: {item.bookingDate}</Text>

        {item.taskStatus !== "CANCELLED" && (
          <>
            <Text style={styles.cardText}>Time Slot: {item.timeSlot}</Text>

            <Text style={styles.cardText}>Booking Type: {item.bookingType}</Text>

            <Text style={styles.cardText}>Monthly Amount: ₹{item.monthlyAmount}</Text>

            <Text style={styles.cardText}>Address: {item.address}</Text>

            <Text style={styles.cardText}>Task Status: {item.taskStatus}</Text>
          </>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.modifyButton}
            onPress={() => handleModifyBooking(item)}
          >
            <Text style={styles.buttonText}>Modify</Text>
          </TouchableOpacity>
          {item.taskStatus !== "CANCELLED" && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

   const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return currentBookings.length > 0 ? (
          <FlatList
            data={currentBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.noBookingsContainer}>
            <Text style={styles.noBookingsText}>No current bookings found.</Text>
          </View>
        );
      case 1:
        return pastBookings.length > 0 ? (
          <FlatList
            data={pastBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.noBookingsContainer}>
            <Text style={styles.noBookingsText}>No past bookings found.</Text>
          </View>
        );
      case 2:
        return futureBookings.length > 0 ? (
          <FlatList
            data={futureBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.noBookingsContainer}>
            <Text style={styles.noBookingsText}>No future bookings found.</Text>
          </View>
        );
      default:
        return (
          <View style={styles.noBookingsContainer}>
            <Text style={styles.noBookingsText}>No bookings found.</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={goBack}
      >
        <MaterialIcons name="arrow-back" size={24} color="#1976d2" />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Bookings</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 0 && styles.activeTab]}
          onPress={() => setSelectedTab(0)}
        >
          <Text style={[styles.tabText, selectedTab === 0 && styles.activeTabText]}>Current Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 1 && styles.activeTab]}
          onPress={() => setSelectedTab(1)}
        >
          <Text style={[styles.tabText, selectedTab === 1 && styles.activeTabText]}>Past Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 2 && styles.activeTab]}
          onPress={() => setSelectedTab(2)}
        >
          <Text style={[styles.tabText, selectedTab === 2 && styles.activeTabText]}>Future Bookings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Modal for modifying bookings */}
      <Modal
        visible={openDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={handleDialogClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Booking</Text>
            <Text style={styles.modalText}>Change the time slot for your booking:</Text>
            
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.picker}
                value={selectedTimeSlot}
                onChangeText={handleTimeSlotChange}
                placeholder="Select time slot"
              />
              <ScrollView style={styles.timeSlotList}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={styles.timeSlotItem}
                    onPress={() => handleTimeSlotChange(slot)}
                  >
                    <Text style={styles.timeSlotText}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleDialogClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar for notifications */}
      {openSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Booking updated successfully!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
     backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 5,
    color: '#1976d2',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  cancelledText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modifyButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  noBookingsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  timeSlotList: {
    maxHeight: 150,
  },
  timeSlotItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    borderRadius: 4,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1976d2',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 4,
    elevation: 6,
  },
  snackbarText: {
    color: 'white',
    textAlign: 'center',
  },
   noBookingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 20,
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Booking;