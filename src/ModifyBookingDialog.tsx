/* eslint-disable */
import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Booking {
  bookingType: string;
  id: number;
  startDate: string;
  endDate: string;
  timeSlot: string;
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
}

const ModifyBookingDialog: React.FC<ModifyBookingDialogProps> = ({
  open,
  onClose,
  booking,
  timeSlots,
  onSave,
}) => {
  const today = dayjs();
  const maxDate90Days = dayjs().add(90, 'day');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (booking) {
      setStartDate(new Date(booking.startDate));
      setEndDate(new Date(booking.endDate));
      setSelectedTimeSlot(booking.timeSlot || '');
    }
  }, [booking]);

  const shouldDisableStartDate = (date: Date) => {
    return dayjs(date).isBefore(today, 'day');
  };

  const shouldDisableEndDate = (date: Date) => {
    if (!startDate) return true;
    const min = dayjs(startDate).add(1, 'day');
    const max = dayjs(startDate).add(20, 'day');
    return dayjs(date).isBefore(min, 'day') || dayjs(date).isAfter(max, 'day');
  };

  const resetForm = () => {
    if (booking) {
      setStartDate(new Date(booking.startDate));
      setEndDate(new Date(booking.endDate));
      setSelectedTimeSlot(booking.timeSlot || '');
    } else {
      setStartDate(null);
      setEndDate(null);
      setSelectedTimeSlot('');
    }
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      
      if (selectedDate && booking?.bookingType === 'MONTHLY') {
        const newEndDate = dayjs(selectedDate).add(1, 'month').toDate();
        setEndDate(newEndDate);
      } else if (selectedDate && booking?.bookingType === 'SHORT_TERM') {
        const newEndDate = dayjs(selectedDate).add(1, 'day').toDate();
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    if (!startDate) return;

    const timePortion = dayjs(startDate).format('HH:mm');
    
    let finalEndDate = startDate;
    if (booking?.bookingType === 'MONTHLY') {
      finalEndDate = dayjs(startDate).add(1, 'month').toDate();
    } else if (booking?.bookingType === 'SHORT_TERM') {
      finalEndDate = endDate || dayjs(startDate).add(1, 'day').toDate();
    }

    onSave({
      startDate: dayjs(startDate).format('YYYY-MM-DD'),
      endDate: dayjs(finalEndDate).format('YYYY-MM-DD'),
      timeSlot: timePortion,
    });
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open || !booking) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modify Booking</Text>
            {booking && (
              <View style={styles.bookingInfo}>
                <Text style={styles.infoText}>
                  Current booking period: {dayjs(booking.startDate).format('DD/MM/YYYY')} to {dayjs(booking.endDate).format('DD/MM/YYYY')}
                </Text>
                <Text style={styles.infoText}>
                  Booking Type: {booking.bookingType}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>New Start Date & Time</Text>
            <TouchableOpacity 
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateInput}
            >
              <Text>
                {startDate ? dayjs(startDate).format('YYYY-MM-DD HH:mm') : 'Select start date'}
              </Text>
            </TouchableOpacity>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="datetime"
                display="default"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
                maximumDate={maxDate90Days.toDate()}
              />
            )}

            {booking.bookingType === 'SHORT_TERM' && (
              <>
                <Text style={styles.label}>New End Date</Text>
                <TouchableOpacity 
                  onPress={() => setShowEndDatePicker(true)}
                  style={styles.dateInput}
                  disabled={!startDate}
                >
                  <Text>
                    {endDate ? dayjs(endDate).format('YYYY-MM-DD') : 'Select end date'}
                  </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || (startDate ? dayjs(startDate).add(1, 'day').toDate() : new Date())}
                    mode="date"
                    display="default"
                    onChange={handleEndDateChange}
                    minimumDate={startDate ? dayjs(startDate).add(1, 'day').toDate() : new Date()}
                    maximumDate={startDate ? dayjs(startDate).add(20, 'day').toDate() : maxDate90Days.toDate()}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.saveButton]}
              disabled={!startDate || (booking.bookingType === 'SHORT_TERM' && !endDate)}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bookingInfo: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
});

export default ModifyBookingDialog;