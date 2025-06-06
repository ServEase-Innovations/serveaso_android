/* eslint-disable */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Button,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import axiosInstance from './axiosInstance';
import { add } from './features/userSlice';
import { PROFILE } from './Constants/pagesConstants';
import Registration from './Registration';
import AgentRegistrationForm from './AgentRegistrationForm';
import ServiceProviderRegistration from './ServiceProviderRegistration';
import ForgotPassword from './ForgotPassword';

interface ChildComponentProps {
  sendDataToParent?: (data: string) => void;
  bookingPage?: (data: string | undefined) => void;
   onClose: () => void;
    onLoginSuccess?: () => void; // Add this new prop
}

const Login: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  bookingPage,
  onClose,
  onLoginSuccess,
}) => {
  const [isRegistration, setIsRegistration] = useState(false);
  const [isServiceRegistration, setServiceRegistration] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAgentRegistration, setAgentRegistration] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const dispatch = useDispatch();

  const handleSignUpClick = () => {
    setIsRegistration(true);
  };

  const handleBackToLogin = () => {
    setIsRegistration(false);
    setIsForgotPassword(false);
    setServiceRegistration(false);
    setAgentRegistration(false);
  };

  const handleSignUpClickServiceProvider = () => {
    setServiceRegistration(true);
  };

  const handleSignUpClickAgent = () => {
    setAgentRegistration(true);
  };

  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const handleLogin = async () => {
  //   if (!email || !password) {
  //     Alert.alert('Error', 'Please enter both email and password');
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     const response = await axiosInstance.post('/api/user/login', {
  //       username: email,
  //       password: password,
  //     });

  //     console.log('Response Data:', response.data);

  //     if (response.status === 200 && response.data) {
  //       const { message, role, customerDetails } = response.data;
  //       const firstName = customerDetails?.firstName || 'Unknown';

  //       dispatch(add(response.data));

  //       Alert.alert('Success', message || 'Login successful!');

  //       // Handle redirection after login
  //       setTimeout(() => {
  //         if (role === 'SERVICE_PROVIDER') {
  //           if (sendDataToParent) {
  //             sendDataToParent(PROFILE);
  //           } else if (bookingPage) {
  //             bookingPage(role);
  //           }
  //         } else {
  //           if (sendDataToParent) {
  //             sendDataToParent('');
  //           } else if (bookingPage) {
  //             bookingPage(role);
  //           }
  //         }
  //       }, 1000);
  //     } else {
  //       throw new Error(
  //         response.data?.message ||
  //           'Login failed. Please check your credentials.',
  //       );
  //     }
  //   } catch (error: any) {
  //     console.error('Login error:', error);
  //     Alert.alert(
  //       'Error',
  //       error.response?.data?.message || 'An error occurred during login.',
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

   const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/api/user/login', {
        username: email,
        password: password,
      });

      console.log('Response Data:', response.data);

      if (response.status === 200 && response.data) {
        const { message, role, customerDetails } = response.data;
        const firstName = customerDetails?.firstName || 'Unknown';

        dispatch(add(response.data));

        Alert.alert('Success', message || 'Login successful!');

        // Handle redirection after login
        setTimeout(() => {
          if (role === 'SERVICE_PROVIDER') {
            if (sendDataToParent) {
              sendDataToParent(PROFILE);
            } else if (bookingPage) {
              bookingPage(role);
            }
          } else {
            // Call onLoginSuccess for regular users
            if (onLoginSuccess) {
              onLoginSuccess();
            } else if (sendDataToParent) {
              sendDataToParent('');
            } else if (bookingPage) {
              bookingPage(role);
            }
          }
        }, 1000);
      } else {
        throw new Error(
          response.data?.message ||
            'Login failed. Please check your credentials.',
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'An error occurred during login.',
      );
    } finally {
      setIsLoading(false);
    }
  };


  if (isForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  if (isRegistration) {
    return <Registration onBackToLogin={handleBackToLogin} />;
  }

  if (isServiceRegistration) {
    return <ServiceProviderRegistration onBackToLogin={handleBackToLogin} onRegistrationSuccess={function (): void {
      throw new Error('Function not implemented.');
    } } />;
  }

  if (isAgentRegistration) {
    return <AgentRegistrationForm onBackToLogin={handleBackToLogin} onRegistrationSuccess={function (): void {
      throw new Error('Function not implemented.');
    } } />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
        <TouchableOpacity 
      style={styles.closeButton} 
      onPress={onClose}
    >
      <Text style={styles.closeButtonText}>X</Text>
    </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.outerContainer}>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Log in</Text>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.eyeIcon}
                  disabled={!password}>
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={24}
                    color={password ? '#666' : '#ccc'}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleForgotPasswordClick}>
                <Text style={styles.forgotPassword}>
                  Forget your password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'LOGGING IN...' : 'LOG IN'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleSignUpClick}>
                <Text style={styles.signUpLink}>Sign Up As User</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignUpClickServiceProvider}>
                <Text style={styles.signUpLink}>Sign Up As Service Provider</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignUpClickAgent}>
                <Text style={styles.signUpLink}>Sign Up As Agent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#075aa8',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 3,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  outerContainer: {
    borderRadius: 26,
    margin: 0,
    padding: 2,
    width: '100%',
    backgroundColor: '#3b82f6', // Solid blue color instead of gradient
  },
  loginContainer: {
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    color: '#3b82f6',
    fontSize: 14,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#3b82f6', // Solid blue color instead of gradient
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  signUpLink: {
    color: '#3b82f6',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default Login;