// src/components/BookingDialog.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { RadioButton, Button, Portal, Dialog, PaperProvider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedOption: string;
  onOptionChange: (val: string) => void;
  startDate: string | null;
  endDate: string | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  setStartDate: (val: string | null) => void;
  setEndDate: (val: string | null) => void;
  setStartTime: (val: Dayjs | null) => void;
  setEndTime: (val: Dayjs | null) => void;
}

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onClose,
  onSave,
  selectedOption,
  onOptionChange,
  startDate,
  endDate,
  startTime,
  endTime,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
}) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const today = dayjs();
  const maxDate21Days = today.add(20, 'day');
  const maxDate90Days = today.add(89, 'day');

  const updateStartDate = (date: Date) => {
    const newValue = dayjs(date);
    setStartDate(newValue.format('YYYY-MM-DD'));
    setStartTime(newValue);

    if (selectedOption === 'Monthly') {
      const endDateValue = newValue.add(1, 'month');
      setEndDate(endDateValue.format('YYYY-MM-DD'));
      setEndTime(endDateValue);
    }

    if (selectedOption === 'Date') {
      setEndDate(newValue.format('YYYY-MM-DD'));
      setEndTime(newValue);
    }
  };

  const updateEndDate = (date: Date) => {
    const newValue = dayjs(date);
    setEndDate(newValue.format('YYYY-MM-DD'));
    setEndTime(newValue);
  };

  const updateStartTime = (time: Date) => {
    const newTime = dayjs(time);
    if (startTime) {
      const updatedDateTime = startTime
        .set('hour', newTime.hour())
        .set('minute', newTime.minute());
      setStartTime(updatedDateTime);
      setStartDate(updatedDateTime.format('YYYY-MM-DD'));
    }
  };

  const updateEndTime = (time: Date) => {
    const newTime = dayjs(time);
    if (endTime) {
      const updatedDateTime = endTime
        .set('hour', newTime.hour())
        .set('minute', newTime.minute());
      setEndTime(updatedDateTime);
      setEndDate(updatedDateTime.format('YYYY-MM-DD'));
    }
  };

  const handleOptionChange = (val: string) => {
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    onOptionChange(val);
  };

  const isConfirmDisabled = () => {
    if (!selectedOption) return true;

    switch (selectedOption) {
      case 'Date':
        return !startDate || !startTime;
      case 'Short term':
        if (!startDate || !endDate || !startTime || !endTime) return true;
        return dayjs(endDate).isBefore(dayjs(startDate));
      case 'Monthly':
        return !startDate || !startTime;
      default:
        return true;
    }
  };

  const formatDateTime = (date: Dayjs | null) => {
    if (!date) return 'Select date/time';
    return date.format('MM/DD/YYYY hh:mm A');
  };

  const shouldDisableTime = (hour: number) => {
    return hour < 5 || hour >= 22;
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.dialogContent}>
          <Text style={styles.title}>Select your Booking Option</Text>
          
          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>Book by</Text>
            
            <RadioButton.Group
              onValueChange={handleOptionChange}
              value={selectedOption}
            >
              <View style={styles.radioContainer}>
                <RadioButton.Item label="Date" value="Date" />
                <RadioButton.Item label="Short term" value="Short term" />
                <RadioButton.Item label="Monthly" value="Monthly" />
              </View>
            </RadioButton.Group>

            {/* Date Option */}
            {selectedOption === 'Date' && (
              <View style={styles.dateSection}>
                <Text style={styles.label}>Select Start Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{formatDateTime(startTime)}</Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startTime?.toDate() || new Date()}
                    mode="datetime"
                    display="default"
                    minimumDate={today.add(30, 'minute').toDate()}
                    maximumDate={maxDate21Days.toDate()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        const selectedDayjs = dayjs(selectedDate);
                        if (shouldDisableTime(selectedDayjs.hour())) {
                          Alert.alert(
                            'Invalid Time',
                            'ServEaso provides services from 5:00 AM to 10:00 PM, please select the correct time slot'
                          );
                          return;
                        }
                        updateStartDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            )}

            {/* Short Term Option */}
            {selectedOption === 'Short term' && (
              <View style={styles.dateSection}>
                <Text style={styles.label}>Select Start Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{formatDateTime(startTime)}</Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 16 }]}>Select End Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                  disabled={!startDate}
                >
                  <Text>{formatDateTime(endTime)}</Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startTime?.toDate() || new Date()}
                    mode="datetime"
                    display="default"
                    minimumDate={today.toDate()}
                    maximumDate={maxDate90Days.toDate()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        updateStartDate(selectedDate);
                      }
                    }}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endTime?.toDate() || new Date()}
                    mode="datetime"
                    display="default"
                    minimumDate={startDate ? dayjs(startDate).add(1, 'day').toDate() : today.toDate()}
                    maximumDate={startDate ? dayjs(startDate).add(20, 'day').toDate() : today.toDate()}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        updateEndDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            )}

            {/* Monthly Option */}
            {selectedOption === 'Monthly' && (
              <View style={styles.dateSection}>
                <Text style={styles.label}>Select Start Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{formatDateTime(startTime)}</Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startTime?.toDate() || new Date()}
                    mode="datetime"
                    display="default"
                    minimumDate={today.toDate()}
                    maximumDate={maxDate90Days.toDate()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        const selectedDayjs = dayjs(selectedDate);
                        if (shouldDisableTime(selectedDayjs.hour())) {
                          Alert.alert(
                            'Invalid Time',
                            'ServEaso provides services from 5:00 AM to 10:00 PM, please select the correct time slot'
                          );
                          return;
                        }
                        updateStartDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onClose} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={onSave}
              disabled={isConfirmDisabled()}
              style={styles.button}
            >
              Confirm
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  scrollView: {
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1976d2',
  },
  radioContainer: {
    marginBottom: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    minWidth: 80,
  },
});

export default BookingDialog;