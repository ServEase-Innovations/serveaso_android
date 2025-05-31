import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const BookingForm = ({ onSearch }: { onSearch: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    serviceType: 'Regular',
    startTime: '',
    endTime: '',
  });

  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [serviceTypePickerVisible, setServiceTypePickerVisible] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Form Submitted:', formData);
    onSearch(formData);
  };

  const onTimeChange = (field: 'startTime' | 'endTime', event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      handleChange(field, `${hours}:${minutes}`);
    }
    setStartTimePickerVisible(false);
    setEndTimePickerVisible(false);
  };

  return (
    <View style={styles.fields}>
      {/* Service Type */}
      <View style={styles.field}>
        <View style={styles.inputWithLabel}>
          <Text style={styles.inlineLabel}>Service Type</Text>
          <Pressable style={styles.selectBox} onPress={() => setServiceTypePickerVisible(true)}>
            <Text style={styles.selectedText}>{formData.serviceType}</Text>
          </Pressable>

          {/* Service Type Modal */}
          {serviceTypePickerVisible && (
            <Modal transparent animationType="slide" visible={serviceTypePickerVisible}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handleChange('serviceType', 'Regular');
                      setServiceTypePickerVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>Regular</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handleChange('serviceType', 'Premium');
                      setServiceTypePickerVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>Premium</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>

      {/* Start Time */}
      <View style={styles.field}>
        <View style={styles.inputWithLabel}>
          <Text style={styles.inlineLabel}>Start Time</Text>
          <Pressable style={styles.selectBox} onPress={() => setStartTimePickerVisible(true)}>
            <Text style={styles.selectedText}>{formData.startTime || 'Select Start Time'}</Text>
          </Pressable>
          {startTimePickerVisible && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => onTimeChange('startTime', e, date)}
            />
          )}
        </View>
      </View>

      {/* End Time */}
      <View style={styles.field}>
        <View style={styles.inputWithLabel}>
          <Text style={styles.inlineLabel}>End Time</Text>
          <Pressable style={styles.selectBox} onPress={() => setEndTimePickerVisible(true)}>
            <Text style={styles.selectedText}>{formData.endTime || 'Select End Time'}</Text>
          </Pressable>
          {endTimePickerVisible && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => onTimeChange('endTime', e, date)}
            />
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSubmit}>
        <Text style={styles.searchButtonText}>SEARCH</Text>
      </TouchableOpacity>
    </View>
  );
};

const HeaderSearch = ({ onSearch }: { onSearch: (data: any) => void }) => {
  return (
    <View style={styles.headerSearch}>
      <BookingForm onSearch={onSearch} />
    </View>
  );
};

export default HeaderSearch;

const styles = StyleSheet.create({
  headerSearch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fields: {
    flexDirection: 'row',
    flexWrap: width < 600 ? 'wrap' : 'nowrap',
    gap: width < 600 ? 10 : 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
  },
  inputWithLabel: {
    position: 'relative',
    width: width < 600 ? 90 : 120,
  },
  inlineLabel: {
    position: 'absolute',
    top: width < 600 ? 2 : 6,
    left: width < 600 ? 8 : 12,
    fontSize: width < 600 ? 10 : 12,
    color: '#999',
    zIndex: 1,
  },
  selectBox: {
    marginTop: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingVertical: width < 600 ? 8 : 18,
    paddingHorizontal: width < 600 ? 6 : 8,
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: width < 600 ? 12 : 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: width < 600 ? 4 : 8,
    paddingHorizontal: width < 600 ? 10 : 16,
    borderRadius: 4,
    marginTop: 10,
    alignSelf: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: width < 600 ? 10 : 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: width * 0.8, // dynamic width: 80% of the screen
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  option: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 16,
    color: '#007bff',
  },
  
});
