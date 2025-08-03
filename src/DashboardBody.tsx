import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CalendarPicker from 'react-native-calendar-picker';
import dayjs from 'dayjs';

interface DashboardBodyProps {
  selectedTab: number;
  bookings: any[];
  activeSwitch: number | null;
  attendanceData: { [key: string]: string };
  selectedDate: Date | null;
  handleDateClick: (date: Date) => void;
  handleSwitchChange: (event: any, index: number) => void;
  handleCancelBooking: (index: number) => void;
  applyLeave: (description: string) => void;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "error" | "warning" | "info";
  handleSnackbarClose: () => void;
}

const DashboardBody: React.FC<DashboardBodyProps> = ({
  selectedTab,
  bookings,
  activeSwitch,
  attendanceData,
  selectedDate,
  handleDateClick,
  handleSwitchChange,
  handleCancelBooking,
  applyLeave,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  handleSnackbarClose
}) => {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveDescription, setLeaveDescription] = useState<string>("");
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  const handleLeaveDialogOpen = () => {
    if (selectedDate) {
      setTempSelectedDate(selectedDate);
      setLeaveDialogOpen(true);
      setLeaveDescription("");
    }
  };

  const handleLeaveDialogClose = () => {
    setLeaveDialogOpen(false);
    setLeaveDescription("");
  };

  const handleLeaveDescriptionChange = (text: string) => {
    setLeaveDescription(text);
  };

//   const handleLeaveSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (tempSelectedDate && leaveDescription) {
//       await applyLeave(leaveDescription);
//       handleLeaveDialogClose();
//     }
//   };
const handleLeaveSubmit = async () => {
  if (tempSelectedDate && leaveDescription) {
    await applyLeave(leaveDescription);
    handleLeaveDialogClose();
  }
};

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return { backgroundColor: 'rgba(200, 200, 200, 0.3)', color: '#555' };
      case "STARTED":
        return { backgroundColor: 'rgba(255, 215, 0, 0.3)', color: '#8B6508' };
      case "IN_PROGRESS":
        return { backgroundColor: 'rgba(30, 144, 255, 0.3)', color: '#007BFF' };
      case "CANCELLED":
        return { backgroundColor: 'rgba(255, 0, 0, 0.5)', color: '#fff' };
      case "COMPLETED":
        return { backgroundColor: 'rgba(50, 205, 50, 0.5)', color: '#fff' };
      default:
        return { backgroundColor: '#ccc', color: '#000' };
    }
  };

  const getChipColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#4caf50';
      case 'NOT_STARTED': return '#9e9e9e';
      case 'STARTED': return '#ffa726';
      case 'IN_PROGRESS': return '#1976d2';
      case 'CANCELLED': return '#d32f2f';
      default: return '#9e9e9e';
    }
  };

  const getSnackbarColor = () => {
    switch (snackbarSeverity) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#4caf50';
    }
  };

  const renderBookingCard = ({ item, index }: { item: any, index: number }) => {
    const statusStyles = getStatusStyles(item.taskStatus);
    
    return (
      <View style={styles.dashboardCard}>
        <View style={[styles.statusContainer, { backgroundColor: statusStyles.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyles.color }]}>
            Task Status: {item.taskStatus}
          </Text>
        </View>

        <Text style={styles.subtitle}>Customer</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>

        <Text style={styles.subtitle}>Time Slot</Text>
        <Text style={styles.timeSlot}>{item.timeslot}</Text>

        <Text style={styles.subtitle}>Booking Start Date</Text>
        <Text style={styles.dateText}>
          {new Date(item.startDate).toLocaleDateString()}
        </Text>

        {item.endDate && (
          <>
            <Text style={styles.subtitle}>Booking End Date</Text>
            <Text style={styles.dateText}>
              {new Date(item.endDate).toLocaleDateString()}
            </Text>
          </>
        )}

        <Text style={styles.subtitle}>Address</Text>
        <Text style={styles.addressText}>{item.address}</Text>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.callButton} 
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Icon name="call" size={24} color="#007AFF" />
          </TouchableOpacity>

          <View style={styles.bookingButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.bookingButton,
                item.status === 'Pending' 
                  ? styles.pendingButton 
                  : styles.confirmedButton
              ]}
            >
              <Text style={[
                styles.bookingButtonText,
                item.status === 'Pending' 
                  ? { color: 'orange' } 
                  : { color: 'white' }
              ]}>
                {item.status === 'Pending' ? 'Confirm Booking' : 'Confirmed'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(index)}
              disabled={["STARTED", "IN_PROGRESS", "COMPLETED"].includes(item.taskStatus)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={[
                styles.switchTrack,
                item.taskStatus === "STARTED" 
                  ? styles.switchOn 
                  : styles.switchOff
              ]}
              onPress={() => handleSwitchChange(null, index)}
              disabled={item.taskStatus === "CANCELLED"}
            >
              <View style={[
                styles.switchThumb,
                item.taskStatus === "STARTED" 
                  ? styles.switchThumbOn 
                  : styles.switchThumbOff
              ]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryCard = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={styles.historyCard}>
        <Text style={styles.historyCustomerName}>{item.customerName}</Text>
        <Text style={styles.historyTimeSlot}>
          <Text style={styles.boldText}>Time Slot:</Text> {item.timeslot}
        </Text>
        <Text style={styles.historyAddress}>
          <Text style={styles.boldText}>Address:</Text> {item.address}
        </Text>
        <Text style={styles.historyAmount}>
          <Text style={styles.boldText}>Monthly Amount:</Text> {item.monthlyAmount ? `₹${item.monthlyAmount}` : 'N/A'}
        </Text>
        <Text style={styles.historyDate}>
          <Text style={styles.boldText}>Start Date:</Text> {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
        </Text>
        <Text style={styles.historyDate}>
          <Text style={styles.boldText}>End Date:</Text> {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
        </Text>
        <Text style={styles.historyText}>
          <Text style={styles.boldText}>Service Type:</Text> {item.serviceType || 'N/A'}
        </Text>
        <Text style={styles.historyText}>
          <Text style={styles.boldText}>Booking Type:</Text> {item.bookingType || 'N/A'}
        </Text>

        <View style={[
          styles.chip,
          { backgroundColor: getChipColor(item.taskStatus) }
        ]}>
          <Text style={styles.chipText}>{item.taskStatus}</Text>
        </View>
      </View>
    );
  };

  const renderDayComponent = (date: Date) => {
    const dateKey = dayjs(date).format("YYYY-MM-DD");
    const isPresent = attendanceData[dateKey] === "Present";
    const isAbsent = attendanceData[dateKey] === "Absent";
    
    return (
      <View style={[
        styles.calendarDay,
        isPresent && styles.presentDay,
        isAbsent && styles.absentDay
      ]}>
        <Text style={[
          styles.dayText,
          isPresent && styles.presentDayText,
          isAbsent && styles.absentDayText
        ]}>
          {date.getDate()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Show Profile Section if Profile Tab is Selected */}
      {selectedTab === 0 && (
        <View style={styles.tabContainer}>
          <FlatList
            data={bookings.filter(booking => booking.taskStatus !== "CANCELLED")}
            renderItem={renderBookingCard}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.bookingList}
            numColumns={Dimensions.get('window').width > 600 ? 2 : 1}
          />
        </View>
      )}

      {/* Show Service Recap Section if Service Recap Tab is Selected */}
      {selectedTab === 1 && (
        <View style={styles.tabContainer}>
          <Text style={styles.sectionTitle}>Past Services</Text>
          <FlatList
            data={bookings.filter(booking => new Date(booking.endDate) < new Date())}
            renderItem={renderHistoryCard}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.historyList}
            numColumns={Dimensions.get('window').width > 600 ? 2 : 1}
          />
        </View>
      )}

      {/* Attendance Calendar */}
      {selectedTab === 2 && (
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>Attendance Calendar</Text>
          
          <CalendarPicker
            onDateChange={handleDateClick}
            dayShape="circle"
            selectedDayColor="#1976d2"
            selectedDayTextColor="#ffffff"
            customDayHeaderStyles={() => ({
              textStyle: {
                fontWeight: 'bold',
                color: '#333',
              }
            })}
            customDatesStyles={(date) => {
              const dateKey = dayjs(date).format("YYYY-MM-DD");
              if (attendanceData[dateKey] === "Present") {
                return {
                  style: {
                    backgroundColor: 'rgba(144, 238, 144, 0.6)',
                    borderColor: '#4CAF50',
                  },
                  textStyle: {
                    color: '#2c662d',
                    fontWeight: 'bold',
                  }
                };
              } else if (attendanceData[dateKey] === "Absent") {
                return {
                  style: {
                    backgroundColor: 'rgba(255, 99, 71, 0.6)',
                    borderColor: '#FF5733',
                  },
                  textStyle: {
                    color: '#900',
                    fontWeight: 'bold',
                  }
                };
              }
              return {};
            }}
            weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
            months={[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ]}
            previousComponent={<Icon name="chevron-left" size={24} color="#1976d2" />}
            nextComponent={<Icon name="chevron-right" size={24} color="#1976d2" />}
          />

          <TouchableOpacity
            style={[
              styles.leaveButton,
              (!selectedDate || attendanceData[dayjs(selectedDate).format("YYYY-MM-DD")] === "Present") && styles.disabledButton
            ]}
            onPress={handleLeaveDialogOpen}
            disabled={!selectedDate || attendanceData[dayjs(selectedDate).format("YYYY-MM-DD")] === "Present"}
          >
            <Text style={styles.leaveButtonText}>Apply Leave</Text>
          </TouchableOpacity>

          {/* Leave Application Dialog */}
          <Modal
            visible={leaveDialogOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={handleLeaveDialogClose}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Apply for Leave</Text>
                <Text style={styles.modalSubtitle}>
                  You're applying for leave on {tempSelectedDate && dayjs(tempSelectedDate).format("MMMM D, YYYY")}
                </Text>
                
                <TextInput
                  style={styles.leaveInput}
                  placeholder="Leave Description"
                  value={leaveDescription}
                  onChangeText={handleLeaveDescriptionChange}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelModalButton}
                    onPress={handleLeaveDialogClose}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.submitModalButton,
                      !leaveDescription && styles.disabledButton
                    ]}
                    onPress={handleLeaveSubmit}
                    disabled={!leaveDescription}
                  >
                    <Text style={styles.submitModalButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* Earnings Section */}
      {selectedTab === 3 && (
        <ScrollView style={styles.earningsContainer}>
          <Text style={styles.earningsTitle}>Earnings Summary</Text>
          
          <View style={styles.earningsGrid}>
            <View style={styles.earningsCard}>
              <Text style={styles.earningsCardTitle}>Earning in Month</Text>
              <View style={styles.progressContainer}>
                <ActivityIndicator 
                  size="large" 
                  color="#4CAF50" 
                  style={styles.progressCircle}
                />
                <Text style={styles.progressText}>75%</Text>
              </View>
              <Text style={styles.earningsCardText}>
                Deposits: $300 | Expenses: $50 | Payable: $250
              </Text>
            </View>

            <View style={[styles.earningsCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.earningsCardTitle}>Monthly</Text>
              <Text style={[styles.earningsAmount, { color: '#FF9800' }]}>20,541</Text>
              <Text style={styles.earningsCardText}>Today Income</Text>
              <View style={styles.earningsTrend}>
                <Icon name="arrow-upward" size={20} color="#FF9800" />
                <Text style={[styles.trendText, { color: '#FF9800' }]}>75%</Text>
              </View>
            </View>

            <View style={[styles.earningsCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.earningsCardTitle}>Yearly</Text>
              <Text style={[styles.earningsAmount, { color: '#388E3C' }]}>20,54,125</Text>
              <Text style={styles.earningsCardText}>Today Income</Text>
              <View style={styles.earningsTrend}>
                <Icon name="arrow-upward" size={20} color="#388E3C" />
                <Text style={[styles.trendText, { color: '#388E3C' }]}>75%</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Snackbar */}
      {snackbarOpen && (
        <View style={[styles.snackbar, { backgroundColor: getSnackbarColor() }]}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          <TouchableOpacity onPress={handleSnackbarClose}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
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
  tabContainer: {
    
    marginTop: 20,
    paddingHorizontal: 10,
  },
  bookingList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  historyList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  dashboardCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Dimensions.get('window').width > 600 ? '45%' : '95%',
  },
  statusContainer: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
  },
  customerName: {
    color: '#0056b3',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeSlot: {
    color: '#2a7f62',
    fontSize: 16,
    marginBottom: 8,
  },
  dateText: {
    color: '#2a7f62',
    fontSize: 16,
    marginBottom: 8,
  },
  addressText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  callButton: {
    padding: 8,
  },
  bookingButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  pendingButton: {
    borderWidth: 1,
    borderColor: 'orange',
    backgroundColor: 'transparent',
  },
  confirmedButton: {
    backgroundColor: 'green',
  },
  bookingButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },
  switchContainer: {
    padding: 5,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchOn: {
    backgroundColor: '#4CAF50',
  },
  switchOff: {
    backgroundColor: '#ccc',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    color: '#555',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  historyCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    width: Dimensions.get('window').width > 600 ? '45%' : '95%',
  },
  historyCustomerName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 5,
  },
  historyTimeSlot: {
    color: 'green',
    fontSize: 14,
    marginBottom: 5,
  },
  historyAddress: {
    color: '#777',
    fontSize: 14,
    marginBottom: 5,
  },
  historyAmount: {
    color: '#555',
    fontSize: 14,
    marginBottom: 5,
  },
  historyDate: {
    color: '#555',
    fontSize: 14,
    marginBottom: 5,
  },
  historyText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    margin: 20,
  },
  calendarTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  calendarDay: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presentDay: {
    backgroundColor: 'rgba(144, 238, 144, 0.6)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  absentDay: {
    backgroundColor: 'rgba(255, 99, 71, 0.6)',
    borderWidth: 2,
    borderColor: '#FF5733',
  },
  dayText: {
    fontWeight: 'bold',
  },
  presentDayText: {
    color: '#2c662d',
  },
  absentDayText: {
    color: '#900',
  },
  leaveButton: {
    backgroundColor: '#f57c00',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  leaveInput: {
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelModalButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelModalButtonText: {
    color: '#555',
  },
  submitModalButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 4,
  },
  submitModalButtonText: {
    color: 'white',
  },
  earningsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  earningsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  earningsGrid: {
    flexDirection: Dimensions.get('window').width > 600 ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningsCard: {
    backgroundColor: '#f5f5f5',
    padding: 25,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    width: Dimensions.get('window').width > 600 ? '30%' : '100%',
    minHeight: 250,
    justifyContent: 'center',
  },
  earningsCardTitle: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  progressCircle: {
    transform: [{ scale: 1.5 }],
  },
  progressText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earningsCardText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  earningsTrend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  trendText: {
    marginLeft: 5,
    fontSize: 14,
  },
  snackbar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    padding: 15,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  snackbarText: {
    color: 'white',
    marginRight: 20,
  },
});

export default DashboardBody;