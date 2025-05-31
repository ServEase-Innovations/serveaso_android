import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import ClipboardLib from '@react-native-clipboard/clipboard';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AgentRegistrationFormProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: () => void;
}

const AgentRegistrationForm: React.FC<AgentRegistrationFormProps> = ({ 
  onBackToLogin, 
  onRegistrationSuccess 
}) => {
  const [formData, setFormData] = useState({
    companyName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [referralCode, setReferralCode] = useState('');

  const mobileRegex = /^[0-9]{10}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    validateForm(name, value);
  };

  const validateForm = (field: string, value: string) => {
    let errors = { ...validationErrors };

    if (field === 'mobileNumber' && !mobileRegex.test(value)) {
      errors.mobileNumber = 'Enter a valid 10-digit mobile number';
    } else if (field === 'email' && !emailRegex.test(value)) {
      errors.email = 'Enter a valid email address';
    } else if (field === 'password' && !passwordRegex.test(value)) {
      errors.password =
        'Password must be at least 8 characters with 1 letter, 1 number, and 1 special character';
    } else if (field === 'confirmPassword' && value !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    } 
    // else {
    //   delete errors[field];
    // }

    setValidationErrors(errors);
  };

  const handleSubmit = async () => {
    const requestData = {
      companyName: formData.companyName,
      emailId: formData.email,
      phoneNo: Number(formData.mobileNumber),
      address: formData.address,
      password: formData.password,
    };

    try {
      const response = await axios.post(
        'http://43.205.212.94:8080/vendors/add',
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        const generatedCode = response.data.referralCode || 'REF1234567';
        setReferralCode(generatedCode);
        ClipboardLib.setString(generatedCode);
        Alert.alert('Success', 'Vendor added successfully!\nReferral code copied to clipboard!');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to add vendor');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while connecting to the API.');
    }
  };

  const handleCopyReferralCode = () => {
    if (referralCode) {
      ClipboardLib.setString(referralCode);
      Alert.alert('Copied', 'Referral code copied to clipboard!');
    }
  };

  return (
    <View style={styles.container}>
<TouchableOpacity 
        style={styles.backButton} 
        onPress={onBackToLogin}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>       
      <Text style={styles.title}>Agent Registration</Text>

      <TextInput
        style={styles.input}
        placeholder="Name of the Company *"
        value={formData.companyName}
        onChangeText={(text) => handleChange('companyName', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number *"
        keyboardType="numeric"
        value={formData.mobileNumber}
        onChangeText={(text) => handleChange('mobileNumber', text)}
      />
      {validationErrors.mobileNumber && <Text style={styles.error}>{validationErrors.mobileNumber}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email ID *"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      {validationErrors.email && <Text style={styles.error}>{validationErrors.email}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Password *"
        secureTextEntry={!showPassword}
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'} Password</Text>
      </TouchableOpacity>
      {validationErrors.password && <Text style={styles.error}>{validationErrors.password}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Confirm Password *"
        secureTextEntry={!showConfirmPassword}
        value={formData.confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
      />
      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
        <Text style={styles.toggleText}>{showConfirmPassword ? 'Hide' : 'Show'} Confirm Password</Text>
      </TouchableOpacity>
      {validationErrors.confirmPassword && <Text style={styles.error}>{validationErrors.confirmPassword}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Company Address *"
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Submit" onPress={handleSubmit} />
      </View>

      {referralCode !== '' && (
        <View style={styles.referralBox}>
          <Text style={styles.referralText}>Referral Code: {referralCode}</Text>
          <TouchableOpacity onPress={handleCopyReferralCode}>
            <Text style={styles.copyLink}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AgentRegistrationForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  toggleText: {
    color: '#007BFF',
    textAlign: 'right',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  referralBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  referralText: {
    fontSize: 16,
  },
  copyLink: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
   backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f8ad5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
