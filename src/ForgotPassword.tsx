import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios'; // Replace with your Expo-compatible axios instance

interface ForgotPasswordProps {
  onBackToLogin: () => void; // Callback to navigate back to the login page
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      setPasswordStrengthMessage('Password must be at least 8 characters long.');
    } else if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setPasswordStrengthMessage('Password must contain uppercase, lowercase, number, and special character.');
    } else {
      setPasswordStrengthMessage('');
    }
  };

  const handleUpdatePassword = async () => {
    if (!emailOrUsername || !newPassword) {
      setSnackbarMessage('Please fill out all fields.');
      setModalVisible(true);
      return;
    }

    if (passwordStrengthMessage) {
      setSnackbarMessage(passwordStrengthMessage);
      setModalVisible(true);
      return;
    }

    try {
      const response = await axios.put('https://43.205.212.94:8080/api/user/update', {
        username: emailOrUsername,
        password: newPassword,
      });

      if (response.status === 200) {
        setSnackbarMessage('Password updated successfully!');
        setEmailOrUsername('');
        setNewPassword('');
      } else {
        setSnackbarMessage('Failed to update password. Please try again.');
      }
    } catch (error) {
      setSnackbarMessage('An error occurred. Please try again later.');
    }

    setModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Update Password</Text>
        <Text style={styles.subtitle}>Enter your email/username and new password to update your account.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email/Username"
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              validatePassword(text);
            }}
          />
          {/* <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.icon}>
            <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={24} color="gray" />
          </TouchableOpacity> */}
        </View>
        {passwordStrengthMessage ? <Text style={styles.error}>{passwordStrengthMessage}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {/* Snackbar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{snackbarMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  error: {
    fontSize: 12,
    color: '#ff0000',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#4f46e5',
    padding: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ForgotPassword;
