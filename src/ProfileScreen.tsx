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
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user: auth0User, isLoading } = useAuth0();

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  useEffect(() => {
    if (auth0User) {
      const name = auth0User.name || null;
      const email = auth0User.email || "";

      if (name) {
        const nameParts = name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
      }

      const id =
        auth0User.serviceProviderId ||
        auth0User["https://yourdomain.com/serviceProviderId"] ||
        auth0User.customerid ||
        null;

      setUserName(name);
      setUserId(id ? Number(id) : null);

      console.log("User data:", auth0User);
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("ID:", id);
    }
  }, [auth0User]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Linear Gradient */}
       <LinearGradient
        colors={[
          'rgba(139, 187, 221, 0.8)', // Blue tone
          'rgba(213, 229, 233, 0.8)', // Lighter blue
          'rgba(255,255,255,1)'       // White at the bottom
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}} // Vertical fade
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
            <Text style={styles.greeting}>
              Hello, {userName || "User"}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
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
                  style={styles.input}
                  value={auth0User?.nickname || userName || "User"}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={auth0User?.email || "No email available"}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>User ID</Text>
                <TextInput
                  style={styles.input}
                  value={
                    auth0User?.serviceProviderId ||
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
                style={styles.input}
                value="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative Contact Number</Text>
              <TextInput
                style={styles.input}
                value="+1 (555) 987-6543"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value="Bld Mihail Kogalniceanu, nr. 8 Bl 1, Sc 1, Ap 09"
              editable={false}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value="New York"
                editable={false}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                value="United States"
                editable={false}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal code"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
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
  editButton: {
    backgroundColor: "rgba(29, 101, 183, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(14, 61, 122, 0.5)",
  },
  editButtonText: {
    color: "#0a2a66",
    fontWeight: "600",
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
    backgroundColor: "#f7fafc",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 20,
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
});

export default ProfileScreen;