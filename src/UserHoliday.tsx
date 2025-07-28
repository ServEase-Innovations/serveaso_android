import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import Booking from './Bookings';

interface UserHolidayProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onLeaveSubmit: (startDate: string, endDate: string) => Promise<void>;
}

const UserHoliday: React.FC<UserHolidayProps> = ({ open, onClose, booking, onLeaveSubmit }) => {
  const [leaveStartDate, setLeaveStartDate] = useState<string>('');
  const [leaveEndDate, setLeaveEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLeaveStartDate(booking?.startDate || '');
    setLeaveEndDate(booking?.endDate || '');
  }, [booking]);

  const handleSubmit = async () => {
    if (!leaveStartDate || !leaveEndDate) {
      Alert.alert("Validation", "Please fill both dates.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLeaveSubmit(leaveStartDate, leaveEndDate);
      Alert.alert("Success", "Leave application submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting leave:", error);
      Alert.alert("Error", "Failed to submit leave.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Apply Leave</Text>

          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={leaveStartDate}
            onChangeText={setLeaveStartDate}
            editable={!isSubmitting}
          />

          <Text style={styles.label}>End Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={leaveEndDate}
            onChangeText={setLeaveEndDate}
            editable={!isSubmitting}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting || !leaveStartDate || !leaveEndDate}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Leave'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserHoliday;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
