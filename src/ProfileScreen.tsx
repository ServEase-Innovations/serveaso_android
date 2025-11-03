import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from 'react-native-linear-gradient';
import Icon from "react-native-vector-icons/Feather";
import axios from "axios";
import { useAppUser } from "./context/AppUserContext";
import MobileNumberDialog from "./MobileNumberDialog";
import axiosInstance from "./axiosInstance";

const { width } = Dimensions.get('window');

// Interfaces
interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  altContactNumber: string;
  role?: string;
}

interface ServiceProvider {
  serviceproviderId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobileNo: number;
  alternateNo: number | null;
  emailId: string;
  gender: string;
  buildingName: string;
  locality: string;
  street: string;
  pincode: number;
  currentLocation: string;
  nearbyLocation: string;
}

interface CustomerDetails {
  customerid: number;
  firstName: string;
  lastName: string;
  mobileNo: string | null;
  altMobileNo: string | null;
  email: string;
}

const ProfileScreen = () => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();

  console.log("App User from Context:", appUser);

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProvider | null>(null);
  const [customerData, setCustomerData] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAddressIds, setExpandedAddressIds] = useState<string[]>([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    contactNumber: "",
    altContactNumber: ""
  });
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "Home",
    street: "",
    city: "",
    country: "",
    postalCode: "",
    isPrimary: false
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [altCountryCode, setAltCountryCode] = useState("+91");
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showAltCountryCodePicker, setShowAltCountryCodePicker] = useState(false);

  // Function to get user's first letter for profile picture
  const getUserInitial = () => {
    const name = userName || appUser?.nickname || "User";
    return name.charAt(0).toUpperCase();
  };

  // Function to get background color based on user initial
  const getAvatarBackgroundColor = (initial: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Function to render profile picture with fallback
  const renderProfilePicture = () => {
    const profilePictureUri = auth0User?.picture;
    
    if (profilePictureUri) {
      return (
        <Image
          source={{ uri: profilePictureUri }}
          style={styles.profileImage}
        />
      );
    } else {
      const initial = getUserInitial();
      const backgroundColor = getAvatarBackgroundColor(initial);
      
      return (
        <View style={[styles.avatarFallback, { backgroundColor }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      );
    }
  };

  // Function to get display name for greeting
  const getDisplayName = () => {
    return userName || appUser?.nickname || "User";
  };

  // Check if customer has valid mobile numbers
  const hasValidMobileNumbers = () => {
    if (userRole !== "CUSTOMER") return true;
    
    return customerData?.mobileNo && 
           customerData.mobileNo !== null && 
           customerData.mobileNo !== "" &&
           customerData.mobileNo !== "null";
  };

  // Format mobile number for display
  const formatMobileNumber = (number: string | null) => {
    if (!number || number === "null" || number === "undefined") return "";
    return number;
  };

  // Fetch customer details
  const fetchCustomerDetails = async (customerId: number) => {
    try {
      console.log("Fetching customer details for ID:", customerId);
      const response = await axiosInstance.get(`/api/customer/get-customer-by-id/${customerId}`);
      console.log("API Response:", response.data);
      
      const customer = response.data;

      // Enhanced field mapping with fallbacks
      const mobileNo = customer?.mobileNo ?? 
                      customer?.mobileNumber ?? 
                      customer?.phoneNumber ?? 
                      customer?.contactNumber ?? 
                      customer?.phone ?? 
                      "";
      
      const altMobileNo = customer?.altMobileNo ?? 
                         customer?.alternateMobileNo ?? 
                         customer?.altPhoneNumber ?? 
                         customer?.alternateContactNumber ?? 
                         "";

      console.log("Mapped mobile numbers:", { mobileNo, altMobileNo });

      setCustomerData(customer);
      setUserData(prev => ({
        ...prev,
        contactNumber: mobileNo ? mobileNo.toString() : "",
        altContactNumber: altMobileNo ? altMobileNo.toString() : ""
      }));

      return customer;
    } catch (error) {
      console.error("Error fetching customer details:", error);
      return null;
    }
  };

  // Handle mobile number update success
  const handleMobileNumberUpdateSuccess = () => {
    if (userId) {
      fetchCustomerDetails(userId); // Refresh customer data
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);

      if (auth0User || appUser) {
        // Priority for name: Use auth0User.name (full name) first, then appUser nickname
        const name = auth0User?.name || appUser?.nickname || null;
        
        // Get role from appUser context first, then fallback to auth0User
        const role = appUser?.role || 
                    auth0User?.role || 
                    auth0User?.["https://yourdomain.com/roles"]?.[0] || 
                    "CUSTOMER";
        
        setUserRole(role);

        // Get user ID from multiple possible sources
        const id = appUser?.serviceProviderId ||
                  appUser?.customerid ||
                  auth0User?.serviceproviderId || 
                  auth0User?.["https://yourdomain.com/serviceProviderId"] || 
                  auth0User?.customerid || 
                  null;
        
        setUserName(name);
        setUserId(id ? Number(id) : null);

        // Set first name and last name from available data
        if (auth0User?.name) {
          const nameParts = auth0User.name.split(" ");
          setUserData(prev => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || ""
          }));
        } else if (appUser?.nickname) {
          setUserData(prev => ({
            ...prev,
            firstName: appUser.nickname || "",
            lastName: ""
          }));
        }

        // Set contact info if available in appUser
        if (appUser?.contactNumber) {
          setUserData(prev => ({
            ...prev,
            contactNumber: appUser.contactNumber
          }));
        }

        try {
          if (role === "SERVICE_PROVIDER" && id) {
            await fetchServiceProviderData(id.toString());
          } else if (role === "CUSTOMER" && id) {
            await fetchCustomerDetails(Number(id));
            await fetchCustomerAddresses(Number(id));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [auth0User, appUser]);

  // Fetch customer addresses
  const fetchCustomerAddresses = async (customerId: number) => {
    try {
      const response = await axios.get(
        `https://utils-ndt3.onrender.com/user-settings/${customerId}`
      );

      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const allSavedLocations = data.flatMap(doc => doc.savedLocations || []);

        const mappedAddresses: Address[] = allSavedLocations
          .filter((loc: any) => loc.location?.formatted_address)
          .map((loc: any, idx: number) => ({
            id: loc._id || idx.toString(),
            type: loc.name || "Other",
            street: loc.location.formatted_address,
            city:
              loc.location.address_components?.find((c: any) =>
                c.types.includes("locality")
              )?.long_name || "",
            country:
              loc.location.address_components?.find((c: any) =>
                c.types.includes("country")
              )?.long_name || "",
            postalCode:
              loc.location.address_components?.find((c: any) =>
                c.types.includes("postal_code")
              )?.long_name || "",
            isPrimary: loc.isPrimary || idx === 0
          }));

        setAddresses(mappedAddresses);
      }
    } catch (err) {
      console.error("Failed to fetch customer addresses:", err);
    }
  };

  // Fetch service provider data
  const fetchServiceProviderData = async (serviceProviderId: string) => {
    try {
      const mockServiceProviderData: ServiceProvider = {
        serviceproviderId: parseInt(serviceProviderId),
        firstName: userData.firstName,
        middleName: null,
        lastName: userData.lastName,
        mobileNo: parseInt(userData.contactNumber.replace("+", "")) || 1234567890,
        alternateNo: userData.altContactNumber ? parseInt(userData.altContactNumber.replace("+", "")) : null,
        emailId: auth0User?.email || appUser?.email || "",
        gender: "Prefer not to say",
        buildingName: "Office Building",
        locality: "Business District",
        street: "Main Street",
        pincode: 123456,
        currentLocation: "City Center",
        nearbyLocation: "Downtown"
      };

      setServiceProviderData(mockServiceProviderData);

      setUserData(prev => ({
        ...prev,
        contactNumber: mockServiceProviderData.mobileNo ? mockServiceProviderData.mobileNo.toString() : "",
        altContactNumber: mockServiceProviderData.alternateNo ? mockServiceProviderData.alternateNo.toString() : ""
      }));

      const serviceProviderAddress: Address = {
        id: "1",
        type: "Home",
        street: `${mockServiceProviderData.buildingName || ""} ${mockServiceProviderData.street || ""} ${mockServiceProviderData.locality || ""}`.trim(),
        city: mockServiceProviderData.nearbyLocation || mockServiceProviderData.currentLocation || "",
        country: "India",
        postalCode: mockServiceProviderData.pincode ? mockServiceProviderData.pincode.toString() : "",
        isPrimary: true,
      };

      setAddresses([serviceProviderAddress]);
    } catch (error) {
      console.error("Failed to fetch service provider data:", error);
    }
  };

  const handleInputChange = (name: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (userRole === "SERVICE_PROVIDER" && userId) {
        const currentAddress = addresses[0];

        const payload = {
          serviceproviderId: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobileNo: userData.contactNumber?.replace("+", "") || null,
          alternateNo: userData.altContactNumber?.replace("+", "") || null,
          buildingName: currentAddress.street || "",
          street: currentAddress.street || "",
          locality: currentAddress.city || "",
          pincode: currentAddress.postalCode || null,
          currentLocation: currentAddress.city || "",
          nearbyLocation: currentAddress.city || "",
        };

        console.log("Saving service provider data:", payload);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        console.log("Saving customer data:", { ...userData, addresses });
        Alert.alert("Success", "Profile updated successfully");
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save data:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowAddAddress(false);
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds((prev) =>
      prev.includes(id) ? prev.filter((addrId) => addrId !== id) : [...prev, id]
    );
  };

  // Add Address functionality
  const handleAddAddress = async () => {
    if (newAddress.street && newAddress.city && newAddress.country && newAddress.postalCode) {
      const addressToAdd = {
        ...newAddress,
        id: Date.now().toString(),
      };

      let updatedAddresses;
      if (newAddress.isPrimary) {
        updatedAddresses = addresses.map((addr) => ({ ...addr, isPrimary: false }));
        updatedAddresses.push(addressToAdd);
      } else {
        updatedAddresses = [...addresses, addressToAdd];
      }

      setAddresses(updatedAddresses);

      if (userRole === "CUSTOMER" && userId) {
        try {
          const payload = {
            customerId: userId,
            savedLocations: [
              {
                name: addressToAdd.type,
                location: {
                  formatted_address: `${addressToAdd.street}, ${addressToAdd.city}, ${addressToAdd.country} - ${addressToAdd.postalCode}`,
                  address_components: [
                    { long_name: addressToAdd.city, types: ["locality"] },
                    { long_name: addressToAdd.country, types: ["country"] },
                    { long_name: addressToAdd.postalCode, types: ["postal_code"] },
                  ],
                },
                isPrimary: addressToAdd.isPrimary,
              },
            ],
          };

          await axios.post("https://utils-ndt3.onrender.com/user-settings", payload);
          console.log("✅ Address saved successfully:", payload);
        } catch (err) {
          console.error("❌ Failed to save new address:", err);
          Alert.alert("Error", "Could not save address. Try again.");
        }
      }

      setNewAddress({
        type: userRole === "SERVICE_PROVIDER" ? "Home" : "Home",
        street: "",
        city: "",
        country: "",
        postalCode: "",
        isPrimary: false,
      });
      setShowAddAddress(false);
    }
  };

  // Handle address input changes
  const handleAddressInputChange = (name: keyof typeof newAddress, value: string | boolean) => {
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get available address types based on user role
  const getAvailableAddressTypes = () => {
    if (userRole === "SERVICE_PROVIDER") {
      return ["Home"];
    }
    return ["Home", "Work", "Other"];
  };

  // Handle editing addresses
  const handleEditAddress = (id: string, field: keyof Address, value: string) => {
    setAddresses(prev => 
      prev.map(addr => 
        addr.id === id ? { ...addr, [field]: value } : addr
      )
    );
  };

  // Set primary address
  const setPrimaryAddress = (id: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isPrimary: addr.id === id
    }));
    setAddresses(updatedAddresses);
  };

  // Remove address
  const removeAddress = (id: string) => {
    if (addresses.length <= 1) return;
    
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    
    if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isPrimary)) {
      updatedAddresses[0].isPrimary = true;
    }
    
    setAddresses(updatedAddresses);
  };

  // Country code options
  const countryCodes = [
    { label: "+91 (IN)", value: "+91" },
    { label: "+1 (US)", value: "+1" },
    { label: "+44 (UK)", value: "+44" },
    { label: "+61 (AU)", value: "+61" },
    { label: "+65 (SG)", value: "+65" },
    { label: "+971 (UAE)", value: "+971" },
  ];

  // Loading Screen Component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#0E305C" />
        <Text style={styles.loadingText}>Loading your profile</Text>
        <Text style={styles.loadingSubtext}>Please wait while we fetch your information</Text>
      </View>
    </View>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <LinearGradient
        colors={['rgba(177, 213, 232, 0.8)', 'rgba(255, 255, 255, 1)']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.headerSkeleton}
      >
        <View style={styles.headerContentSkeleton}>
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <View style={styles.greetingSkeleton} />
              <View style={styles.roleSkeleton} />
              <View style={styles.editButtonSkeleton} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content Skeleton */}
      <View style={styles.mainContentSkeleton}>
        <View style={styles.cardSkeleton}>
          <View style={styles.formHeaderSkeleton}>
            <View style={styles.titleSkeleton} />
          </View>

          <View style={styles.sectionSkeleton}>
            <View style={styles.sectionTitleSkeleton} />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>

            {/* First Name and Last Name in one row */}
            <View style={styles.nameRowSkeleton}>
              <View style={styles.nameInputSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.nameInputSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>

            <View style={styles.inputGroupSkeleton}>
              <View style={styles.labelSkeleton} />
              <View style={styles.inputSkeleton} />
            </View>
          </View>

          <View style={styles.dividerSkeleton} />

          <View style={styles.sectionSkeleton}>
            <View style={styles.sectionTitleSkeleton} />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>
          </View>

          <View style={styles.sectionSkeleton}>
            <View style={styles.labelSkeleton} />
            <View style={styles.addressCardSkeleton}>
              <View style={styles.addressHeaderSkeleton}>
                <View style={styles.addressTitleSkeleton} />
              </View>
              <View style={styles.addressLineSkeleton} />
              <View style={styles.addressLineShortSkeleton} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (auth0Loading || isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Mobile Number Dialog */}
      <MobileNumberDialog 
        open={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        onSuccess={handleMobileNumberUpdateSuccess}
      />

      {/* Header with Linear Gradient */}
      <LinearGradient
        colors={['rgba(177, 213, 232, 0.8)', 'rgba(255, 255, 255, 1)']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <Text style={styles.greeting}>
                Hello, {getDisplayName()}
              </Text>
              <Text style={styles.roleText}>
                {userRole === "SERVICE_PROVIDER" ? "Service Provider" : "Customer"}
                {userRole === "CUSTOMER" && !hasValidMobileNumbers() && (
                  <Text style={styles.mobileWarning}> ⚠️ Mobile required</Text>
                )}
              </Text>    
              {/* Edit Profile Button */}
              <View style={styles.editButtonContainer}>
                {isEditing ? (
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleCancel}
                      disabled={isSaving}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.formContainer}>
          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>My account</Text>
            {userRole === "CUSTOMER" && !hasValidMobileNumbers() && (
              <TouchableOpacity
                onPress={() => setShowMobileDialog(true)}
                style={styles.addMobileButton}
              >
                <Text style={styles.addMobileButtonText}>Add Mobile Number</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Info Section */}
          <View>
            <Text style={styles.sectionTitle}>User Information</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={appUser?.nickname || userName || "User"}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={appUser?.email || auth0User?.email || "No email available"}
                  editable={false}
                />
              </View>
            </View>

            {/* First Name and Last Name in one row - Ultra Compact */}
            <View style={styles.ultraCompactNameRow}>
              <View style={styles.ultraCompactNameInput}>
                <Text style={styles.compactLabel}>First name</Text>
                <TextInput
                  style={[styles.ultraCompactInput, !isEditing && styles.readOnlyInput]}
                  value={userData.firstName}
                  onChangeText={(value) => handleInputChange("firstName", value)}
                  editable={isEditing}
                  placeholder="First"
                />
              </View>
              <View style={styles.ultraCompactNameInput}>
                <Text style={styles.compactLabel}>Last name</Text>
                <TextInput
                  style={[styles.ultraCompactInput, !isEditing && styles.readOnlyInput]}
                  value={userData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  editable={isEditing}
                  placeholder="Last"
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Contact Info Section */}
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputRow}>
            {/* Contact Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Contact Number
                {userRole === "CUSTOMER" && (
                  <Text style={!hasValidMobileNumbers() ? styles.mobileWarningSmall : styles.mobileSuccess}>
                    {!hasValidMobileNumbers() ? ' ⚠️' : ' ✓'}
                  </Text>
                )}
              </Text>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.countryCodeContainer}
                    onPress={() => setShowCountryCodePicker(true)}
                  >
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Icon name="chevron-down" size={16} color="#4a5568" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.countryCodeContainer, styles.readOnlyInput]}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.phoneInput, 
                    !isEditing && styles.readOnlyInput,
                    !hasValidMobileNumbers() && userRole === "CUSTOMER" && styles.invalidInput
                  ]}
                  value={formatMobileNumber(userData.contactNumber)}
                  onChangeText={(value) => handleInputChange("contactNumber", value)}
                  placeholder="No contact number provided"
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
              </View>
              {userRole === "CUSTOMER" && !hasValidMobileNumbers() && (
                <Text style={styles.mobileRequiredText}>
                  Mobile number is required for bookings and notifications
                </Text>
              )}
            </View>

            {/* Alternative Contact Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative Contact Number</Text>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.countryCodeContainer}
                    onPress={() => setShowAltCountryCodePicker(true)}
                  >
                    <Text style={styles.countryCodeText}>{altCountryCode}</Text>
                    <Icon name="chevron-down" size={16} color="#4a5568" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.countryCodeContainer, styles.readOnlyInput]}>
                    <Text style={styles.countryCodeText}>{altCountryCode}</Text>
                  </View>
                )}
                <TextInput
                  style={[styles.phoneInput, !isEditing && styles.readOnlyInput]}
                  value={formatMobileNumber(userData.altContactNumber)}
                  onChangeText={(value) => handleInputChange("altContactNumber", value)}
                  placeholder="No alternative number"
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Country Code Pickers */}
          <Modal
            visible={showCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Country Code</Text>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(itemValue) => {
                    setCountryCode(itemValue);
                    setShowCountryCodePicker(false);
                  }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item key={code.value} label={code.label} value={code.value} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCountryCodePicker(false)}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showAltCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Country Code</Text>
                <Picker
                  selectedValue={altCountryCode}
                  onValueChange={(itemValue) => {
                    setAltCountryCode(itemValue);
                    setShowAltCountryCodePicker(false);
                  }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item key={code.value} label={code.label} value={code.value} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowAltCountryCodePicker(false)}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Address Section */}
          <View style={styles.addressesSection}>
            <View style={styles.addressesHeader}>
              <Text style={styles.inputLabel}>Addresses</Text>
              {isEditing && userRole === "CUSTOMER" && (
                <TouchableOpacity
                  onPress={() => setShowAddAddress(!showAddAddress)}
                  style={styles.addAddressButton}
                >
                  <Icon name="plus" size={16} color="#0a2a66" />
                  <Text style={styles.addAddressText}>Add New Address</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddAddress && isEditing && (
              <View style={styles.addAddressForm}>
                <View style={styles.addAddressFormHeader}>
                  <Text style={styles.addAddressFormTitle}>Add New Address</Text>
                  <TouchableOpacity 
                    onPress={() => setShowAddAddress(false)}
                  >
                    <Icon name="x" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.addressFormRow}>
                  <View style={styles.addressFormInput}>
                    <Text style={styles.inputLabel}>Address Type</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={newAddress.type}
                        onValueChange={(value) => handleAddressInputChange("type", value)}
                        style={styles.picker}
                      >
                        {getAvailableAddressTypes().map(type => (
                          <Picker.Item key={type} label={type} value={type} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.primaryCheckboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleAddressInputChange("isPrimary", !newAddress.isPrimary)}
                    >
                      {newAddress.isPrimary && <Icon name="check" size={16} color="#0a2a66" />}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Set as primary address</Text>
                  </View>
                </View>
                
                <View style={styles.addressFormInput}>
                  <Text style={styles.inputLabel}>Street Address</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.street}
                    onChangeText={(value) => handleAddressInputChange("street", value)}
                    placeholder="Enter street address"
                  />
                </View>
                
                <View style={styles.addressFormRow}>
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.city}
                      onChangeText={(value) => handleAddressInputChange("city", value)}
                      placeholder="Enter city"
                    />
                  </View>
                  
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.country}
                      onChangeText={(value) => handleAddressInputChange("country", value)}
                      placeholder="Enter country"
                    />
                  </View>
                  
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Postal Code</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.postalCode}
                      onChangeText={(value) => handleAddressInputChange("postalCode", value)}
                      placeholder="Enter postal code"
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={styles.addAddressSubmitButton}
                >
                  <Text style={styles.addAddressSubmitText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            )}

            {addresses.length === 0 ? (
              <Text style={styles.noAddressText}>No addresses saved yet</Text>
            ) : (
              <View style={styles.addressesList}>
                {addresses.map((address, idx) => {
                  const isExpanded = idx === 0 || expandedAddressIds.includes(address.id);

                  return (
                    <View
                      key={address.id}
                      style={[
                        styles.addressCard,
                        address.isPrimary && styles.primaryAddressCard,
                        isExpanded && styles.expandedAddressCard
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.addressHeader}>
                        <View style={styles.addressTitleContainer}>
                          {isEditing ? (
                            <View style={styles.pickerContainer}>
                              <Picker
                                selectedValue={address.type}
                                onValueChange={(value) => handleEditAddress(address.id, 'type', value)}
                                style={styles.picker}
                              >
                                {getAvailableAddressTypes().map(type => (
                                  <Picker.Item key={type} label={type} value={type} />
                                ))}
                              </Picker>
                            </View>
                          ) : (
                            <Text style={styles.addressType}>{address.type} Address</Text>
                          )}
                          {address.isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.addressActions}>
                          {isEditing && addresses.length > 1 && (
                            <>
                              {!address.isPrimary && (
                                <TouchableOpacity
                                  onPress={() => setPrimaryAddress(address.id)}
                                  style={styles.addressActionButton}
                                >
                                  <Text style={styles.setPrimaryText}>Set Primary</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                onPress={() => removeAddress(address.id)}
                                style={styles.addressActionButton}
                                >
                                <Icon name="x" size={20} color="#dc2626" />
                              </TouchableOpacity>
                            </>
                          )}
                          {idx !== 0 && (
                            <TouchableOpacity
                              onPress={() => toggleAddress(address.id)}
                              style={styles.addressActionButton}
                            >
                              <Icon
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Body (only show when expanded) */}
                      {isExpanded && (
                        <View style={styles.addressDetails}>
                          {isEditing ? (
                            <>
                              <View style={styles.addressFormInput}>
                                <Text style={styles.inputLabel}>Street Address</Text>
                                <TextInput
                                  style={styles.input}
                                  value={address.street}
                                  onChangeText={(value) => handleEditAddress(address.id, 'street', value)}
                                />
                              </View>
                              <View style={styles.addressFormRow}>
                                <View style={[styles.addressFormInput, { flex: 1 }]}>
                                  <Text style={styles.inputLabel}>City</Text>
                                  <TextInput
                                    style={styles.input}
                                    value={address.city}
                                    onChangeText={(value) => handleEditAddress(address.id, 'city', value)}
                                  />
                                </View>
                                <View style={[styles.addressFormInput, { flex: 1 }]}>
                                  <Text style={styles.inputLabel}>Country</Text>
                                  <TextInput
                                    style={styles.input}
                                    value={address.country}
                                    onChangeText={(value) => handleEditAddress(address.id, 'country', value)}
                                  />
                                </View>
                                <View style={[styles.addressFormInput, { flex: 1 }]}>
                                  <Text style={styles.inputLabel}>Postal Code</Text>
                                  <TextInput
                                    style={styles.input}
                                    value={address.postalCode}
                                    onChangeText={(value) => handleEditAddress(address.id, 'postalCode', value)}
                                  />
                                </View>
                              </View>
                            </>
                          ) : (
                            <>
                              <Text style={styles.addressText}>{address.street}</Text>
                              <Text style={styles.addressText}>
                                {(address.city || "No city")},{" "}
                                {(address.country || "No country")}{" "}
                                {address.postalCode || ""}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Service Provider Status Section */}
          {userRole === "SERVICE_PROVIDER" && (
            <View style={styles.serviceStatusSection}>
              <View style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Service Status</Text>
              
              <View style={styles.statusCard}>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Profile Status</Text>
                    <View style={styles.statusValue}>
                      <View style={[styles.statusIndicator, styles.statusActive]} />
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Verification</Text>
                    <View style={styles.statusValue}>
                      <View style={[styles.statusIndicator, styles.statusActive]} />
                      <Text style={styles.statusText}>Verified</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Availability</Text>
                    <View style={styles.statusValue}>
                      <View style={[styles.statusIndicator, styles.statusActive]} />
                      <Text style={styles.statusText}>Available</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.statusFooter}>
                  <Text style={styles.statusUpdateText}>
                    Last updated: {new Date().toLocaleDateString()}
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.statusDetailsLink}>View complete status details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          {isEditing && (
            <View style={styles.submitContainer}>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 MyApp. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  loadingContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    width: '100%',
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0a2a66",
    marginRight: 15,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0a2a66",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0a2a66",
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },
  mobileWarning: {
    color: "#dc2626",
    fontSize: 12,
  },
  mobileWarningSmall: {
    color: "#dc2626",
    fontSize: 12,
  },
  mobileSuccess: {
    color: "#16a34a",
    fontSize: 12,
  },
  mobileRequiredText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  editButtonContainer: {
    alignSelf: 'flex-start',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButton: {
    backgroundColor: "#0a2a66",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#0a2a66",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mainContent: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  formContainer: {
    width: width - 32,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3748",
  },
  addMobileButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addMobileButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  // New styles for name row
  nameRow: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  nameInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputContainer: {
    width: width > 500 ? "48%" : "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: "#f7fafc",
  },
  invalidInput: {
    borderColor: "#dc2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 20,
  },
  // Address section styles
  addressesSection: {
    marginBottom: 20,
  },
  noAddressText: {
    color: "#666",
    fontStyle: "italic",
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
  },
  expandedAddressCard: {
    padding: 16,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  primaryBadgeText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "600",
  },
  addressDetails: {
    marginTop: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  submitContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "#0a2a66",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#718096",
    fontSize: 12,
  },
  // Skeleton styles
  headerSkeleton: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContentSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  greetingSkeleton: {
    width: 200,
    height: 28,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  roleSkeleton: {
    width: 120,
    height: 18,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 16,
  },
  editButtonSkeleton: {
    width: 140,
    height: 44,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
  mainContentSkeleton: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  cardSkeleton: {
    width: width - 32,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeaderSkeleton: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  titleSkeleton: {
    width: 100,
    height: 24,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  sectionSkeleton: {
    marginBottom: 20,
  },
  sectionTitleSkeleton: {
    width: 160,
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 16,
  },
  rowSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  // New skeleton styles for name row
  nameRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  nameInputSkeleton: {
    flex: 1,
    marginBottom: 16,
  },
  inputGroupSkeleton: {
    width: width > 500 ? "48%" : "100%",
    marginBottom: 16,
  },
  labelSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  inputSkeleton: {
    width: "100%",
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  dividerSkeleton: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 20,
  },
  addressCardSkeleton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  addressHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitleSkeleton: {
    width: 120,
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  addressLineSkeleton: {
    width: "100%",
    height: 16,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 8,
  },
  addressLineShortSkeleton: {
    width: "75%",
    height: 16,
    backgroundColor: "#eee",
    borderRadius: 4,
  },
  // Rest of the existing styles...
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#f7fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#4a5568',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 14,
  },
  addressesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressText: {
    color: '#0a2a66',
    fontWeight: '600',
    marginLeft: 4,
  },
  addAddressForm: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#dbeafe',
  },
  addAddressFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addAddressFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  addressFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  addressFormInput: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    backgroundColor: 'white',
  },
  primaryCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4a5568',
  },
  addAddressSubmitButton: {
    backgroundColor: '#0a2a66',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAddressSubmitText: {
    color: 'white',
    fontWeight: '600',
  },
  primaryAddressCard: {
    borderColor: '#93c5fd',
    backgroundColor: '#dbeafe',
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  setPrimaryText: {
    color: '#0a2a66',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles for country code picker
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerButton: {
    backgroundColor: '#0a2a66',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Service status section styles
  serviceStatusSection: {
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusUpdateText: {
    fontSize: 12,
    color: '#718096',
  },
  statusDetailsLink: {
    fontSize: 12,
    color: '#0a2a66',
    fontWeight: '600',
  },
  // Ultra compact styles
  ultraCompactNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8, // Even smaller gap
  },
  ultraCompactNameInput: {
    flex: 1,
    
  },
  ultraCompactInput: {
    width: "100%",
    // padding: 8, // Even smaller padding
     paddingStart: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6, // Slightly smaller border radius
    fontSize: 14,
    minHeight: 40, // Smaller height
  },
  compactLabel: {
    fontSize: 14, // Smaller label
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
  },
});

export default ProfileScreen;