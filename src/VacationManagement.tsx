import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import dayjs from 'dayjs';
import { Calendar } from 'react-native-calendars';

interface VacationDetails {
  leave_start_date?: string;
  leave_end_date?: string;
  total_days?: number;
  refund_amount?: number;
}

interface VacationManagementDialogProps {
  open: boolean;
  onClose: () => void;
  booking: {
    id: number;
    vacationDetails?: VacationDetails;
  };
  customerId: number | null;
  onSuccess?: () => void;
}

// Define types for marked dates
interface MarkedDate {
  color?: string;
  textColor?: string;
  disabled?: boolean;
  selected?: boolean;
}

interface MarkedDates {
  [date: string]: MarkedDate;
}

const VacationManagementDialog: React.FC<VacationManagementDialogProps> = ({
  open,
  onClose,
  booking,
  customerId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEndDate, setNewEndDate] = useState<string | null>(null);

  const details = booking?.vacationDetails;
  const startDate = details?.leave_start_date
    ? dayjs(details.leave_start_date)
    : null;
  const endDate = details?.leave_end_date
    ? dayjs(details.leave_end_date)
    : null;

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setNewEndDate(null);
    }
  }, [open]);

  // Cancel vacation completely
  const handleCancelVacation = async () => {
    if (!booking || !customerId) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.delete(
        `https://payments-j5id.onrender.com/api/customer/${customerId}/leaves/${booking.id}`,
        {
          data: {
            engagement_id: booking.id,
            cancellation_reason: "Customer requested cancellation",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Vacation cancelled successfully!");
        if (onSuccess) onSuccess();
        setTimeout(onClose, 2000);
      } else {
        setError("Failed to cancel vacation. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to cancel vacation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Modify vacation (shorten)
  const handleModifyVacation = async () => {
    if (!booking || !customerId || !newEndDate) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `https://payments-j5id.onrender.com/api/customer/${customerId}/leaves/${booking.id}`,
        {
          engagement_id: booking.id,
          new_end_date: newEndDate,
        }
      );

      if (response.data.success) {
        setSuccess("Vacation updated successfully!");
        if (onSuccess) onSuccess();
        setTimeout(onClose, 2000);
      } else {
        setError("Failed to update vacation. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to update vacation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Generate marked dates for calendar
  const getMarkedDates = (): MarkedDates => {
    if (!startDate || !endDate) return {};
    
    const marked: MarkedDates = {};
    const minDate = startDate.format('YYYY-MM-DD');
    const maxDate = endDate.format('YYYY-MM-DD');
    
    // Mark the range
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      marked[dateStr] = {
        color: '#e6f2ff',
        textColor: '#0066cc',
        disabled: false,
      };
      current = current.add(1, 'day');
    }
    
    // Mark selected date
    if (newEndDate) {
      marked[newEndDate] = {
        selected: true,
        color: '#0066cc',
        textColor: 'white',
      };
    }
    
    return marked;
  };

  // Handle day press on calendar
  const handleDayPress = (day: any) => {
    if (!startDate || !endDate) return;
    
    const selectedDate = dayjs(day.dateString);
    if (
      selectedDate.isBefore(startDate, 'day') ||
      selectedDate.isAfter(endDate, 'day')
    ) {
      return; // Invalid selection
    }
    
    setNewEndDate(day.dateString);
  };

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Manage Vacation</Text>
          
          <ScrollView style={styles.modalContent}>
            {details ? (
              <View style={styles.detailsContainer}>
                <Text style={styles.subtitle}>Vacation Details</Text>
                <Text style={styles.detailText}>
                  Start: {startDate?.format('MMM D, YYYY')}
                  {'\n'}
                  End: {endDate?.format('MMM D, YYYY')}
                  {'\n'}
                  Total Days: {details?.total_days}
                </Text>
              </View>
            ) : (
              <Text>No vacation details available.</Text>
            )}

            {error && (
              <View style={[styles.alert, styles.errorAlert]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={[styles.alert, styles.successAlert]}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Modify vacation section */}
            {startDate && endDate && (
              <View style={styles.calendarSection}>
                <Text style={styles.subtitle}>Modify Vacation End Date</Text>
                <Text style={styles.hintText}>
                  Select a new end date between {startDate.format('MMM D')} and{' '}
                  {endDate.format('MMM D')}.
                </Text>

                <Calendar
                  current={startDate.format('YYYY-MM-DD')}
                  minDate={startDate.format('YYYY-MM-DD')}
                  maxDate={endDate.format('YYYY-MM-DD')}
                  markedDates={getMarkedDates()}
                  onDayPress={handleDayPress}
                  theme={{
                    selectedDayBackgroundColor: '#0066cc',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#0066cc',
                    arrowColor: '#0066cc',
                  }}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelVacation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Cancel Vacation</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.updateButton,
                (!newEndDate || isLoading) && styles.disabledButton
              ]}
              onPress={handleModifyVacation}
              disabled={!newEndDate || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Update Vacation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    textAlign: 'center',
  },
  modalContent: {
    padding: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  alert: {
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  errorAlert: {
    backgroundColor: '#ffebee',
  },
  successAlert: {
    backgroundColor: '#e8f5e9',
  },
  errorText: {
    color: '#c62828',
  },
  successText: {
    color: '#2e7d32',
  },
  calendarSection: {
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButton: {
    backgroundColor: '#d32f2f',
  },
  updateButton: {
    backgroundColor: '#1976d2',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default VacationManagementDialog;