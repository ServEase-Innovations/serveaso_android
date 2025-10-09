import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import dayjs from 'dayjs';
import axiosInstance from './axiosInstance';
import DateTimePicker from '@react-native-community/datetimepicker';
import VacationManagementDialog from './VacationManagement'; // Make sure this import path is correct

interface Booking {
  bookingType: string;
  id: number;
  startDate: string;
  endDate: string;
  timeSlot: string;
  serviceType: string;
  customerId?: number;
  modifiedDate: string;
  bookingDate: string;
  hasVacation?: boolean;
  vacationDetails?: {
    leave_start_date?: string;
    leave_end_date?: string;
    total_days?: number;
    refund_amount?: number;
  };
}

interface ModifyBookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  timeSlots: string[];
  onSave: (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => void;
  customerId: number | null;
}

const ModifyBookingDialog: React.FC<ModifyBookingDialogProps> = ({
  open,
  onClose,
  booking,
  timeSlots,
  onSave,
  customerId,
}) => {
  const today = dayjs();
  const maxDate90Days = dayjs().add(90, 'day');

  const [startDate, setStartDate] = useState<Date | null>(
    booking ? new Date(booking.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    booking ? new Date(booking.endDate) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showVacationDialog, setShowVacationDialog] = useState(false);

  const [selectedSection, setSelectedSection] = useState<
    'OPTIONS' | 'BOOKING_DATE' | 'BOOKING_TIME' | 'VACATION'
  >('OPTIONS');

  const shouldDisableStartDate = (date: Date) => dayjs(date).isBefore(today, 'day');

  const shouldDisableEndDate = (date: Date) => {
    if (!startDate) return true;
    const min = dayjs(startDate).add(1, 'day');
    const max = dayjs(startDate).add(20, 'day');
    return dayjs(date).isBefore(min, 'day') || dayjs(date).isAfter(max, 'day');
  };

  // Extract the actual booked time from the booking
  const getBookedTime = () => {
    if (!booking) return new Date();
    
    // Parse the time slot from the booking
    const [time, period] = booking.timeSlot.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Create a Date object with the booked time
    const bookedDate = new Date(booking.startDate);
    bookedDate.setHours(hours, minutes, 0, 0);
    return bookedDate;
  };

  // --- Checks for modification eligibility ---
  const isModificationTimeAllowed = (startDate: string, timeSlot: string) => {
    const now = dayjs();
    const [time, period] = timeSlot.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const bookingDateTime = dayjs(startDate).set('hour', hours).set('minute', minutes).set('second', 0);
    return now.isBefore(bookingDateTime.subtract(30, 'minute'));
  };

  const isBookingAlreadyModified = (booking: Booking | null): boolean => {
    if (!booking) return false;
    return new Date(booking.modifiedDate).getTime() !== new Date(booking.bookingDate).getTime();
  };

  const getModificationStatusMessage = (booking: Booking | null): string => {
    if (!booking) return "";
    if (isBookingAlreadyModified(booking)) return "This booking has already been modified and cannot be modified again.";
    if (!isModificationTimeAllowed(booking.startDate, booking.timeSlot)) return "Modification is only allowed at least 30 minutes before the scheduled time.";
    return "";
  };

  const isModificationDisabled = (booking: Booking | null): boolean => {
    if (!booking) return true;
    return !isModificationTimeAllowed(booking.startDate, booking.timeSlot) || isBookingAlreadyModified(booking);
  };

  const handleSubmit = async () => {
    if (!startDate || !booking) return;
    if (isModificationDisabled(booking)) {
      setError(getModificationStatusMessage(booking));
      return;
    }
    setIsLoading(true);
    setError(null);

    const timePortion = dayjs(startDate).format("HH:mm");
    let finalEndDate = startDate;
    if (booking.bookingType === "MONTHLY") {
      finalEndDate = new Date(dayjs(startDate).add(1, "month").toDate());
    } else if (booking.bookingType === "SHORT_TERM") {
      finalEndDate = endDate || new Date(dayjs(startDate).add(1, "day").toDate());
    }

    try {
      const updatePayload: any = {
        customerId: customerId,
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(finalEndDate).format("YYYY-MM-DD"),
        timeslot: timePortion,
        modifiedBy: "CUSTOMER",
      };
      await axiosInstance.put(`/api/serviceproviders/update/engagement/${booking.id}`, updatePayload);
      onSave({
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(finalEndDate).format("YYYY-MM-DD"),
        timeSlot: timePortion,
      });
      setSuccess("Booking updated successfully!");
    } catch (error: any) {
      console.error("Error updating booking:", error);
      setError("Failed to update booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVacationSuccess = () => {
    setSuccess("Vacation operation completed successfully!");
    setShowVacationDialog(false);
    // You might want to refresh parent data here
    // You could call onSave or another callback to refresh the parent component
  };

  const handleVacationClose = () => {
    setShowVacationDialog(false);
    setSelectedSection("OPTIONS");
  };

  useEffect(() => {
    if (open && booking) {
      const bookedTime = getBookedTime();
      setStartDate(bookedTime);
      setEndDate(new Date(booking.endDate));
      setError(null);
      setSuccess(null);
      setSelectedSection("OPTIONS");
      setShowVacationDialog(false);
    }
  }, [open, booking]);

  if (!open || !booking) return null;

  const modificationDisabled = isModificationDisabled(booking);
  const statusMessage = getModificationStatusMessage(booking);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (selectedDate) {
      if (pickerMode === 'date') {
        // Keep the time portion when changing date
        const currentTime = startDate ? startDate : new Date();
        const newDate = new Date(selectedDate);
        newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
        setStartDate(newDate);
      } else {
        // Keep the date portion when changing time
        const currentDate = startDate ? startDate : new Date();
        const newTime = new Date(selectedDate);
        currentDate.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
        setStartDate(new Date(currentDate));
      }
    }
  };

  const openDatePicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const CustomButton = ({ 
    title, 
    onPress, 
    disabled = false, 
    variant = 'contained' 
  }: { 
    title: string; 
    onPress: () => void; 
    disabled?: boolean;
    variant?: 'contained' | 'outlined';
  }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          variant === 'contained' ? styles.containedButton : styles.outlinedButton,
          disabled && styles.disabledButton
        ]}
      >
        <Text style={[
          styles.buttonText,
          variant === 'contained' ? styles.containedButtonText : styles.outlinedButtonText,
          disabled && styles.disabledButtonText
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={open}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.dialogContainer}>
            <View style={styles.dialog}>
              <View style={styles.header}>
                <Text style={styles.title}>Modify Options</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {success && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{success}</Text>
                </View>
              )}

              {/* Options */}
              {selectedSection === "OPTIONS" && (
                <View style={styles.optionsContainer}>
                  {booking?.hasVacation && (
                    <CustomButton 
                      title="Manage Vacation" 
                      onPress={() => setShowVacationDialog(true)}
                      variant="outlined"
                    />
                  )}

                  {booking.bookingType === "MONTHLY" && (
                    <>
                      <CustomButton 
                        title="Reschedule Date" 
                        onPress={() => setSelectedSection("BOOKING_DATE")} 
                        disabled={modificationDisabled}
                      />
                      <CustomButton 
                        title="Reschedule Time" 
                        onPress={() => setSelectedSection("BOOKING_TIME")} 
                        disabled={modificationDisabled}
                      />
                    </>
                  )}

                  {modificationDisabled && (
                    <Text style={styles.statusMessage}>{statusMessage}</Text>
                  )}
                </View>
              )}

              {/* Reschedule Date */}
              {selectedSection === "BOOKING_DATE" && (
                <View style={styles.sectionContainer}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Select New Date</Text>
                    <TouchableOpacity 
                      style={styles.dateDisplay}
                      onPress={() => openDatePicker('date')}
                    >
                      <Text>{startDate ? dayjs(startDate).format('MMMM D, YYYY') : 'Select date'}</Text>
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                      <DateTimePicker
                        value={startDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        maximumDate={maxDate90Days.toDate()}
                      />
                    )}
                  </View>
                  
                  <View style={styles.buttonRow}>
                    <CustomButton 
                      title="Back" 
                      onPress={() => setSelectedSection("OPTIONS")}
                      variant="outlined"
                    />
                    <CustomButton 
                      title="Save Date" 
                      onPress={handleSubmit}
                    />
                  </View>
                </View>
              )}

              {/* Reschedule Time */}
              {selectedSection === "BOOKING_TIME" && (
                <View style={styles.sectionContainer}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>
                      Current Booked Time: <Text style={styles.bold}>{booking.timeSlot}</Text>
                    </Text>
                    
                    <Text style={styles.label}>Select New Time</Text>
                    <TouchableOpacity 
                      style={styles.dateDisplay}
                      onPress={() => openDatePicker('time')}
                    >
                      <Text>{startDate ? dayjs(startDate).format('h:mm A') : 'Select time'}</Text>
                    </TouchableOpacity>
                    
                    {showTimePicker && (
                      <DateTimePicker
                        value={startDate || new Date()}
                        mode="time"
                        display="default"
                        onChange={handleDateChange}
                        is24Hour={false}
                      />
                    )}
                  </View>
                  
                  <View style={styles.buttonRow}>
                    <CustomButton 
                      title="Back" 
                      onPress={() => setSelectedSection("OPTIONS")}
                      variant="outlined"
                    />
                    <CustomButton 
                      title="Save Time" 
                      onPress={handleSubmit}
                    />
                  </View>
                </View>
              )}

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1976d2" />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Vacation Management Dialog */}
      <VacationManagementDialog
        open={showVacationDialog}
        onClose={handleVacationClose}
        booking={booking}
        customerId={customerId}
        onSuccess={handleVacationSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  successContainer: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  optionsContainer: {
    padding: 24,
    gap: 16,
  },
  sectionContainer: {
    padding: 16,
    gap: 16,
  },
  pickerContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  dateDisplay: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  containedButton: {
    backgroundColor: '#1976d2',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  containedButtonText: {
    color: 'white',
  },
  outlinedButtonText: {
    color: '#1976d2',
  },
  disabledButtonText: {
    color: '#999',
  },
  statusMessage: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModifyBookingDialog;