import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ServiceProviderContext } from './context/ServiceProviderContext';
import { useDispatch } from 'react-redux';
import { add } from './features/bookingTypeSlice';
import { Bookingtype } from './types/bookingTypeData';
import { COOK, MAID, NANNY } from './Constants/providerConstants';
import { CONFIRMATION, DETAILS } from './Constants/pagesConstants';
import MaidServiceDialog from './/MaidServiceDialog';
import CookServiceDialog from './CookServiceDialog';
import NannyServiceDialog from './NannyServiceDialog';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: (data: string) => void;
}

const Landingpage: React.FC<ChildComponentProps> = ({ sendDataToParent, bookingType }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false); // Add this line
 
  const { selectedBookingType, setSelectedBookingType } = useContext(ServiceProviderContext);
  const dispatch = useDispatch();

  const [selectedRadioButtonValue, setSelectedRadioButtonValue] = useState<string>('');

  const handleClick = (data: string) => {
    setModalVisible(true);
    setSelectedType(data);
    setSelectedBookingType(data);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  const handleSave = () => {
    const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
    const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;
    
    let duration = 0;
    let timeRange = '';
    
    if (selectedRadioButtonValue === 'Date') {
      duration = calculateDuration(startTime, endTime);
      timeRange = `${startTime} - ${endTime}`;
    }
  
    const booking: Bookingtype = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      bookingPreference: selectedRadioButtonValue,
      startTime: selectedRadioButtonValue === 'Date' ? startTime : undefined,
      endTime: selectedRadioButtonValue === 'Date' ? endTime : undefined,
      timeRange: selectedRadioButtonValue === 'Date' ? timeRange : undefined,
      duration: selectedRadioButtonValue === 'Date' ? duration : undefined,
    };
  
    if (selectedRadioButtonValue === 'Date') {
      setOpenServiceDialog(true);
    } 
    
    if (selectedRadioButtonValue !== 'Date') {
      sendDataToParent(DETAILS);
    }
  
    console.log('------- BOOKING------------', booking);
    dispatch(add(booking));
  };
//   const handleSave = () => {
//   const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
//   const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;
  
//   let duration = 0;
//   let timeRange = '';
  
//   if (selectedRadioButtonValue === 'Date') {
//     duration = calculateDuration(startTime, endTime);
//     timeRange = `${startTime} - ${endTime}`;
//   }

//   const booking: Bookingtype = {
//     startDate: formattedStartDate,
//     endDate: formattedEndDate,
//     bookingPreference: selectedRadioButtonValue,
//     startTime: selectedRadioButtonValue === 'Date' ? startTime : undefined,
//     endTime: selectedRadioButtonValue === 'Date' ? endTime : undefined,
//     timeRange: selectedRadioButtonValue === 'Date' ? timeRange : undefined,
//     duration: selectedRadioButtonValue === 'Date' ? duration : undefined,
//   };

//   dispatch(add(booking));
  
//   if (selectedRadioButtonValue === 'Date') {
//     setOpenServiceDialog(true);
//   } else {
//     // For Monthly or Short term, send data to parent to show DetailsView
//     bookingType(selectedType); // Send the selected role type
//     sendDataToParent(DETAILS); // Signal to show DetailsView
//     handleClose(); // Close the modal
//   }
// };

  const calculateDuration = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const getSelectedValue = (value: string) => {
    setSelectedRadioButtonValue(value);
    setStartDate(null);
    setEndDate(null);
  };

  const getMaxEndDate = () => {
    if (!startDate) return new Date();
    const maxDate = new Date(startDate);
    if (selectedRadioButtonValue === 'Monthly') {
      maxDate.setDate(maxDate.getDate() + 31);
    } else {
      maxDate.setDate(maxDate.getDate() + 15);
    }
    return maxDate;
  };

  const isConfirmDisabled = () => {
    if (selectedRadioButtonValue === 'Date') {
      return !(startDate && startTime.trim() !== '' && endTime.trim() !== '');
    } else if (selectedRadioButtonValue === 'Short term') {
      return !(startDate && endDate);
    } else if (selectedRadioButtonValue === 'Monthly') {
      return !startDate;
    }
    return true;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedRadioButtonValue === 'Monthly') {
        const endDate = new Date(selectedDate);
        endDate.setMonth(endDate.getMonth() + 1);
        setEndDate(endDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(formatTime(selectedTime));
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(formatTime(selectedTime));
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.selectorsContainer}>
        <TouchableOpacity style={styles.selector} onPress={() => handleClick(COOK)}>
          <Image source={require('../assets/images/newCook.png')} style={styles.selectorImage} />
          <Text style={styles.labelText}>Cook</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selector} onPress={() => handleClick(MAID)}>
          <Image source={require('../assets/images/newMaid.png')} style={styles.selectorImage} />
          <Text style={styles.labelText}>Maid</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selector} onPress={() => handleClick(NANNY)}>
          <Image source={require('../assets/images/newNanny.png')} style={styles.selectorImage} />
          <Text style={styles.labelText}>Nanny</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your Booking</Text>
            
            <Text style={styles.sectionTitle}>Book by</Text>
            <RadioButton.Group
              onValueChange={getSelectedValue}
              value={selectedRadioButtonValue}
            >
              <View style={styles.radioOption}>
                <RadioButton value="Date" />
                <Text>Date</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="Short term" />
                <Text>Short term</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="Monthly" />
                <Text>Monthly</Text>
              </View>
            </RadioButton.Group>

            {selectedRadioButtonValue === 'Date' && (
              <ScrollView>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{startDate ? startDate.toDateString() : 'Select date'}</Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                  />
                )}

                <View style={styles.timeContainer}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <TouchableOpacity 
                      style={[styles.timeInput, startTime ? styles.selectedInput : {}]}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text>{startTime || 'Select time'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <TouchableOpacity 
                      style={[styles.timeInput, endTime ? styles.selectedInput : {}]}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Text>{endTime || 'Select time'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showStartTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="default"
                    onChange={onStartTimeChange}
                  />
                )}

                {showEndTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="default"
                    onChange={onEndTimeChange}
                  />
                )}
              </ScrollView>
            )}

            {selectedRadioButtonValue === 'Short term' && (
              <ScrollView>
                <View style={styles.dateBlockContainer}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TouchableOpacity 
                      style={styles.dateInput} 
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Text>{startDate ? startDate.toDateString() : 'Select date'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TouchableOpacity 
                      style={styles.dateInput} 
                      onPress={() => setShowEndDatePicker(true)}
                      disabled={!startDate}
                    >
                      <Text>{endDate ? endDate.toDateString() : 'Select date'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                    minimumDate={startDate || new Date()}
                    maximumDate={getMaxEndDate()}
                  />
                )}
              </ScrollView>
            )}

            {selectedRadioButtonValue === 'Monthly' && (
              <ScrollView>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{startDate ? startDate.toDateString() : 'Select date'}</Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {endDate && (
                  <View style={styles.dateInfo}>
                    <Text>End Date: {endDate.toDateString()}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isConfirmDisabled() ? styles.disabledButton : {}]} 
                onPress={handleSave}
                disabled={isConfirmDisabled()}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedType === 'cook' && (
        <CookServiceDialog 
          visible={openServiceDialog}
          onClose={() => setOpenServiceDialog(false)} open={false} handleClose={function (): void {
            throw new Error('Function not implemented.');
          } }        />
      )}
      {selectedType === 'maid' && (
        <MaidServiceDialog 
          visible={openServiceDialog} 
          onClose={() => setOpenServiceDialog(false)} 
        />
      )}
      {selectedType === 'nanny' && (
        <NannyServiceDialog 
          visible={openServiceDialog} 
          onClose={() => setOpenServiceDialog(false)} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', // vertically center
    alignItems: 'center', // horizontally center
  },
  selectorsContainer: {
    gap: 50,
    flexDirection: 'column',
    // justifyContent: 'space-around',
  },
  selector: {
    alignItems: 'center',
  },
  selectorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  labelText: {
    marginTop: 8,
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  selectedInput: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  timeInputContainer: {
    width: '45%',
  },
  timeLabel: {
    marginBottom: 5,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  dateBlockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    width: '48%',
  },
  dateLabel: {
    marginBottom: 5,
  },
  dateInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  label: {
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Landingpage;