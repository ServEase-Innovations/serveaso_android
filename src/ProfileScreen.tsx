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
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from 'react-native-linear-gradient';
import Icon from "react-native-vector-icons/Feather";

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

const ProfileScreen = () => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAddressIds, setExpandedAddressIds] = useState<string[]>([]);

  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    contactNumber: "",
    altContactNumber: ""
  });
  
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);

      if (auth0User) {
        const name = auth0User.name || null;
        const role = auth0User.role || auth0User["https://yourdomain.com/roles"]?.[0] || "CUSTOMER";
        setUserRole(role);

        const id = auth0User.serviceproviderId || 
                  auth0User["https://yourdomain.com/serviceProviderId"] || 
                  auth0User.customerid || null;
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
            await fetchServiceProviderData(id);
          } else if (role === "CUSTOMER" && id) {
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
  }, [auth0User]);

  // Fetch customer addresses
  const fetchCustomerAddresses = async (customerId: number) => {
    try {
      const response = await fetch(
        `https://utils-ndt3.onrender.com/user-settings/${customerId}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const savedLocations = data[0]?.savedLocations || [];

        const mappedAddresses: Address[] = savedLocations
          .filter((loc: any) => loc.location?.formatted_address)
          .map((loc: any, idx: number) => ({
            id: idx.toString(),
            type: loc.name || "Other",
            street: loc.location.formatted_address,
            city: loc.location.address_components?.find((c: any) =>
              c.types.includes("locality")
            )?.long_name || "",
            country: loc.location.address_components?.find((c: any) =>
              c.types.includes("country")
            )?.long_name || "",
            postalCode: loc.location.address_components?.find((c: any) =>
              c.types.includes("postal_code")
            )?.long_name || "",
            isPrimary: idx === 0
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
      // In a real app, you would use your actual API endpoint with proper authentication
      // This is a placeholder for demonstration
      console.log("Fetching service provider data for:", serviceProviderId);
      
      // For demo purposes, creating mock data
      const mockServiceProviderData: ServiceProvider = {
        serviceproviderId: parseInt(serviceProviderId),
        firstName: userData.firstName,
        middleName: null,
        lastName: userData.lastName,
        mobileNo: 1234567890,
        alternateNo: null,
        emailId: auth0User?.email || "",
        gender: "Prefer not to say",
        buildingName: "Office Building",
        locality: "Business District",
        street: "Main Street",
        pincode: 123456,
        currentLocation: "City Center",
        nearbyLocation: "Downtown"
      };

      setServiceProviderData(mockServiceProviderData);

      // Update user data
      setUserData(prev => ({
        ...prev,
        contactNumber: mockServiceProviderData.mobileNo ? `+${mockServiceProviderData.mobileNo}` : "",
        altContactNumber: mockServiceProviderData.alternateNo ? `+${mockServiceProviderData.alternateNo}` : ""
      }));

      // Create address
      const serviceProviderAddress: Address = {
        id: "1",
        type: "Office",
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
        // Build request payload for service provider
        const payload = {
          serviceproviderId: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobileNo: userData.contactNumber?.replace("+", "") || null,
          alternateNo: userData.altContactNumber?.replace("+", "") || null,
          buildingName: serviceProviderData?.buildingName || "",
          street: serviceProviderData?.street || "",
          locality: serviceProviderData?.locality || "",
          pincode: serviceProviderData?.pincode || null,
          currentLocation: serviceProviderData?.currentLocation || "",
          nearbyLocation: serviceProviderData?.nearbyLocation || "",
        };

        console.log("Saving service provider data:", payload);
        
        // In a real app, you would make an API call here
        // await axiosInstance.put(`/api/serviceproviders/update/serviceprovider/${userId}`, payload);
        
        // For demo, just show success message
        Alert.alert("Success", "Profile updated successfully");
      } else {
        console.log("Saving customer data:", { ...userData, addresses });
        // TODO: Implement customer update API when available
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
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds((prev) =>
      prev.includes(id) ? prev.filter((addrId) => addrId !== id) : [...prev, id]
    );
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

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <LinearGradient
        colors={[
          'rgba(139, 187, 221, 0.8)',
          'rgba(213, 229, 233, 0.8)',
          'rgba(255,255,255,1)'
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.headerSkeleton}
      >
        <View style={styles.headerContentSkeleton}>
          <View style={styles.profileSkeleton}>
            <View style={styles.avatarSkeleton} />
            <View>
              <View style={styles.nameSkeleton} />
              <View style={styles.roleSkeleton} />
            </View>
          </View>
          <View style={styles.buttonSkeleton} />
        </View>
      </LinearGradient>

      {/* Main Content Skeleton */}
      <View style={styles.mainContentSkeleton}>
        <View style={styles.cardSkeleton}>
          {/* Form Header Skeleton */}
          <View style={styles.formHeaderSkeleton}>
            <View style={styles.titleSkeleton} />
          </View>

          {/* User Info Section Skeleton */}
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

            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
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

          <View style={styles.dividerSkeleton} />

          {/* Contact Info Section Skeleton */}
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

          {/* Address Section Skeleton */}
          <View style={styles.sectionSkeleton}>
            <View style={styles.labelSkeleton} />
            <View style={styles.addressCardSkeleton}>
              <View style={styles.addressHeaderSkeleton}>
                <View style={styles.addressTitleSkeleton} />
              </View>
              <View style={styles.addressLineSkeleton} />
              <View style={styles.addressLineShortSkeleton} />
            </View>
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
      {/* Header with Linear Gradient */}
      <LinearGradient
        colors={[
          'rgba(139, 187, 221, 0.8)',
          'rgba(213, 229, 233, 0.8)',
          'rgba(255,255,255,1)'
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Profile Left Section */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: auth0User?.picture || "https://via.placeholder.com/80",
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.greeting}>
                Hello, {userName || "User"}
              </Text>
              <Text style={styles.roleText}>
                {userRole === "SERVICE_PROVIDER" ? "Service Provider" : "Customer"}
              </Text>
            </View>
          </View>

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
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.formContainer}>
          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>My account</Text>
          </View>

          {/* User Info Section */}
          <View>
            <Text style={styles.sectionTitle}>User Information</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={auth0User?.nickname || userName || "User"}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={auth0User?.email || "No email available"}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={userData.firstName}
                  onChangeText={(value) => handleInputChange("firstName", value)}
                  editable={isEditing}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={userData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  editable={isEditing}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {userRole === "SERVICE_PROVIDER" ? "Provider ID" : "User ID"}
                </Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={
                    auth0User?.serviceproviderId ||
                    auth0User?.customerid ||
                    "N/A"
                  }
                  editable={false}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Contact Info Section */}
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                value={userData.contactNumber || ""}
                onChangeText={(value) => handleInputChange("contactNumber", value)}
                placeholder="No contact number provided"
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative Contact Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                value={userData.altContactNumber || ""}
                onChangeText={(value) => handleInputChange("altContactNumber", value)}
                placeholder="No alternative number"
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.addressesSection}>
            <Text style={styles.inputLabel}>Addresses</Text>

            {addresses.length === 0 ? (
              <Text style={styles.noAddressText}>No addresses saved yet</Text>
            ) : (
              <View style={styles.addressesList}>
                {addresses.map((address, idx) => {
                  const isExpanded =
                    idx === 0 || expandedAddressIds.includes(address.id);

                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={[styles.addressCard, isExpanded && styles.expandedAddressCard]}
                      onPress={() => idx !== 0 && toggleAddress(address.id)}
                      activeOpacity={idx === 0 ? 1 : 0.7}
                    >
                      <View style={styles.addressHeader}>
                        <View>
                          <Text style={styles.addressType}>
                            {address.type} Address
                          </Text>
                          {address.isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>

                        {idx !== 0 && (
                          <Icon
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                          />
                        )}
                      </View>

                      {isExpanded && (
                        <View style={styles.addressDetails}>
                          <Text style={styles.addressText}>{address.street}</Text>
                          <Text style={styles.addressText}>
                            {(address.city || "No city")},{" "}
                            {(address.country || "No country")}{" "}
                            {address.postalCode || ""}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Submit Button - Only show when editing */}
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
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0a2a66",
    flexShrink: 1,
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  editButtonContainer: {
    alignItems: "center",
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: "#f7fafc",
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
    fontSize: 16,
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
    fontSize: 16,
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
  profileSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
  },
  nameSkeleton: {
    width: 160,
    height: 28,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  roleSkeleton: {
    width: 100,
    height: 16,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  buttonSkeleton: {
    width: 120,
    height: 40,
    backgroundColor: "#ddd",
    borderRadius: 6,
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
});

export default ProfileScreen;