import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Button as RNButton,
  ToastAndroid,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs, { Dayjs } from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Booking from './Bookings';

interface UserHolidayProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onLeaveSubmit: (startDate: string, endDate: string, serviceType: string) => Promise<void>;
}

const UserHoliday: React.FC<UserHolidayProps> = ({ open, onClose, booking, onLeaveSubmit }) => {
  const [leaveStartDate, setLeaveStartDate] = useState<Dayjs | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<Dayjs | null>(null);
  const [minDate, setMinDate] = useState<Dayjs | undefined>();
  const [maxDate, setMaxDate] = useState<Dayjs | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (booking) {
      const start = dayjs(booking.startDate);
      const end = dayjs(booking.endDate);
      setMinDate(start);
      setMaxDate(end);
      setLeaveStartDate(start);
      setLeaveEndDate(end);
    }
  }, [booking]);

  const handleSubmit = async () => {
    if (!leaveStartDate || !leaveEndDate || !booking?.serviceType) return;

    if (leaveStartDate.isBefore(minDate) || leaveEndDate.isAfter(maxDate)) {
       Alert.alert('Holiday dates must be within your booked period');
      return;
    }

    const diffInDays = leaveEndDate.diff(leaveStartDate, 'day') + 1;
    if (diffInDays < 10) {
      Alert.alert('Leave duration must be at least 10 days');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLeaveSubmit(
        leaveStartDate.format('YYYY-MM-DD'),
        leaveEndDate.format('YYYY-MM-DD'),
        booking.serviceType
      );
      ToastAndroid.show('Leave application submitted successfully!', ToastAndroid.SHORT);
      onClose();
    } catch (error) {
      console.error("Error submitting leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setLeaveStartDate(dayjs(selectedDate));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setLeaveEndDate(dayjs(selectedDate));
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Apply Holiday</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.datePicker}>
            <Text>Start Date: {leaveStartDate?.format('DD/MM/YYYY HH:mm') || 'Select Date'}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={leaveStartDate?.toDate() || new Date()}
              mode="datetime"
              minimumDate={minDate?.toDate()}
              maximumDate={maxDate?.toDate()}
              onChange={handleStartDateChange}
            />
          )}

          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.datePicker}>
            <Text>End Date: {leaveEndDate?.format('DD/MM/YYYY HH:mm') || 'Select Date'}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={leaveEndDate?.toDate() || new Date()}
              mode="datetime"
              minimumDate={leaveStartDate?.toDate() || minDate?.toDate()}
              maximumDate={maxDate?.toDate()}
              onChange={handleEndDateChange}
            />
          )}

          {booking && (
            <View style={styles.info}>
              <Text>Booked Period: {dayjs(booking.startDate).format('DD/MM/YYYY')} - {dayjs(booking.endDate).format('DD/MM/YYYY')}</Text>
              <Text>Service Type: {booking.serviceType}</Text>
              <Text>Booking Type: {booking.bookingType}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <RNButton title="Cancel" onPress={onClose} disabled={isSubmitting} />
            <RNButton
              title={isSubmitting ? "Submitting..." : "Submit Leave"}
              onPress={handleSubmit}
              disabled={isSubmitting || !leaveStartDate || !leaveEndDate}
              color="#6200EE"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserHoliday;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePicker: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginTop: 20,
  },
  info: {
    marginVertical: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
