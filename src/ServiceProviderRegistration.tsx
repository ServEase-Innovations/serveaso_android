// ServiceProviderRegistration.tsx
import React, { useState } from "react";
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
  KeyboardAvoidingView,
  Modal,
  Button,
} from "react-native";
import moment from "moment";
import { Picker } from "@react-native-picker/picker";
import { CheckBox } from "react-native-elements";
import { RadioButton } from "react-native-paper";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "react-native-image-picker";
import axios from "axios";
import axiosInstance from "./axiosInstance";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import { NativeModules, Linking } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

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
  "Basic Information",
  "Address Information",
  "Additional Details",
  "KYC Verification",
  "Confirmation",
];

const ServiceProviderRegistration: React.FC<
  ServiceProviderRegistrationProps
> = ({ onBackToLogin, onRegistrationSuccess }) => {
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
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    mobileNo: "",
    AlternateNumber: "",
    address: "",
    buildingName: "",
    locality: "",
    street: "",
    currentLocation: "",
    nearbyLocation: "",
    pincode: "",
    AADHAR: "",
    pan: "",
    agreeToTerms: false,
    panImage: null,
    housekeepingRole: "",
    description: "",
    experience: "",
    kyc: "AADHAR",
    documentImage: null,
    otherDetails: "",
    profileImage: null,
    cookingSpeciality: "",
    age: "",
    diet: "",
    dob: "",
    profilePic: "",
    timeslot: "06:00-20:00",
    referralCode: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Regex patterns
  const nameRegex = /^[A-Za-z\s]+$/;
  const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const phoneRegex = /^[0-9]{10}$/;
  const pincodeRegex = /^[0-9]{6}$/;
  const aadhaarRegex = /^[0-9]{12}$/;

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showGPSButton, setShowGPSButton] = useState(false);

  // Initialize Geocoder with your API key (put this right after imports)
  Geocoder.init("AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk");
  const fetchLocationData = async () => {
    try {
      // 1. Check and request location permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Location access is required. Please enable it in settings.",
          [
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      // 2. Check location services are enabled
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services to continue.",
          [
            {
              text: "Enable",
              onPress: () =>
                NativeModules.LocationSettings.showLocationSettingsDialog(),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      // 3. Show loading indicator
      Alert.alert("Fetching Location", "Getting your current location...");

      // 4. Get current position
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // 5. Reverse geocode to get address
          try {
            const res = await Geocoder.from(latitude, longitude);
            const address = res.results[0]?.formatted_address || "";

            // Extract address components
            let street = "";
            let locality = "";
            let pincode = "";

            res.results[0]?.address_components?.forEach((component) => {
              if (component.types.includes("route")) {
                street = component.long_name;
              }
              if (component.types.includes("locality")) {
                locality = component.long_name;
              }
              if (component.types.includes("postal_code")) {
                pincode = component.long_name;
              }
            });

            // 6. Update form fields
            setFormData((prev) => ({
              ...prev,
              address: address,
              currentLocation: address,
              street: street || prev.street,
              locality: locality || prev.locality,
              pincode: pincode || prev.pincode,
              latitude: latitude,
              longitude: longitude,
            }));

            Alert.alert("Success", "Location fetched successfully!");
          } catch (error) {
            console.error("Geocoding error:", error);
            Alert.alert("Error", "Could not determine address from location");
          }
        },
        (error) => {
          console.error("Location error:", error);
          Alert.alert("Error", "Failed to get location. Please try again.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      Alert.alert("Error", "Failed to fetch location. Please try again.");
    }
  };

  // Helper functions
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        const [fineStatus, coarseStatus] = await Promise.all([
          request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION),
          request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION),
        ]);
        return (
          fineStatus === RESULTS.GRANTED || coarseStatus === RESULTS.GRANTED
        );
      } else {
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn("Permission error:", err);
      return false;
    }
  };

  const checkLocationServices = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        return await NativeModules.LocationSettings.checkLocationServices();
      }
      return true;
    } catch (err) {
      console.warn("Services check error:", err);
      return false;
    }
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === "android") {
      try {
        const locationMode =
          await NativeModules.LocationSettings.getLocationMode();

        if (locationMode !== "high_accuracy") {
          Alert.alert(
            "High Accuracy Recommended",
            "For best results, please enable high accuracy location mode in your device settings.",
            [
              {
                text: "Open Settings",
                onPress: () =>
                  NativeModules.LocationSettings.openLocationSettings(),
              },
              { text: "Continue Anyway", onPress: () => {} },
            ]
          );
        }
      } catch (err) {
        console.warn("Error checking location accuracy:", err);
      }
    }
  };

  // const checkLocationServices = async (): Promise<boolean> => {
  //   try {
  //     if (Platform.OS === 'android') {
  //       return await NativeModules.LocationSettings.checkLocationServices();
  //     }
  //     return true;
  //   } catch (err) {
  //     console.warn('Error checking location services:', err);
  //     return false;
  //   }
  // };

  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await Geocoder.from(lat, lon);
      const addressComponent = res.results?.[0]?.formatted_address;
      const addressParts = res.results?.[0]?.address_components || [];

      if (addressComponent) {
        setAddress(addressComponent);

        // Extract address components
        let street = "";
        let locality = "";
        let pincode = "";

        addressParts.forEach((component) => {
          if (component.types.includes("route")) {
            street = component.long_name;
          }
          if (component.types.includes("locality")) {
            locality = component.long_name;
          }
          if (component.types.includes("postal_code")) {
            pincode = component.long_name;
          }
        });

        // Update form data with extracted components
        setFormData((prev) => ({
          ...prev,
          address: addressComponent,
          street: street || prev.street,
          locality: locality || prev.locality,
          pincode: pincode || prev.pincode,
          currentLocation: addressComponent,
          latitude: lat,
          longitude: lon,
        }));
      }
    } catch (error) {
      console.warn("Geocoder error:", error);
    }
  };

  const fetchLocation = () => {
    setLocationLoading(true);
    setShowGPSButton(false);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        getAddressFromCoords(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.warn("Location fetch error:", error);
        setLocationLoading(false);
        setShowGPSButton(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchLocationWithChecks = async () => {
    setLocationLoading(true);
    setLocationModalVisible(true);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Location access is required for this feature. Please enable it in settings.",
          [
            {
              text: "Open Settings",
              onPress: () =>
                NativeModules.LocationSettings.openLocationSettings(),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services to continue.",
          [
            {
              text: "Enable",
              onPress: () =>
                NativeModules.LocationSettings.showLocationSettingsDialog(),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        setShowGPSButton(true);
        return;
      }

      await checkLocationAccuracy();
      fetchLocation();
    } catch (error) {
      console.warn("Location fetch error:", error);
      setShowGPSButton(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
    fetchLocationWithChecks();
  };

  const handleBackLogin = () => {
    onBackToLogin();
  };

  const handleImageSelect = async () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: "photo",
      quality: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else if (response.assets && response.assets[0].uri) {
        const source = { uri: response.assets[0].uri };
        setImage(source);
        setFormData({ ...formData, profileImage: source });
      }
    });
  };

  const handleDocumentImageSelect = async () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: "photo",
      quality: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else if (response.assets && response.assets[0].uri) {
        const source = { uri: response.assets[0].uri };
        setDocumentImage(source);
        setFormData({ ...formData, documentImage: source });
      }
    });
  };

  // const fetchLocationData = async () => {
  //    fetchLocationWithChecks();
  //   Alert.alert(
  //     'Location',
  //     'Fetching location is not implemented in this example. You would use react-native-geolocation-service in a real app.',
  //     [{ text: 'OK' }]
  //   );
  // };

  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, housekeepingRole: value });
    setIsCookSelected(value === "COOK");
    if (value !== "COOK") {
      setFormData({
        ...formData,
        housekeepingRole: value,
        cookingSpeciality: "",
      });
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
    let error = "";

    if (name === "password") {
      if (value.length < 8) {
        error = "Password must be at least 8 characters long.";
      } else if (!/[A-Z]/.test(value)) {
        error = "Password must contain at least one uppercase letter.";
      } else if (!/[a-z]/.test(value)) {
        error = "Password must contain at least one lowercase letter.";
      } else if (!/[0-9]/.test(value)) {
        error = "Password must contain at least one digit.";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        error = "Password must contain at least one special character.";
      }
    } else if (name === "confirmPassword") {
      if (value !== formData.password) {
        error = "Passwords do not match";
      }
    } else if (name === "emailId") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        error = "Please enter a valid email address.";
      }
    } else if (name === "mobileNo") {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(value)) {
        error = "Please enter a valid 10-digit mobile number.";
      }
    } else if (name === "AADHAR") {
      const aadhaarPattern = /^[0-9]{12}$/;
      if (!aadhaarPattern.test(value)) {
        error = "AADHAR number must be exactly 12 digits.";
      }
    } else if (name === "pincode") {
      const pincodePattern = /^[0-9]{6}$/;
      if (!pincodePattern.test(value)) {
        error = "Pincode must be exactly 6 digits.";
      }
    }

    setErrors({ ...errors, [name]: error });
    setFormData({ ...formData, [name]: value });
  };

  const validateAge = (dob: string) => {
    if (!dob) return false;

    const birthDate = moment(dob, "YYYY-MM-DD");
    const today = moment();
    const age = today.diff(birthDate, "years");

    console.log("Entered DOB:", dob);
    console.log("Calculated Age:", age);

    return age >= 18;
  };

  const handleDOBChange = (dob: string) => {
    setFormData({ ...formData, dob });

    const isValidAge = validateAge(dob);

    if (!isValidAge) {
      setIsFieldsDisabled(true);
    } else {
      setIsFieldsDisabled(false);
    }
  };

  const validateForm = (): boolean => {
    let tempErrors: FormErrors = {};

    if (activeStep === 0) {
      if (!formData.firstName || !nameRegex.test(formData.firstName)) {
        tempErrors.firstName =
          "First Name is required and should contain only alphabets.";
      }
      if (!formData.lastName || !nameRegex.test(formData.lastName)) {
        tempErrors.lastName =
          "Last Name is required and should contain only alphabets.";
      }
      if (!formData.gender) {
        tempErrors.gender = "Please select a gender.";
      }
      if (!formData.emailId || !emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = "Valid email is required.";
      }
      if (!formData.password || !strongPasswordRegex.test(formData.password)) {
        tempErrors.password = "Password is required.";
      }
      if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match.";
      }
      if (!formData.mobileNo || !phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = "Phone number is required.";
      }
    }

    if (activeStep === 1) {
      if (!formData.address) {
        tempErrors.address = "Address is required.";
      }
      if (!formData.buildingName) {
        tempErrors.buildingName = "Building Name is required.";
      }
      if (!formData.locality) {
        tempErrors.locality = "Locality is required.";
      }
      if (!formData.street) {
        tempErrors.street = "Street is required.";
      }
      if (!formData.currentLocation) {
        tempErrors.currentLocation = "Current Location is required.";
      }
      if (!formData.pincode || !pincodeRegex.test(formData.pincode)) {
        tempErrors.pincode = "Pin Code is required";
      }
    }

    if (activeStep === 2) {
      if (!formData.agreeToTerms) {
        tempErrors.agreeToTerms =
          "You must agree to the Terms of Service and Privacy Policy.";
      }
      if (!formData.housekeepingRole) {
        tempErrors.housekeepingRole = "Please select a service type.";
      }
      if (formData.housekeepingRole === "COOK" && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality =
          "Please select a speciality for the cook service.";
      }
      if (!formData.diet) {
        tempErrors.diet = "Please select diet";
      }

      if (!formData.experience) {
        tempErrors.experience = "Please select experience";
      } else {
        const experienceRegex = /^[0-9]+$/;
        if (!experienceRegex.test(formData.experience)) {
          tempErrors.experience = "Experience only accepts numbers.";
        } else {
          const experienceRangeRegex = /^([0-9]|[1-4][0-9]|50)$/;
          if (!experienceRangeRegex.test(formData.experience)) {
            tempErrors.experience =
              "Experience must be between 0 and 50 years.";
          }
        }
      }
    }

    if (activeStep === 3) {
      if (!formData.AADHAR || !aadhaarRegex.test(formData.AADHAR)) {
        tempErrors.kyc = "Aadhaar number must be exactly 12 digits.";
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
        Alert.alert("Error", "You must be at least 18 years old to proceed");
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
      const filteredPayload = Object.fromEntries(
        Object.entries(formData).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined
        )
      );

      if (validateForm()) {
        try {
          // Upload profile image if selected
          if (image) {
            const formDataToUpload = new FormData();
            formDataToUpload.append("image", {
              uri: image.uri,
              type: "image/jpeg",
              name: "profile.jpg",
            });

            const imageResponse = await axios.post(
              "http://your-api-endpoint/upload",
              formDataToUpload,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (imageResponse.status === 200) {
              filteredPayload.profilePic = imageResponse.data.imageUrl;
            } else {
              Alert.alert(
                "Warning",
                "Image upload failed. Proceeding without profile picture."
              );
            }
          }

          // Upload document image if selected
          if (documentImage) {
            const docFormData = new FormData();
            docFormData.append("document", {
              uri: documentImage.uri,
              type: "image/jpeg",
              name: "document.jpg",
            });

            const docResponse = await axios.post(
              "http://your-api-endpoint/upload-document",
              docFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (docResponse.status === 200) {
              filteredPayload.documentImageUrl = docResponse.data.documentUrl;
            } else {
              Alert.alert(
                "Warning",
                "Document upload failed. Proceeding without document."
              );
            }
          }

          // Submit the form data
          const response = await axiosInstance.post(
            "/api/serviceproviders/serviceprovider/add",
            filteredPayload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          Alert.alert("Success", "Service provider added successfully!");
          console.log("Success:", response.data);

          setTimeout(() => {
            onRegistrationSuccess();
          }, 3000);
        } catch (error) {
          Alert.alert(
            "Error",
            "Failed to add service provider. Please try again."
          );
          console.error("Error submitting form:", error);
        }
      } else {
        Alert.alert("Warning", "Please fill out all required fields.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to register. Please try again.");
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormTimeSlot = (
    morningRange: number[],
    eveningRange: number[]
  ) => {
    const startMorning = formatDisplayTime(morningRange[0]);
    const endMorning = formatDisplayTime(morningRange[1]);
    const startEvening = formatDisplayTime(eveningRange[0]);
    const endEvening = formatDisplayTime(eveningRange[1]);

    const formattedTimeSlot = `${startMorning}-${endMorning}, ${startEvening}-${endEvening}`;
    setFormData({ ...formData, timeslot: formattedTimeSlot });
  };

  const formatDisplayTime = (value: number) => {
    const hour = Math.floor(value);
    const minutes = value % 1 === 0.5 ? "30" : "00";
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
              <TouchableOpacity
                onPress={handleImageSelect}
                style={styles.imageUploadButton}
              >
                {image ? (
                  <Image source={image} style={styles.profileImage} />
                ) : (
                  <Text style={styles.imageUploadText}>
                    Upload Profile Image
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              value={formData.firstName}
              onChangeText={(text) =>
                handleRealTimeValidation("firstName", text)
              }
              editable={!isFieldsDisabled}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}

            <Text style={styles.inputLabel}>Middle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your middle name"
              placeholderTextColor="#999"
              value={formData.middleName}
              onChangeText={(text) => handleChange("middleName", text)}
              editable={!isFieldsDisabled}
            />

            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              value={formData.lastName}
              onChangeText={(text) =>
                handleRealTimeValidation("lastName", text)
              }
              editable={!isFieldsDisabled}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}

            {/* <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={formData.dob}
              onChangeText={(text) => handleDOBChange(text)}
            /> */}

            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInputPart}
                placeholder="YYYY"
                placeholderTextColor="#999"
                value={formData.dob.split("-")[0] || ""}
                onChangeText={(text) => {
                  if (text.length <= 4) {
                    const parts = formData.dob.split("-");
                    parts[0] = text;
                    const newDob = parts.join("-");
                    handleDOBChange(newDob);
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={styles.dateInputPart}
                placeholder="MM"
                placeholderTextColor="#999"
                value={formData.dob.split("-")[1] || ""}
                onChangeText={(text) => {
                  if (text.length <= 2 && (Number(text) <= 12 || text === "")) {
                    const parts = formData.dob.split("-");
                    parts[1] = text;
                    const newDob = parts.join("-");
                    handleDOBChange(newDob);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={styles.dateInputPart}
                placeholder="DD"
                placeholderTextColor="#999"
                value={formData.dob.split("-")[2] || ""}
                onChangeText={(text) => {
                  if (text.length <= 2 && (Number(text) <= 31 || text === "")) {
                    const parts = formData.dob.split("-");
                    parts[2] = text;
                    const newDob = parts.join("-");
                    handleDOBChange(newDob);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            {formData.dob && !validateAge(formData.dob) && (
              <Text style={styles.errorText}>
                You must be at least 18 years old to register.
              </Text>
            )}

            <Text style={styles.label}>Gender *</Text>
            <RadioButton.Group
              onValueChange={(value) => handleChange("gender", value)}
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
            {errors.gender && (
              <Text style={styles.errorText}>{errors.gender}</Text>
            )}

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={[styles.input, errors.emailId && styles.inputError]}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={formData.emailId}
              onChangeText={(text) => handleRealTimeValidation("emailId", text)}
              keyboardType="email-address"
              editable={!isFieldsDisabled}
            />
            {errors.emailId && (
              <Text style={styles.errorText}>{errors.emailId}</Text>
            )}

            <Text style={styles.inputLabel}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Create a password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) =>
                  handleRealTimeValidation("password", text)
                }
                editable={!isFieldsDisabled}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <Text style={styles.inputLabel}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  handleRealTimeValidation("confirmPassword", text)
                }
                editable={!isFieldsDisabled}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text>{showConfirmPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <TextInput
              style={[styles.input, errors.mobileNo && styles.inputError]}
              placeholder="Enter your 10-digit mobile number"
              placeholderTextColor="#999"
              value={formData.mobileNo}
              onChangeText={(text) =>
                handleRealTimeValidation("mobileNo", text)
              }
              keyboardType="phone-pad"
              editable={!isFieldsDisabled}
            />
            {errors.mobileNo && (
              <Text style={styles.errorText}>{errors.mobileNo}</Text>
            )}

            <Text style={styles.inputLabel}>Alternate Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter alternate contact number"
              placeholderTextColor="#999"
              value={formData.AlternateNumber}
              onChangeText={(text) => handleChange("AlternateNumber", text)}
              keyboardType="phone-pad"
              editable={!isFieldsDisabled}
            />
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              placeholder="Enter your complete address"
              placeholderTextColor="#999"
              value={formData.address}
              onChangeText={(text) => handleChange("address", text)}
              multiline
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}

            <Text style={styles.inputLabel}>Building Name *</Text>
            <TextInput
              style={[styles.input, errors.buildingName && styles.inputError]}
              placeholder="Enter building name"
              placeholderTextColor="#999"
              value={formData.buildingName}
              onChangeText={(text) => handleChange("buildingName", text)}
            />
            {errors.buildingName && (
              <Text style={styles.errorText}>{errors.buildingName}</Text>
            )}

            <Text style={styles.inputLabel}>Locality *</Text>
            <TextInput
              style={[styles.input, errors.locality && styles.inputError]}
              placeholder="Enter your locality"
              placeholderTextColor="#999"
              value={formData.locality}
              onChangeText={(text) => handleChange("locality", text)}
            />
            {errors.locality && (
              <Text style={styles.errorText}>{errors.locality}</Text>
            )}

            <Text style={styles.inputLabel}>Street *</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              placeholder="Enter street name"
              placeholderTextColor="#999"
              value={formData.street}
              onChangeText={(text) => handleChange("street", text)}
            />
            {errors.street && (
              <Text style={styles.errorText}>{errors.street}</Text>
            )}

            <Text style={styles.inputLabel}>Pincode *</Text>
            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              placeholder="Enter 6-digit pincode"
              placeholderTextColor="#999"
              value={formData.pincode}
              onChangeText={(text) => handleRealTimeValidation("pincode", text)}
              keyboardType="number-pad"
            />
            {errors.pincode && (
              <Text style={styles.errorText}>{errors.pincode}</Text>
            )}

            <Text style={styles.inputLabel}>Current Location *</Text>
            <TextInput
              style={[
                styles.input,
                errors.currentLocation && styles.inputError,
              ]}
              placeholder="Enter your current location"
              placeholderTextColor="#999"
              value={formData.currentLocation}
              onChangeText={(text) => handleChange("currentLocation", text)}
            />
            {errors.currentLocation && (
              <Text style={styles.errorText}>{errors.currentLocation}</Text>
            )}

            <Text style={styles.inputLabel}>Nearby Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter nearby landmark"
              placeholderTextColor="#999"
              value={formData.nearbyLocation}
              onChangeText={(text) => handleChange("nearbyLocation", text)}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={fetchLocationData}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Fetch Location</Text>
              )}
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
            {errors.housekeepingRole && (
              <Text style={styles.errorText}>{errors.housekeepingRole}</Text>
            )}

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
                        <Image
                          source={require("../assets/images/veg.png")}
                          style={styles.icon}
                        />
                        <Text>Veg</Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="NONVEG" />
                      <View style={styles.radioLabel}>
                        <Image
                          source={require("../assets/images/nonveg.png")}
                          style={styles.icon}
                        />
                        <Text>Non-Veg</Text>
                      </View>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="BOTH" />
                      <Text>Both</Text>
                    </View>
                  </View>
                </RadioButton.Group>
                {errors.cookingSpeciality && (
                  <Text style={styles.errorText}>
                    {errors.cookingSpeciality}
                  </Text>
                )}
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
                    <Image
                      source={require("../assets/images/veg.png")}
                      style={styles.icon}
                    />
                    <Text>Veg</Text>
                  </View>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="NONVEG" />
                  <View style={styles.radioLabel}>
                    <Image
                      source={require("../assets/images/nonveg.png")}
                      style={styles.icon}
                    />
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
            <Text style={styles.note}>
              Note: Languages selection UI would be implemented here
            </Text>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe your services and experience"
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Experience (years) *</Text>
            <TextInput
              style={[styles.input, errors.experience && styles.inputError]}
              placeholder="Enter your years of experience"
              placeholderTextColor="#999"
              value={formData.experience}
              onChangeText={(text) => handleChange("experience", text)}
              keyboardType="numeric"
            />
            {errors.experience && (
              <Text style={styles.errorText}>{errors.experience}</Text>
            )}

            <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code if any"
              placeholderTextColor="#999"
              value={formData.referralCode}
              onChangeText={(text) => handleChange("referralCode", text)}
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
              minimumTrackTintColor={sliderDisabled ? "#cccccc" : "#1fb28a"}
              maximumTrackTintColor={sliderDisabled ? "#cccccc" : "#d3d3d3"}
              thumbTintColor={sliderDisabled ? "#cccccc" : "#1fb28a"}
              disabled={sliderDisabled}
              value={sliderValueMorning[0]}
              onValueChange={(value: any) => {
                const newRange = [value, sliderValueMorning[1]];
                setSliderValueMorning(newRange);
                updateFormTimeSlot(newRange, sliderValueEvening);
              }}
            />
            <Text style={styles.sliderValue}>
              {formatDisplayTime(sliderValueMorning[0])} -{" "}
              {formatDisplayTime(sliderValueMorning[1])}
            </Text>

            <Text style={styles.sliderLabel}>Evening (12:00 PM - 8:00 PM)</Text>
            <Slider
              minimumValue={12}
              maximumValue={20}
              step={0.5}
              minimumTrackTintColor={sliderDisabled ? "#cccccc" : "#1fb28a"}
              maximumTrackTintColor={sliderDisabled ? "#cccccc" : "#d3d3d3"}
              thumbTintColor={sliderDisabled ? "#cccccc" : "#1fb28a"}
              disabled={sliderDisabled}
              value={sliderValueEvening[0]}
              onValueChange={(value: any) => {
                const newRange = [value, sliderValueEvening[1]];
                setSliderValueEvening(newRange);
                updateFormTimeSlot(sliderValueMorning, newRange);
              }}
            />
            <Text style={styles.sliderValue}>
              {formatDisplayTime(sliderValueEvening[0])} -{" "}
              {formatDisplayTime(sliderValueEvening[1])}
            </Text>

            <CheckBox
              title="I agree to the Terms of Service and Privacy Policy *"
              checked={formData.agreeToTerms}
              onPress={() =>
                handleChange("agreeToTerms", !formData.agreeToTerms)
              }
            />
            {errors.agreeToTerms && (
              <Text style={styles.errorText}>{errors.agreeToTerms}</Text>
            )}
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.inputLabel}>Aadhaar Number *</Text>
            <TextInput
              style={[styles.input, errors.kyc && styles.inputError]}
              placeholder="Enter 12-digit Aadhaar number"
              placeholderTextColor="#999"
              value={formData.AADHAR}
              onChangeText={(text) => handleRealTimeValidation("AADHAR", text)}
              keyboardType="numeric"
            />
            {errors.kyc && <Text style={styles.errorText}>{errors.kyc}</Text>}

            <Text style={styles.label}>Upload Document Image *</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleDocumentImageSelect}
            >
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        //{" "}
        <View style={styles.container}>
          <Text style={styles.title}>Service Provider Registration</Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {steps.map((label, index) => (
              <View key={index} style={styles.stepIndicatorContainer}>
                <View
                  style={[
                    styles.stepIndicator,
                    index <= activeStep
                      ? styles.activeStep
                      : styles.inactiveStep,
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
            <TouchableOpacity
              onPress={() => {
                console.log("Sign in button pressed");
                if (onBackToLogin) {
                  onBackToLogin();
                } else {
                  console.error("onBackToLogin function not provided");
                }
              }}
            >
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Add some padding at the bottom
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stepIndicatorContainer: {
    alignItems: "center",
    flex: 1,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  activeStep: {
    backgroundColor: "#1fb28a",
  },
  inactiveStep: {
    backgroundColor: "#cccccc",
  },
  stepNumber: {
    color: "#fff",
    fontWeight: "bold",
  },
  stepLabel: {
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
  stepContainer: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333",
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  showPasswordButton: {
    position: "absolute",
    right: 10,
  },
  button: {
    backgroundColor: "#1fb28a",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: "#1fb28a",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#1fb28a",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageUploadButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  imageUploadText: {
    color: "#666",
    textAlign: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  documentPreview: {
    alignItems: "center",
    marginTop: 10,
  },
  documentImage: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  documentName: {
    marginTop: 5,
    color: "#666",
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmationText: {
    fontSize: 18,
    textAlign: "center",
    color: "#1fb28a",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#1fb28a",
    fontWeight: "bold",
  },
  note: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    marginTop: 10,
    color: "#333",
  },
  sliderValue: {
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  dateInputPart: {
    flex: 1,
    textAlign: "center",
  },
  dateSeparator: {
    paddingHorizontal: 5,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  locationTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  statusContainer: {
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    marginTop: 10,
    textAlign: "center",
  },
  infoBox: {
    marginBottom: 20,
  },
  text: {
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonlocation: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ServiceProviderRegistration;
