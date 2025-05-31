// ServiceProviderDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import axiosInstance from "./axiosInstance";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Calendar } from 'react-native-calendars';
import { ProgressCircle } from "react-native-svg-charts";
import { RootState } from "./store/userStore";

type UserState = {
  value?: {
    role?: string;
    serviceProviderDetails?: any;
  } | null;
};

const ServiceProviderDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.user as UserState);
  const userRole = user?.value?.role ?? "No Role";
  const serviceProviderDetails = user?.value?.serviceProviderDetails ?? {};
  const serviceProviderIdd = user?.value?.serviceProviderDetails?.serviceproviderId ?? "Not Available";
  const firstName = user?.value?.serviceProviderDetails?.firstName;
  const lastName = user?.value?.serviceProviderDetails?.lastName;

  const [bookings, setBookings] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeSwitch, setActiveSwitch] = useState<number | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

  // Initialize attendance data
  useEffect(() => {
    const initialAttendance: { [key: string]: string } = {};
    for (let day = 1; day <= 28; day++) {
      const dateKey = `2025-01-${day.toString().padStart(2, "0")}`;
      initialAttendance[dateKey] = "present";
    }
    setAttendanceData(initialAttendance);
  }, []);

  const handleDateClick = (date: string) => {
    if (!attendanceData[date]) {
      setSelectedDate(date);
    }
  };

  const applyLeave = async () => {
    if (selectedDate) {
      const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
      
      setAttendanceData((prev) => ({
        ...prev,
        [dateKey]: "absent",
      }));

      const leaveData = {
        serviceproviderId: serviceProviderIdd !== "Not Available" ? serviceProviderIdd : null,
        fromDate: dateKey,
        toDate: dateKey,
        leaveType: "PAID",
      };

      try {
        const response = await axiosInstance.post(
          "/api/serviceproviders/add-leave",
          leaveData
        );
        showSnackbar("Leave applied successfully", "success");
      } catch (error) {
        showSnackbar("Error applying leave", "error");
      }
    }
  };

  const fetchBookingHistory = async () => {
    try {
      const page = 0;
      const size = 100;

      const response = await axiosInstance.get(
        `/api/serviceproviders/get-sp-booking-history?page=${page}&size=${size}`
      );

      if (response.data) {
        const currentBookings = response.data.current?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];
        const futureBookings = response.data.future?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];
        const pastBookings = response.data.past?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];

        const filteredBookings = [...currentBookings, ...futureBookings, ...pastBookings].map(booking => ({
          ...booking,
          engagementId: booking.id,
        }));

        setBookings(filteredBookings);
      }
    } catch (error) {
      showSnackbar("Error fetching booking history", "error");
      setBookings([]);
    }
  };

  useEffect(() => {
    if (serviceProviderIdd) {
      fetchBookingHistory();
    }
  }, [serviceProviderIdd]);

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 3000);
  };

  const handleSwitchChange = async (value: boolean, index: number) => {
    let updatedStatus = "";

    setBookings(prevBookings =>
      prevBookings.map((booking, i) => {
        if (i === index) {
          updatedStatus =
            booking.taskStatus === "NOT_STARTED" ? "STARTED" :
            booking.taskStatus === "STARTED" ? "COMPLETED" : "STARTED";
          return { ...booking, taskStatus: updatedStatus };
        }
        return booking;
      })
    );

    setActiveSwitch(index);
    const booking = bookings[index];

    if (!booking) {
      showSnackbar("Error: Booking not found!", "error");
      return;
    }

    const updatePayload = {
      id: booking.id,
      serviceProviderId: booking.serviceProviderId,
      customerId: booking.customerId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      engagements: booking.engagements,
      timeslot: booking.timeslot,
      bookingDate: booking.bookingDate,
      customerName: booking.customerName,
      serviceProviderName: booking.serviceProviderName,
      taskStatus: updatedStatus,
    };

    try {
      await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );
      showSnackbar(`Task Status updated to ${updatedStatus}`, "success");
    } catch (error) {
      showSnackbar("Failed to update task status", "error");
    }
  };

  const handleCancelBooking = async (index: number) => {
    const booking = bookings[index];
    const updatedStatus = "CANCELLED";

    const updatePayload = {
      id: booking.id,
      serviceProviderId: booking.serviceProviderId,
      customerId: booking.customerId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      engagements: booking.engagements,
      timeslot: booking.timeslot,
      bookingDate: booking.bookingDate,
      customerName: booking.customerName,
      serviceProviderName: booking.serviceProviderName,
      taskStatus: updatedStatus,
    };

    try {
      await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );

      const updatedBookings = [...bookings];
      updatedBookings[index].taskStatus = updatedStatus;
      setBookings(updatedBookings);

      showSnackbar("Booking successfully cancelled!", "success");
    } catch (error) {
      showSnackbar("Failed to cancel booking", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED": return { bg: "#9e9e9e", text: "#555" };
      case "STARTED": return { bg: "#ffa726", text: "#8B6508" };
      case "IN_PROGRESS": return { bg: "#1976d2", text: "#007BFF" };
      case "CANCELLED": return { bg: "#d32f2f", text: "#fff" };
      case "COMPLETED": return { bg: "#4caf50", text: "#fff" };
      default: return { bg: "#9e9e9e", text: "#000" };
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.bookingContainer}>
        {bookings
          .filter(booking => booking.taskStatus !== "CANCELLED")
          .map((booking, index) => (
            <View key={index} style={styles.bookingCard}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.taskStatus).bg }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(booking.taskStatus).text }
                ]}>
                  Task Status: {booking.taskStatus}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.customerName}>{booking.customerName}</Text>

              <Text style={styles.sectionTitle}>Time Slot</Text>
              <Text style={styles.timeSlot}>{booking.timeslot}</Text>

              <Text style={styles.sectionTitle}>Booking Start Date</Text>
              <Text style={styles.dateText}>
                {new Date(booking.startDate).toLocaleDateString()}
              </Text>

              {booking.endDate && (
                <>
                  <Text style={styles.sectionTitle}>Booking End Date</Text>
                  <Text style={styles.dateText}>
                    {new Date(booking.endDate).toLocaleDateString()}
                  </Text>
                </>
              )}

              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.addressText}>{booking.address}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`tel:${booking.phone}`)}
                  style={styles.callButton}
                >
                  <Icon name="call" size={24} color="#0056b3" />
                </TouchableOpacity>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.confirmButton,
                      booking.status === 'Pending' ? 
                        { backgroundColor: 'transparent', borderColor: 'orange' } : 
                        { backgroundColor: 'green' }
                    ]}
                  >
                    <Text style={[
                      styles.confirmButtonText,
                      booking.status === 'Pending' ? { color: 'orange' } : { color: 'white' }
                    ]}>
                      {booking.status === 'Pending' ? 'Confirm Booking' : 'Confirmed'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(index)}
                    disabled={["STARTED", "IN_PROGRESS", "COMPLETED"].includes(booking.taskStatus)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <Switch
                  value={booking.taskStatus === "STARTED"}
                  onValueChange={(value) => handleSwitchChange(value, index)}
                  disabled={booking.taskStatus === "CANCELLED"}
                />
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderServiceRecapTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionHeader}>Past Services</Text>
      <View style={styles.pastServicesContainer}>
        {bookings
          .filter(booking => new Date(booking.endDate) < new Date())
          .map((history, index) => (
            <View key={index} style={styles.historyCard}>
              <Text style={styles.historyCustomer}>{history.customerName}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Time Slot:</Text> {history.timeslot}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Address:</Text> {history.address}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Monthly Amount:</Text> {history.monthlyAmount ? `₹${history.monthlyAmount}` : 'N/A'}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Start Date:</Text> {history.startDate ? new Date(history.startDate).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>End Date:</Text> {history.endDate ? new Date(history.endDate).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Service Type:</Text> {history.serviceType || 'N/A'}</Text>
              <Text style={styles.historyDetail}><Text style={styles.boldText}>Booking Type:</Text> {history.bookingType || 'N/A'}</Text>

              <View style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(history.taskStatus).bg }
              ]}>
                <Text style={[
                  styles.statusChipText,
                  { color: getStatusColor(history.taskStatus).text }
                ]}>
                  {history.taskStatus}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderAttendanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.attendanceContainer}>
        <Text style={styles.attendanceTitle}>Attendance Calendar</Text>
        
        <Calendar
          onDayPress={(day:any) => handleDateClick(day.dateString)}
          markedDates={{
            ...Object.keys(attendanceData).reduce((acc, date) => {
              acc[date] = {
                selected: true,
                selectedColor: attendanceData[date] === "present" ? "#4CAF50" : "#FF5733",
                customStyles: {
                  container: {
                    borderRadius: 20,
                  },
                  text: {
                    color: 'white',
                    fontWeight: 'bold',
                  }
                }
              };
              return acc;
            }, {} as any),
            ...(selectedDate ? {
              [selectedDate]: {
                selected: true,
                selectedColor: '#f57c00',
                customStyles: {
                  container: {
                    borderRadius: 20,
                  },
                  text: {
                    color: 'white',
                    fontWeight: 'bold',
                  }
                }
              }
            } : {})
          }}
          theme={{
            calendarBackground: '#f8f9fa',
            textSectionTitleColor: '#333',
            selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00adf5',
            dayTextColor: '#333',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: '#0056b3',
            monthTextColor: '#0056b3',
            indicatorColor: 'blue',
            textDayFontWeight: 'bold',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: 'bold',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
        />

        <TouchableOpacity 
          style={styles.applyLeaveButton}
          onPress={applyLeave}
        >
          <Text style={styles.applyLeaveButtonText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEarningsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.earningsTitle}>Earnings Summary</Text>
      
      <View style={styles.earningsContainer}>
        {/* Monthly Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsCardTitle}>Earning in Month</Text>
          <View style={styles.progressContainer}>
            <ProgressCircle
              style={styles.progressCircle}
              progress={0.75}
              progressColor="#4CAF50"
              startAngle={-Math.PI * 0.8}
              endAngle={Math.PI * 0.8}
            />
            <Text style={styles.progressText}>75%</Text>
          </View>
          <Text style={styles.earningsDetail}>Deposits: $300 | Expenses: $50 | Payable: $250</Text>
        </View>

        {/* Monthly Sales */}
        <View style={[styles.earningsCard, { backgroundColor: '#fff3e0' }]}>
          <Text style={styles.earningsCardTitle}>Monthly</Text>
          <Text style={[styles.earningsAmount, { color: '#ff9800' }]}>20,541</Text>
          <Text style={styles.earningsSubtitle}>Today Income</Text>
          <View style={styles.earningsTrend}>
            <Icon name="arrow-upward" size={20} color="#ff9800" />
            <Text style={[styles.earningsTrendText, { color: '#ff9800' }]}>75%</Text>
          </View>
        </View>

        {/* Yearly Sales */}
        <View style={[styles.earningsCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.earningsCardTitle}>Yearly</Text>
          <Text style={[styles.earningsAmount, { color: '#388e3c' }]}>20,54,125</Text>
          <Text style={styles.earningsSubtitle}>Today Income</Text>
          <View style={styles.earningsTrend}>
            <Icon name="arrow-upward" size={20} color="#388e3c" />
            <Text style={[styles.earningsTrendText, { color: '#388e3c' }]}>75%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={60} color="#0056b3" />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{`${firstName} ${lastName}`}</Text>
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Icon name="event" size={20} color="#1976d2" />
                <Text style={styles.statText}>{bookings.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="check-circle" size={20} color="#388e3c" />
                <Text style={styles.statText}>
                  {bookings.filter(b => b.status === 'Confirmed').length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="warning" size={20} color="#f57c00" />
                <Text style={styles.statText}>
                  {bookings.filter(b => b.status === 'Pending').length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[1, 2, 3, 4].map((i) => (
              <Icon key={i} name="star" size={20} color="#FFD700" />
            ))}
            <Icon name="star-half" size={20} color="#FFD700" />
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 0 && styles.activeTab]}
          onPress={() => setSelectedTab(0)}
        >
          <Text style={[styles.tabText, selectedTab === 0 && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 1 && styles.activeTab]}
          onPress={() => setSelectedTab(1)}
        >
          <Text style={[styles.tabText, selectedTab === 1 && styles.activeTabText]}>Service Recap</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 2 && styles.activeTab]}
          onPress={() => setSelectedTab(2)}
        >
          <Text style={[styles.tabText, selectedTab === 2 && styles.activeTabText]}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 3 && styles.activeTab]}
          onPress={() => setSelectedTab(3)}
        >
          <Text style={[styles.tabText, selectedTab === 3 && styles.activeTabText]}>Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 0 && renderProfileTab()}
      {selectedTab === 1 && renderServiceRecapTab()}
      {selectedTab === 2 && renderAttendanceTab()}
      {selectedTab === 3 && renderEarningsTab()}

      {/* Snackbar */}
      {snackbarVisible && (
        <View style={[
          styles.snackbar,
          { backgroundColor: snackbarType === "success" ? "#4CAF50" : "#F44336" }
        ]}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#0056b3',
  },
  tabText: {
    color: '#555',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 10,
  },
  bookingContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  statusText: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#555',
    fontSize: 14,
    marginTop: 5,
  },
  customerName: {
    color: '#0056b3',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timeSlot: {
    color: '#2a7f62',
    fontSize: 16,
    marginBottom: 10,
  },
  dateText: {
    color: '#2a7f62',
    fontSize: 16,
    marginBottom: 10,
  },
  addressText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  callButton: {
    padding: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'red',
  },
  cancelButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#555',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  pastServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  historyCard: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    opacity: 0.8,
  },
  historyCustomer: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyDetail: {
    color: '#555',
    marginBottom: 3,
    fontSize: 12,
  },
  boldText: {
    fontWeight: 'bold',
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  statusChipText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  attendanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  applyLeaveButton: {
    backgroundColor: '#f57c00',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 20,
  },
  applyLeaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  earningsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningsCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  earningsCardTitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  progressCircle: {
    height: 80,
    width: 80,
  },
  progressText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earningsDetail: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
  },
  earningsSubtitle: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
  },
  earningsTrend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  earningsTrendText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snackbarText: {
    color: '#fff',
    flex: 1,
  },
});

export default ServiceProviderDashboard;