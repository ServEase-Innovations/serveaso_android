import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProfileScreenProps {
  onBackPress: () => void;
}

const ProfileScreen = ({ onBackPress }: ProfileScreenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: 'lucky.jesse',
    email: 'jesse@example.com',
    firstName: 'Lucky',
    lastName: 'Jesse',
    contactNumber: '+1 (555) 123-4567',
    altContactNumber: '+1 (555) 987-6543',
    address: 'Bld Mihail Kogalniceanu, nr. 8 Bl 1, Sc 1, Ap 09',
    city: 'New York',
    country: 'United States',
    postalCode: '',
  });

  const handleInputChange = (name:any, value:any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    setIsEditing(false);
    console.log('Form submitted:', formData);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Header with Background Image */}
          <View style={styles.headerContainer}>
            <View style={styles.headerGradient}>
              <View style={styles.headerContent}>
                 <TouchableOpacity 
                  style={styles.backButton}
                  onPress={onBackPress}
                >
                  <Icon name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerProfileSection}>
                  <Image
           
           source={{ uri: 'https://demos.creative-tim.com/argon-dashboard/assets-old/img/theme/team-4.jpg' }}
                    style={styles.headerProfileImage}
                  />
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Hello {formData.firstName}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.editButton, isEditing && styles.editButtonActive]}
                  onPress={toggleEdit}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'Cancel' : 'Edit profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.contentRow}>
              <View style={styles.accountFormFullWidth}>
                <View style={styles.accountForm}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>My account</Text>
                  </View>
                <View style={styles.formBody}>
                    <Text style={styles.sectionTitle}>USER INFORMATION</Text>
                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.username}
                          editable={false}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Email address</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.email}
                          keyboardType="email-address"
                          editable={false}
                        />
                      </View>
                    </View>
                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>First name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.firstName}
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('firstName', text)}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Last name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.lastName}
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('lastName', text)}
                        />
                      </View>
                    </View>
                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Contact Number</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.contactNumber}
                          keyboardType="phone-pad"
                          editable={false}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Alternative Contact Number</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.altContactNumber}
                          keyboardType="phone-pad"
                          editable={false}
                        />
                      </View>
                    </View>
                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, styles.fullWidth]}>
                        <Text style={styles.inputLabel}>Address</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.address}
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('address', text)}
                        />
                      </View>
                    </View>
                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.city}
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('city', text)}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Country</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.country}
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('country', text)}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Postal code</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.postalCode}
                          placeholder="Postal code"
                          keyboardType="numeric"
                          editable={isEditing}
                          onChangeText={(text) => handleInputChange('postalCode', text)}
                        />
                      </View>
                    </View>
                    <View style={styles.formActionsBottom}>
                      <View style={styles.submitButtonContainer}>
                        <TouchableOpacity 
                          style={[styles.submitButton, !isEditing && styles.submitButtonDisabled]}
                          onPress={handleSubmit}
                          disabled={!isEditing}
                        >
                          <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Header styles
  headerContainer: {
    height: 200,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 43, 77, 0.8)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 40,
  },
 backButton: {
    position: 'absolute',
    left: 20,
    top: 40,
    zIndex: 1,
    padding: 10,
  },
  headerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 20,
  },
  headerProfileImage: {
    width: 90, // Increased size
    height: 90, // Increased size
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'white',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26, // Slightly larger
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#11cdef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    shadowColor: '#11cdef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 1,
  },
  editButtonActive: {
    backgroundColor: '#fb6340', // Different color when editing
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Main content styles
  mainContent: {
    paddingVertical: 20,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  accountFormFullWidth: {
    width: '95%',
  },
  accountForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#8898aa',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    paddingVertical: 20,
    paddingHorizontal: 15,
    width: '100%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#32325d',
  },
  formBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8898aa',
    textTransform: 'uppercase',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 15,
  },
  formGroup: {
    flex: 1,
    minWidth: windowWidth > 400 ? 200 : '100%',
    marginBottom: 15,
  },
  fullWidth: {
    flex: 1,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525f7f',
    marginBottom: 8,
  },
  input: {
    fontSize: 14,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cad1d7',
    borderRadius: 4,
    backgroundColor: '#fff',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    width: '100%',
    marginVertical: 20,
  },
  formActionsBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 30,
  },
  submitButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 200,
  },
  submitButton: {
    backgroundColor: '#5e72e4',
    padding: 12,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#f7fafc',
  },
});

export default ProfileScreen;