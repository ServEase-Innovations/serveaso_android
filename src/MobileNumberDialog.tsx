import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import axiosInstance from './axiosInstance'; 
import { useAppUser } from './context/AppUserContext';

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
}

interface MobileNumberDialogProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const MobileNumberDialog: React.FC<MobileNumberDialogProps> = ({ onSuccess, onClose }) => {
  const [open, setOpen] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [altContactNumber, setAltContactNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
  });
  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
  });

  const { appUser } = useAppUser();

  // Refs for debounced validation timeouts
  const contactTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const altContactTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setOpen(true);
  }, []);

  // Validate mobile number format
  const validateMobileFormat = (number: string): boolean => {
    const mobilePattern = /^[0-9]{10}$/;
    return mobilePattern.test(number);
  };

  // Check if mobile number is available
  const checkMobileAvailability = async (
    number: string,
    isAlternate: boolean = false
  ): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) {
      return false;
    }

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;

    setValidation({
      loading: true,
      error: '',
      isAvailable: null,
    });

    try {
      // Use different endpoints for mobile and alternate number validation
      const endpoint = isAlternate
        ? `/api/serviceproviders/check-alternate/${encodeURIComponent(number)}`
        : `/api/serviceproviders/check-mobile/${encodeURIComponent(number)}`;

      const response = await axiosInstance.get(endpoint);

      const isAvailable = response.data.available !== false;

      setValidation({
        loading: false,
        error: isAvailable ? '' : `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`,
        isAvailable,
      });

      return isAvailable;
    } catch (error: any) {
      console.error('Error validating mobile number:', error);

      let errorMessage = `Error checking ${isAlternate ? 'alternate' : 'mobile'} number`;
      if (error.response?.status === 409) {
        errorMessage = `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable: false,
      });

      return false;
    }
  };

  // Debounced validation for mobile numbers
  const debouncedValidation = (number: string, isAlternate: boolean = false) => {
    const timeoutRef = isAlternate ? altContactTimeoutRef : contactTimeoutRef;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      checkMobileAvailability(number, isAlternate);
    }, 500);
  };

  // Handle contact number change
  const handleContactNumberChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setContactNumber(numericValue);

    if (numericValue.length === 10) {
      debouncedValidation(numericValue, false);

      // Also check if alternate number is same as contact number
      if (altContactNumber === numericValue) {
        setAltContactValidation((prev) => ({
          ...prev,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
        }));
      } else if (
        altContactNumber &&
        altContactValidation.error === 'Alternate number cannot be same as contact number'
      ) {
        // Clear the error if numbers are now different
        setAltContactValidation((prev) => ({
          ...prev,
          error: '',
          isAvailable: null,
        }));
        // Re-validate alternate number
        if (validateMobileFormat(altContactNumber)) {
          debouncedValidation(altContactNumber, true);
        }
      }
    } else {
      setContactValidation({
        loading: false,
        error: numericValue ? 'Please enter a valid 10-digit mobile number' : '',
        isAvailable: null,
      });
    }
  };

  // Handle alternate contact number change
  const handleAltContactNumberChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setAltContactNumber(numericValue);

    if (numericValue && numericValue.length === 10) {
      // Check if alternate number is same as contact number
      if (numericValue === contactNumber) {
        setAltContactValidation({
          loading: false,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
        });
      } else {
        debouncedValidation(numericValue, true);
      }
    } else {
      setAltContactValidation({
        loading: false,
        error: numericValue ? 'Please enter a valid 10-digit mobile number' : '',
        isAvailable: null,
      });
    }
  };

  // Check if numbers are unique
  const areNumbersUnique = (): boolean => {
    if (!contactNumber || !altContactNumber) return true;
    return contactNumber !== altContactNumber;
  };

  // Validate all fields before submission
  const validateAllFields = async (): Promise<boolean> => {
    // Validate contact number
    if (!validateMobileFormat(contactNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit contact number');
      return false;
    }

    // Validate alternate number if provided
    if (altContactNumber && !validateMobileFormat(altContactNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit alternate contact number');
      return false;
    }

    // Check uniqueness
    if (!areNumbersUnique()) {
      Alert.alert('Validation Error', 'Contact number and alternate contact number must be different');
      return false;
    }

    // Check contact number availability
    const isContactAvailable = await checkMobileAvailability(contactNumber, false);
    if (!isContactAvailable) {
      Alert.alert('Validation Error', 'Contact number is not available');
      return false;
    }

    // Check alternate number availability if provided
    if (altContactNumber) {
      const isAltContactAvailable = await checkMobileAvailability(altContactNumber, true);
      if (!isAltContactAvailable) {
        Alert.alert('Validation Error', 'Alternate contact number is not available');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Dismiss keyboard before submission
    Keyboard.dismiss();

    // Validate all fields before submission
    const isValid = await validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      if (!appUser?.customerid) {
        console.error('❌ Customer ID not found in appUser');
        Alert.alert('Error', 'Customer ID not found!');
        setLoading(false);
        return;
      }

      // Prepare payload conditionally
      const payload: any = {};
      if (contactNumber) payload.mobileNo = contactNumber;
      if (altContactNumber) payload.alternateNo = altContactNumber;

      console.log(' Sending update payload:', payload);

      // Try to update customer first
      let response;
      try {
        response = await axiosInstance.put(
          `/api/customer/update-customer/${appUser.customerid}`,
          payload
        );
        console.log('✅ Customer updated successfully:', response.data);
      } catch (updateError: any) {
        // If update fails with 404, try to create the customer
        if (updateError.response?.status === 404) {
          console.log('🆕 Customer not found, creating new customer...');
          
          // Create new customer with the provided data
          const createPayload = {
            customerId: appUser.customerid,
            email: appUser.email,
            name: appUser.name,
            ...payload
          };
          
          response = await axiosInstance.post(
            '/api/customer/create-customer',
            createPayload
          );
          console.log('✅ Customer created successfully:', response.data);
        } else {
          throw updateError;
        }
      }

      Alert.alert('Success', 'Mobile number(s) updated successfully!');
      setOpen(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ Error updating mobile numbers:', error);
      let errorMessage = 'Something went wrong while updating!';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    const basicValidation =
      validateMobileFormat(contactNumber) &&
      contactValidation.isAvailable !== false &&
      (altContactNumber === '' || validateMobileFormat(altContactNumber)) &&
      areNumbersUnique();

    // For alternate number, check availability only if it's provided and valid
    const altNumberValidation =
      altContactNumber === '' ||
      (validateMobileFormat(altContactNumber) &&
        altContactValidation.isAvailable !== false &&
        areNumbersUnique());

    return basicValidation && altNumberValidation;
  };

  const renderValidationIcon = (validation: ValidationState) => {
    if (validation.loading) {
      return <ActivityIndicator size="small" color="#007AFF" />;
    } else if (validation.isAvailable) {
      return <Text style={styles.successIcon}>✓</Text>;
    } else if (validation.isAvailable === false) {
      return <Text style={styles.errorIcon}>✗</Text>;
    }
    return null;
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (contactTimeoutRef.current) {
        clearTimeout(contactTimeoutRef.current);
      }
      if (altContactTimeoutRef.current) {
        clearTimeout(altContactTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    // Dismiss keyboard when closing
    Keyboard.dismiss();
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Update Contact Numbers</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Please enter your mobile and alternative contact numbers to continue.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (contactValidation.error || (contactNumber.length > 0 && contactNumber.length !== 10)) &&
                    styles.inputError,
                  ]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#999"
                  value={contactNumber}
                  onChangeText={handleContactNumberChange}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="next"
                  autoFocus={true}
                />
                <View style={styles.validationIcon}>
                  {renderValidationIcon(contactValidation)}
                </View>
              </View>
              {contactValidation.error ? (
                <Text style={styles.errorText}>{contactValidation.error}</Text>
              ) : contactNumber && contactNumber.length !== 10 ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : contactValidation.isAvailable ? (
                <Text style={styles.successText}>Contact number is available</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternative Contact Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (altContactValidation.error || (altContactNumber.length > 0 && altContactNumber.length !== 10)) &&
                    styles.inputError,
                  ]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#999"
                  value={altContactNumber}
                  onChangeText={handleAltContactNumberChange}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <View style={styles.validationIcon}>
                  {renderValidationIcon(altContactValidation)}
                </View>
              </View>
              {altContactValidation.error ? (
                <Text style={styles.errorText}>{altContactValidation.error}</Text>
              ) : altContactNumber && altContactNumber.length !== 10 ? (
                <Text style={styles.errorText}>Please enter exactly 10 digits</Text>
              ) : altContactValidation.isAvailable ? (
                <Text style={styles.successText}>Alternate number is available</Text>
              ) : null}
            </View>

            {!areNumbersUnique() && contactNumber && altContactNumber && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Contact number and alternate contact number must be different
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (loading || !isFormValid()) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
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
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
    lineHeight: 24,
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  validationIcon: {
    marginLeft: 8,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successIcon: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorIcon: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MobileNumberDialog;