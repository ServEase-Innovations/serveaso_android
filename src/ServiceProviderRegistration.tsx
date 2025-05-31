// ServiceProviderRegistration.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';
import { CheckBox } from 'react-native-elements';
import { RadioButton } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'react-native-image-picker';
import axios from 'axios';

// Define interfaces
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  emailId: string;
  password: string;
  confirmPassword: string;
  mobileNo: string;
  AlternateNumber: string;
  address: string;
  buildingName: string;
  locality: string;
  street: string;
  currentLocation: string;
  nearbyLocation: string;
  pincode: string;
  AADHAR: string;
  pan: string;
  agreeToTerms: boolean;
  panImage: any;
  housekeepingRole: string;
  description: string;
  experience: string;
  kyc: string;
  documentImage: any;
  otherDetails: string;
  profileImage: any;
  cookingSpeciality: string;
  age: string;
  diet: string;
  dob: string;
  profilePic: string;
  timeslot: string;
  referralCode: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface ServiceProviderRegistrationProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: () => void;
}

const availableLanguages = [
  "Assamese",
  "Bengali",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Marathi",
  "Malayalam",
  "Oriya",
  "Punjabi",
  "Sanskrit",
  "Tamil",
  "Telugu",
  "Urdu",
  "Sindhi",
  "Konkani",
  "Nepali",
  "Manipuri",
  "Bodo",
  "Dogri",
  "Maithili",
  "Santhali",
];

const steps = [
  'Basic Information',
  'Address Information',
  'Additional Details',
  'KYC Verification',
  'Confirmation',
];

const ServiceProviderRegistration: React.FC<ServiceProviderRegistrationProps> = ({ 
  onBackToLogin, 
  onRegistrationSuccess 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCookSelected, setIsCookSelected] = useState(false);
  const [sliderDisabled, setSliderDisabled] = useState(true);
  const [sliderValueMorning, setSliderValueMorning] = useState([6, 12]);
  const [sliderValueEvening, setSliderValueEvening] = useState([12, 20]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [image, setImage] = useState<any>(null);
  const [documentImage, setDocumentImage] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    mobileNo: '',
    AlternateNumber: '',
    address: '',
    buildingName: '',
    locality: '',
    street: '',
    currentLocation: '',
    nearbyLocation: '',
    pincode: '',
    AADHAR: '',
    pan: '',
    agreeToTerms: false,
    panImage: null,
    housekeepingRole: '',
    description: '',
    experience: '',
    kyc: 'AADHAR',
    documentImage: null,
    otherDetails: '',
    profileImage: null,
    cookingSpeciality: '',
    age: '',
    diet: '',
    dob: '',
    profilePic: '',
    timeslot: '06:00-20:00',
    referralCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Regex patterns
  const nameRegex = /^[A-Za-z\s]+$/;
  const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const phoneRegex = /^[0-9]{10}$/;
  const pincodeRegex = /^[0-9]{6}$/;
  const aadhaarRegex = /^[0-9]{12}$/;

  const handleBackLogin = () => {
    onBackToLogin();
  };

  const handleImageSelect = async () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0].uri) {
        const source = { uri: response.assets[0].uri };
        setImage(source);
        setFormData({ ...formData, profileImage: source });
      }
    });
  };

  const handleDocumentImageSelect = async () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0].uri) {
        const source = { uri: response.assets[0].uri };
        setDocumentImage(source);
        setFormData({ ...formData, documentImage: source });
      }
    });
  };

  const fetchLocationData = async () => {
    Alert.alert(
      'Location',
      'Fetching location is not implemented in this example. You would use react-native-geolocation-service in a real app.',
      [{ text: 'OK' }]
    );
  };

  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, housekeepingRole: value });
    setIsCookSelected(value === 'COOK');
    if (value !== 'COOK') {
      setFormData({ ...formData, housekeepingRole: value, cookingSpeciality: '' });
    }
  };

  const handleCookingSpecialityChange = (value: string) => {
    setFormData({ ...formData, cookingSpeciality: value });
  };

  const handledietChange = (value: string) => {
    setFormData({ ...formData, diet: value });
  };

  const handleChange = (name: string, value: string | boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleRealTimeValidation = (name: string, value: string) => {
    let error = '';

    if (name === 'password') {
      if (value.length < 8) {
        error = 'Password must be at least 8 characters long.';
      } else if (!/[A-Z]/.test(value)) {
        error = 'Password must contain at least one uppercase letter.';
      } else if (!/[a-z]/.test(value)) {
        error = 'Password must contain at least one lowercase letter.';
      } else if (!/[0-9]/.test(value)) {
        error = 'Password must contain at least one digit.';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        error = 'Password must contain at least one special character.';
      }
    } else if (name === 'confirmPassword') {
      if (value !== formData.password) {
        error = 'Passwords do not match';
      }
    } else if (name === 'emailId') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        error = 'Please enter a valid email address.';
      }
    } else if (name === 'mobileNo') {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(value)) {
        error = 'Please enter a valid 10-digit mobile number.';
      }
    } else if (name === 'AADHAR') {
      const aadhaarPattern = /^[0-9]{12}$/;
      if (!aadhaarPattern.test(value)) {
        error = 'AADHAR number must be exactly 12 digits.';
      }
    } else if (name === 'pincode') {
      const pincodePattern = /^[0-9]{6}$/;
      if (!pincodePattern.test(value)) {
        error = 'Pincode must be exactly 6 digits.';
      }
    }

    setErrors({ ...errors, [name]: error });
    setFormData({ ...formData, [name]: value });
  };

  const validateAge = (dob: string) => {
    if (!dob) return false;

    const birthDate = moment(dob, 'YYYY-MM-DD');
    const today = moment();
    const age = today.diff(birthDate, 'years');

    console.log('Entered DOB:', dob);
    console.log('Calculated Age:', age);

    return age >= 18;
  };

  const handleDOBChange = (dob: string) => {
    setFormData({ ...formData, dob });

    const isValidAge = validateAge(dob);

    if (!isValidAge) {
      setIsFieldsDisabled(true);
      Alert.alert('Error', 'You must be at least 18 years old to proceed.');
    } else {
      setIsFieldsDisabled(false);
    }
  };

  const validateForm = (): boolean => {
    let tempErrors: FormErrors = {};

    if (activeStep === 0) {
      if (!formData.firstName || !nameRegex.test(formData.firstName)) {
        tempErrors.firstName = 'First Name is required and should contain only alphabets.';
      }
      if (!formData.lastName || !nameRegex.test(formData.lastName)) {
        tempErrors.lastName = 'Last Name is required and should contain only alphabets.';
      }
      if (!formData.gender) {
        tempErrors.gender = 'Please select a gender.';
      }
      if (!formData.emailId || !emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = 'Valid email is required.';
      }
      if (!formData.password || !strongPasswordRegex.test(formData.password)) {
        tempErrors.password = 'Password is required.';
      }
      if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match.';
      }
      if (!formData.mobileNo || !phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = 'Phone number is required.';
      }
    }

    if (activeStep === 1) {
      if (!formData.address) {
        tempErrors.address = 'Address is required.';
      }
      if (!formData.buildingName) {
        tempErrors.buildingName = 'Building Name is required.';
      }
      if (!formData.locality) {
        tempErrors.locality = 'Locality is required.';
      }
      if (!formData.street) {
        tempErrors.street = 'Street is required.';
      }
      if (!formData.currentLocation) {
        tempErrors.currentLocation = 'Current Location is required.';
      }
      if (!formData.pincode || !pincodeRegex.test(formData.pincode)) {
        tempErrors.pincode = 'Pin Code is required';
      }
    }

    if (activeStep === 2) {
      if (!formData.agreeToTerms) {
        tempErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy.';
      }
      if (!formData.housekeepingRole) {
        tempErrors.housekeepingRole = 'Please select a service type.';
      }
      if (formData.housekeepingRole === 'COOK' && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality = 'Please select a speciality for the cook service.';
      }
      if (!formData.diet) {
        tempErrors.diet = 'Please select diet';
      }

      if (!formData.experience) {
        tempErrors.experience = 'Please select experience';
      } else {
        const experienceRegex = /^[0-9]+$/;
        if (!experienceRegex.test(formData.experience)) {
          tempErrors.experience = 'Experience only accepts numbers.';
        } else {
          const experienceRangeRegex = /^([0-9]|[1-4][0-9]|50)$/;
          if (!experienceRangeRegex.test(formData.experience)) {
            tempErrors.experience = 'Experience must be between 0 and 50 years.';
          }
        }
      }
    }

    if (activeStep === 3) {
      if (!formData.AADHAR || !aadhaarRegex.test(formData.AADHAR)) {
        tempErrors.kyc = 'Aadhaar number must be exactly 12 digits.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    if (activeStep === 0) {
      const isValidAge = validateAge(formData.dob);
      if (!isValidAge) {
        Alert.alert('Error', 'You must be at least 18 years old to proceed');
        return;
      }
    }

    setActiveStep(Math.min(activeStep + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(Math.max(activeStep - 1, 0));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Filter out empty values
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      // In a real app, you would upload the image first and then submit the form
      // This is a simplified version
      
      Alert.alert('Success', 'Registration successful!');
      onRegistrationSuccess();
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormTimeSlot = (morningRange: number[], eveningRange: number[]) => {
    const startMorning = formatDisplayTime(morningRange[0]);
    const endMorning = formatDisplayTime(morningRange[1]);
    const startEvening = formatDisplayTime(eveningRange[0]);
    const endEvening = formatDisplayTime(eveningRange[1]);

    const formattedTimeSlot = `${startMorning}-${endMorning}, ${startEvening}-${endEvening}`;
    setFormData({ ...formData, timeslot: formattedTimeSlot });
  };

  const formatDisplayTime = (value: number) => {
    const hour = Math.floor(value);
    const minutes = value % 1 === 0.5 ? '30' : '00';
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minutes}`;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ScrollView style={styles.stepContainer}>
            {/* Profile Image Upload */}
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={handleImageSelect} style={styles.imageUploadButton}>
                {image ? (
                  <Image source={image} style={styles.profileImage} />
                ) : (
                  <Text style={styles.imageUploadText}>Upload Profile Image</Text>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="First Name *"
              value={formData.firstName}
              onChangeText={(text) => handleRealTimeValidation('firstName', text)}
              editable={!isFieldsDisabled}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Middle Name"
              value={formData.middleName}
              onChangeText={(text) => handleChange('middleName', text)}
              editable={!isFieldsDisabled}
            />

            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Last Name *"
              value={formData.lastName}
              onChangeText={(text) => handleRealTimeValidation('lastName', text)}
              editable={!isFieldsDisabled}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            {/* Date Picker - Using TextInput for simplicity */}
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD) *"
              value={formData.dob}
              onChangeText={(text) => handleDOBChange(text)}
            />

            <Text style={styles.label}>Gender *</Text>
            <RadioButton.Group
              onValueChange={(value) => handleChange('gender', value)}
              value={formData.gender}
            >
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton value="MALE" disabled={isFieldsDisabled} />
                  <Text>Male</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="FEMALE" disabled={isFieldsDisabled} />
                  <Text>Female</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="OTHER" disabled={isFieldsDisabled} />
                  <Text>Other</Text>
                </View>
              </View>
            </RadioButton.Group>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

            <TextInput
              style={[styles.input, errors.emailId && styles.inputError]}
              placeholder="Email *"
              value={formData.emailId}
              onChangeText={(text) => handleRealTimeValidation('emailId', text)}
              keyboardType="email-address"
              editable={!isFieldsDisabled}
            />
            {errors.emailId && <Text style={styles.errorText}>{errors.emailId}</Text>}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password *"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleRealTimeValidation('password', text)}
                editable={!isFieldsDisabled}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password *"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => handleRealTimeValidation('confirmPassword', text)}
                editable={!isFieldsDisabled}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TextInput
              style={[styles.input, errors.mobileNo && styles.inputError]}
              placeholder="Mobile Number *"
              value={formData.mobileNo}
              onChangeText={(text) => handleRealTimeValidation('mobileNo', text)}
              keyboardType="phone-pad"
              editable={!isFieldsDisabled}
            />
            {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Alternate Number"
              value={formData.AlternateNumber}
              onChangeText={(text) => handleChange('AlternateNumber', text)}
              keyboardType="phone-pad"
              editable={!isFieldsDisabled}
            />
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView style={styles.stepContainer}>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              placeholder="Address *"
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              multiline
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

            <TextInput
              style={[styles.input, errors.buildingName && styles.inputError]}
              placeholder="Building Name *"
              value={formData.buildingName}
              onChangeText={(text) => handleChange('buildingName', text)}
            />
            {errors.buildingName && <Text style={styles.errorText}>{errors.buildingName}</Text>}

            <TextInput
              style={[styles.input, errors.locality && styles.inputError]}
              placeholder="Locality *"
              value={formData.locality}
              onChangeText={(text) => handleChange('locality', text)}
            />
            {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}

            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              placeholder="Street *"
              value={formData.street}
              onChangeText={(text) => handleChange('street', text)}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}

            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              placeholder="Pincode *"
              value={formData.pincode}
              onChangeText={(text) => handleRealTimeValidation('pincode', text)}
              keyboardType="number-pad"
            />
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}

            <TextInput
              style={[styles.input, errors.currentLocation && styles.inputError]}
              placeholder="Current Location *"
              value={formData.currentLocation}
              onChangeText={(text) => handleChange('currentLocation', text)}
            />
            {errors.currentLocation && <Text style={styles.errorText}>{errors.currentLocation}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Nearby Location"
              value={formData.nearbyLocation}
              onChangeText={(text) => handleChange('nearbyLocation', text)}
            />

            <TouchableOpacity style={styles.button} onPress={fetchLocationData}>
              <Text style={styles.buttonText}>Fetch Location</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.label}>Select Service Type *</Text>
            <Picker
              selectedValue={formData.housekeepingRole}
              onValueChange={handleServiceTypeChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Service Type" value="" />
              <Picker.Item label="Cook" value="COOK" />
              <Picker.Item label="Nanny" value="NANNY" />
              <Picker.Item label="Maid" value="MAID" />
            </Picker>
            {errors.housekeepingRole && <Text style={styles.errorText}>{errors.housekeepingRole}</Text>}

            {isCookSelected && (
              <>
                <Text style={styles.label}>Cooking Speciality *</Text>
                <RadioButton.Group
                  onValueChange={handleCookingSpecialityChange}
                  value={formData.cookingSpeciality}
                >
                  <View style={styles.radioGroup}>
                    <View style={styles.radioOption}>
                      <RadioButton value="VEG" />
                      <View style={styles.radioLabel}>
                        <Image source={require('../assets/images/veg.png')} style={styles.icon} />
                        <Text>Veg</Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="NONVEG" />
                      <View style={styles.radioLabel}>
                        <Image source={require('../assets/images/nonveg.png')} style={styles.icon} />
                        <Text>Non-Veg</Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="BOTH" />
                      <Text>Both</Text>
                    </View>
                  </View>
                </RadioButton.Group>
                {errors.cookingSpeciality && <Text style={styles.errorText}>{errors.cookingSpeciality}</Text>}
              </>
            )}

            <Text style={styles.label}>Diet *</Text>
            <RadioButton.Group
              onValueChange={handledietChange}
              value={formData.diet}
            >
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton value="VEG" />
                  <View style={styles.radioLabel}>
                    <Image source={require('../assets/images/veg.png')} style={styles.icon} />
                    <Text>Veg</Text>
                  </View>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="NONVEG" />
                  <View style={styles.radioLabel}>
                    <Image source={require('../assets/images/nonveg.png')} style={styles.icon} />
                    <Text>Non-Veg</Text>
                  </View>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="BOTH" />
                  <Text>Both</Text>
                </View>
              </View>
            </RadioButton.Group>
            {errors.diet && <Text style={styles.errorText}>{errors.diet}</Text>}

            <Text style={styles.label}>Languages</Text>
            <Text style={styles.note}>Note: Languages selection UI would be implemented here</Text>

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              multiline
              numberOfLines={4}
            />

            <TextInput
              style={[styles.input, errors.experience && styles.inputError]}
              placeholder="Experience *"
              value={formData.experience}
              onChangeText={(text) => handleChange('experience', text)}
              keyboardType="numeric"
            />
            {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Referral Code (Optional)"
              value={formData.referralCode}
              onChangeText={(text) => handleChange('referralCode', text)}
            />

            <Text style={styles.label}>Select Time Slot</Text>
            <CheckBox
              title="Choose Full Time Availability (6:00 AM - 8:00 PM)"
              checked={formData.timeslot === "06:00-20:00"}
              onPress={() => {
                if (formData.timeslot === "06:00-20:00") {
                  setFormData({ ...formData, timeslot: "" });
                  setSliderDisabled(false);
                } else {
                  setFormData({ ...formData, timeslot: "06:00-20:00" });
                  setSliderDisabled(true);
                }
              }}
            />

            <Text style={styles.sliderLabel}>Morning (6:00 AM - 12:00 PM)</Text>
            <Slider
              minimumValue={6}
              maximumValue={12}
              step={0.5}
              minimumTrackTintColor={sliderDisabled ? '#cccccc' : '#1fb28a'}
              maximumTrackTintColor={sliderDisabled ? '#cccccc' : '#d3d3d3'}
              thumbTintColor={sliderDisabled ? '#cccccc' : '#1fb28a'}
              disabled={sliderDisabled}
              value={sliderValueMorning[0]}
              onValueChange={(value:any) => {
                const newRange = [value, sliderValueMorning[1]];
                setSliderValueMorning(newRange);
                updateFormTimeSlot(newRange, sliderValueEvening);
              }}
            />
            <Text style={styles.sliderValue}>
              {formatDisplayTime(sliderValueMorning[0])} - {formatDisplayTime(sliderValueMorning[1])}
            </Text>

            <Text style={styles.sliderLabel}>Evening (12:00 PM - 8:00 PM)</Text>
            <Slider
              minimumValue={12}
              maximumValue={20}
              step={0.5}
              minimumTrackTintColor={sliderDisabled ? '#cccccc' : '#1fb28a'}
              maximumTrackTintColor={sliderDisabled ? '#cccccc' : '#d3d3d3'}
              thumbTintColor={sliderDisabled ? '#cccccc' : '#1fb28a'}
              disabled={sliderDisabled}
              value={sliderValueEvening[0]}
              onValueChange={(value:any) => {
                const newRange = [value, sliderValueEvening[1]];
                setSliderValueEvening(newRange);
                updateFormTimeSlot(sliderValueMorning, newRange);
              }}
            />
            <Text style={styles.sliderValue}>
              {formatDisplayTime(sliderValueEvening[0])} - {formatDisplayTime(sliderValueEvening[1])}
            </Text>

            <CheckBox
              title="I agree to the Terms of Service and Privacy Policy *"
              checked={formData.agreeToTerms}
              onPress={() => handleChange('agreeToTerms', !formData.agreeToTerms)}
            />
            {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms}</Text>}
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView style={styles.stepContainer}>
            <TextInput
              style={[styles.input, errors.kyc && styles.inputError]}
              placeholder="Aadhaar Number *"
              value={formData.AADHAR}
              onChangeText={(text) => handleRealTimeValidation('AADHAR', text)}
              keyboardType="numeric"
            />
            {errors.kyc && <Text style={styles.errorText}>{errors.kyc}</Text>}

            <Text style={styles.label}>Upload Document Image *</Text>
            <TouchableOpacity style={styles.button} onPress={handleDocumentImageSelect}>
              <Text style={styles.buttonText}>Select Document Image</Text>
            </TouchableOpacity>
            {documentImage && (
              <View style={styles.documentPreview}>
                <Image source={documentImage} style={styles.documentImage} />
                <Text style={styles.documentName}>Document Selected</Text>
              </View>
            )}
          </ScrollView>
        );

      case 4:
        return (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>
              All steps completed - You're ready to submit your information!
            </Text>
          </View>
        );

      default:
        return <Text>Unknown step</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Provider Registration</Text>
      
      {/* Stepper */}
      <View style={styles.stepperContainer}>
        {steps.map((label, index) => (
          <View key={index} style={styles.stepIndicatorContainer}>
            <View
              style={[
                styles.stepIndicator,
                index <= activeStep ? styles.activeStep : styles.inactiveStep,
              ]}
            >
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.stepLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Form Content */}
      {renderStepContent(activeStep)}

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {activeStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {activeStep < steps.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleBackLogin}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    width: '20%',
    marginBottom: 10,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeStep: {
    backgroundColor: '#1fb28a',
  },
  inactiveStep: {
    backgroundColor: '#cccccc',
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  stepContainer: {
    flex: 1,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  picker: {
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  button: {
    backgroundColor: '#1fb28a',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#1fb28a',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#1fb28a',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageUploadButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  imageUploadText: {
    color: '#666',
    textAlign: 'center',
  },
  documentPreview: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  documentImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  documentName: {
    marginTop: 5,
    color: '#666',
  },
  sliderLabel: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  sliderValue: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#1fb28a',
    fontWeight: 'bold',
  },
  note: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#1fb28a',
  },
  chipText: {
    color: '#333',
  },
  selectedChipText: {
    color: '#fff',
  },
});

export default ServiceProviderRegistration;