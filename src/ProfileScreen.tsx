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

// Updated Interfaces to match web version
interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
  rawData?: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
}

interface PermanentAddress {
  field1: string;
  field2: string;
  ctArea: string;
  pinNo: string;
  state: string;
  country: string;
}

interface CorrespondenceAddress {
  field1: string;
  field2: string;
  ctArea: string;
  pinNo: string;
  state: string;
  country: string;
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
  permanentAddress: PermanentAddress;
  correspondenceAddress: CorrespondenceAddress;
}

interface CustomerDetails {
  customerid: number;
  firstName: string;
  lastName: string;
  mobileNo: string | null;
  altMobileNo: string | null;
  email: string;
}

// Mobile Number Dialog Component


const ProfileScreen = () => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();

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
    const profilePictureUri = appUser?.picture || auth0User?.picture;
    
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

  // Fetch customer details (NEW METHOD)
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

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);

      if (appUser) {
        const name = appUser.name || null;
        const role = appUser.role || "CUSTOMER";
        setUserRole(role);

        const id = role === "SERVICE_PROVIDER" 
          ? appUser.serviceProviderId 
          : appUser.customerid;
        
        setUserName(name);
        setUserId(id ? Number(id) : null);

        if (name) {
          const nameParts = name.split(" ");
          setUserData(prev => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || ""
          }));
        }

        try {
          if (role === "SERVICE_PROVIDER" && id) {
            await fetchServiceProviderData(Number(id));
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
  }, [appUser]);

  // Fetch customer addresses (UPDATED to match web version)
  const fetchCustomerAddresses = async (customerId: number) => {
    try {
      const response = await axios.get(
        `https://utils-ndt3.onrender.com/user-settings/${customerId}`
      );
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const allSavedLocations = data.flatMap(doc => doc.savedLocations || []);

        const mappedAddresses: Address[] = allSavedLocations
          .filter((loc: any) => loc.location?.address?.[0]?.formatted_address)
          .map((loc: any, idx: number) => {
            const primaryAddress = loc.location.address[0];
            const addressComponents = primaryAddress.address_components || [];
            
            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) => c.types.includes(type));
              return component?.long_name || "";
            };

            return {
              id: loc._id || idx.toString(),
              type: loc.name || "Other",
              street: primaryAddress.formatted_address,
              city: getComponent("locality") || 
                    getComponent("administrative_area_level_3") || 
                    getComponent("administrative_area_level_4") || 
                    "",
              country: getComponent("country") || "",
              postalCode: getComponent("postal_code") || "",
              isPrimary: loc.isPrimary || idx === 0,
              rawData: {
                formattedAddress: primaryAddress.formatted_address,
                latitude: loc.location.lat,
                longitude: loc.location.lng,
                placeId: primaryAddress.place_id
              }
            };
          });

        setAddresses(mappedAddresses);
        console.log("Mapped addresses:", mappedAddresses);
      } else {
        console.log("No address data found");
        setAddresses([]);
      }
    } catch (err) {
      console.error("Failed to fetch customer addresses:", err);
      setAddresses([]);
    }
  };
  
  // Fetch service provider data (UPDATED to match web version)
  const fetchServiceProviderData = async (serviceProviderId: number) => {
    try {
      const response = await axiosInstance.get(
        `/api/serviceproviders/get/serviceprovider/${serviceProviderId}`
      );

      const data = response.data;
      setServiceProviderData(data);

      setUserData(prev => ({
        ...prev,
        contactNumber: data.mobileNo ? data.mobileNo.toString() : "",
        altContactNumber: data.alternateNo ? data.alternateNo.toString() : ""
      }));

      const addresses: Address[] = [];

      if (data.permanentAddress) {
        const permAddr = data.permanentAddress;
        const streetAddress = `${permAddr.field1 || ""} ${permAddr.field2 || ""}`.trim() || 
                             data.street || 
                             data.buildingName || 
                             "";
        
        addresses.push({
          id: "permanent",
          type: "Permanent",
          street: streetAddress || "Address not specified",
          city: permAddr.ctArea || data.locality || data.currentLocation || "",
          country: permAddr.country || "India",
          postalCode: permAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
          isPrimary: true,
        });
      }

      if (data.correspondenceAddress) {
        const corrAddr = data.correspondenceAddress;
        const streetAddress = `${corrAddr.field1 || ""} ${corrAddr.field2 || ""}`.trim() || 
                             data.street || 
                             data.buildingName || 
                             "";
        
        addresses.push({
          id: "correspondence",
          type: "Correspondence",
          street: streetAddress || "Address not specified",
          city: corrAddr.ctArea || data.locality || data.currentLocation || "",
          country: corrAddr.country || "India",
          postalCode: corrAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
          isPrimary: false,
        });
      }

      if (addresses.length === 0) {
        const serviceProviderAddress: Address = {
          id: "1",
          type: "Home",
          street: `${data.buildingName || ""} ${data.street || ""} ${data.locality || ""}`.trim(),
          city: data.nearbyLocation || data.currentLocation || "",
          country: "India",
          postalCode: data.pincode ? data.pincode.toString() : "",
          isPrimary: true,
        };
        addresses.push(serviceProviderAddress);
      }

      setAddresses(addresses);
    } catch (error) {
      console.error("Failed to fetch service provider data:", error);
      // Fallback to mock data if API fails
      const mockServiceProviderData: ServiceProvider = {
        serviceproviderId: serviceProviderId,
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
        nearbyLocation: "Downtown",
        permanentAddress: {
          field1: "Building",
          field2: "Street",
          ctArea: "City",
          pinNo: "123456",
          state: "West Bengal",
          country: "India"
        },
        correspondenceAddress: {
          field1: "Building",
          field2: "Street",
          ctArea: "City",
          pinNo: "123456",
          state: "West Bengal",
          country: "India"
        }
      };

      setServiceProviderData(mockServiceProviderData);
    }
  };

  const handleInputChange = (name: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get available address types based on user role
  const getAvailableAddressTypes = () => {
    if (userRole === "SERVICE_PROVIDER") return ["Permanent", "Correspondence"];
    return ["Home", "Work", "Other"];
  };

  // Handle Save (UPDATED to match web version)
  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (userRole === "SERVICE_PROVIDER" && userId) {
        const permanentAddress = addresses.find(addr => addr.type === "Permanent");
        const correspondenceAddress = addresses.find(addr => addr.type === "Correspondence");

        const payload = {
          serviceproviderId: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobileNo: userData.contactNumber?.replace("+", "") || null,
          alternateNo: userData.altContactNumber?.replace("+", "") || null,
          buildingName: permanentAddress?.street || "",
          street: permanentAddress?.street || "",
          locality: permanentAddress?.city || "",
          pincode: permanentAddress?.postalCode || null,
          currentLocation: permanentAddress?.city || "",
          nearbyLocation: permanentAddress?.city || "",
          permanentAddress: permanentAddress ? {
            field1: permanentAddress.street.split(' ')[0] || "",
            field2: permanentAddress.street || "",
            ctArea: permanentAddress.city || "",
            pinNo: permanentAddress.postalCode || "",
            state: "West Bengal",
            country: permanentAddress.country || "India"
          } : null,
          correspondenceAddress: correspondenceAddress ? {
            field1: correspondenceAddress.street.split(' ')[0] || "",
            field2: correspondenceAddress.street || "",
            ctArea: correspondenceAddress.city || "",
            pinNo: correspondenceAddress.postalCode || "",
            state: "West Bengal",
            country: correspondenceAddress.country || "India"
          } : null
        };

        await axiosInstance.put(
          `/api/serviceproviders/update/serviceprovider/${userId}`,
          payload
        );
        await fetchServiceProviderData(userId);
      } else if (userRole === "CUSTOMER" && userId) {
        const payload = {
          customerid: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobileNo: userData.contactNumber?.replace("+", "") || null,
          altMobileNo: userData.altContactNumber?.replace("+", "") || null,
          email: appUser?.email || auth0User?.email || "",
        };

        await axiosInstance.put(
          `/api/customer/update-customer/${userId}`,
          payload
        );
        
        await fetchCustomerDetails(userId);
      }
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
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
    
    if (userRole === "SERVICE_PROVIDER" && appUser?.serviceProviderId) {
      fetchServiceProviderData(appUser.serviceProviderId);
    } else if (userRole === "CUSTOMER" && appUser?.customerid) {
      fetchCustomerDetails(appUser.customerid);
      fetchCustomerAddresses(appUser.customerid);
    }
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds((prev) =>
      prev.includes(id) ? prev.filter((addrId) => addrId !== id) : [...prev, id]
    );
  };

  // Add Address functionality (UPDATED to match web version)
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
            savedLocations: [{
              name: addressToAdd.type,
              location: {
                address: [{
                  formatted_address: addressToAdd.street,
                  address_components: [
                    { long_name: addressToAdd.city, types: ["locality"] },
                    { long_name: addressToAdd.country, types: ["country"] },
                    { long_name: addressToAdd.postalCode, types: ["postal_code"] },
                  ],
                  geometry: {
                    location: {
                      lat: 0,
                      lng: 0
                    }
                  }
                }],
                lat: 0,
                lng: 0
              },
              isPrimary: addressToAdd.isPrimary,
            }],
          };

          await axios.post("https://utils-ndt3.onrender.com/user-settings", payload);
          console.log("✅ Address saved successfully");
        } catch (err) {
          console.error("❌ Failed to save new address:", err);
          Alert.alert("Error", "Could not save address. Try again.");
        }
      }

      setNewAddress({
        type: "Home",
        street: "",
        city: "",
        country: "",
        postalCode: "",
        isPrimary: false,
      });
      setShowAddAddress(false);
    }
  };

  const handleMobileNumberUpdateSuccess = () => {
    if (userId) {
      fetchCustomerDetails(userId); // Refresh customer data
    }
  };
  // Handle address input changes
  const handleAddressInputChange = (name: keyof typeof newAddress, value: string | boolean) => {
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Get user ID for display
  const getUserIdDisplay = () => {
    if (userRole === "SERVICE_PROVIDER") {
      return appUser?.serviceProviderId || "N/A";
    } else {
      return appUser?.customerid || "N/A";
    }
  };

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

  // Skeleton Loading Component (simplified version)
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
            <View style={[styles.avatarFallback, { backgroundColor: '#ddd' }]} />
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
                      style={[styles.button, styles.cancelEditButton]}
                      onPress={handleCancel}
                      disabled={isSaving}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveEditButton]}
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

            {/* First Name and Last Name */}
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

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {userRole === "SERVICE_PROVIDER" ? "Provider ID" : "User ID"}
                </Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={getUserIdDisplay()}
                  editable={false}
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
              <View style={[
                styles.addressesList,
                userRole === "SERVICE_PROVIDER" && styles.serviceProviderAddressList
              ]}>
                {addresses.map((address) => {
                  const isExpanded = userRole === "SERVICE_PROVIDER" || expandedAddressIds.includes(address.id);

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
                          {isEditing && userRole === "CUSTOMER" ? (
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
                            <Text style={styles.addressType}>{address.type}</Text>
                          )}
                          {address.isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.addressActions}>
                          {isEditing && userRole === "CUSTOMER" && addresses.length > 1 && (
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
                          {userRole === "CUSTOMER" && (
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
                          {isEditing && userRole === "CUSTOMER" ? (
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
                                {address.city}, {address.country} {address.postalCode}
                              </Text>
                            </>
                          )}
                        </View>
                      )}

                      {userRole === "CUSTOMER" && !isExpanded && (
                        <View style={styles.collapsedAddress}>
                          <Text style={styles.addressText} numberOfLines={1}>
                            {address.street}
                          </Text>
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
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Account Status</Text>
                  <Text style={styles.statusSubtitle}>Active Service Provider</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
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

// ... rest of your imports and interfaces ...

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
  cancelEditButton: { // Renamed from cancelButton
    backgroundColor: "#6c757d",
  },
  saveEditButton: { // Renamed from saveButton
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
  ultraCompactNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  ultraCompactNameInput: {
    flex: 1,
  },
  ultraCompactInput: {
    width: "100%",
    paddingStart: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    fontSize: 14,
    minHeight: 40,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
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
  serviceProviderAddressList: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  primaryAddressCard: {
    borderColor: "#93c5fd",
    backgroundColor: "#dbeafe",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
  },
  primaryBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryBadgeText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "600",
  },
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  setPrimaryText: {
    color: "#0a2a66",
    fontSize: 14,
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
  collapsedAddress: {
    marginTop: 8,
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
  // Phone input styles
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
  // Address management styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
  // Mobile Number Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  dialogDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    lineHeight: 20,
  },
  countryCodePicker: {
    height: 44,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  dialogCancelButton: { // Renamed from cancelButton
    backgroundColor: '#f1f5f9',
  },
  dialogSubmitButton: { // Renamed from submitButton
    backgroundColor: '#0a2a66',
  },
  dialogCancelButtonText: { // Renamed from cancelButtonText
    color: '#64748b',
    fontWeight: '600',
  },
  dialogSubmitButtonText: { // Renamed from submitButtonText
    color: 'white',
    fontWeight: '600',
  },
  // Skeleton styles (simplified)
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
});

export default ProfileScreen;