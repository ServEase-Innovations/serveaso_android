import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Button,
  Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // CLI compatible icon lib
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";
import axiosInstance from "./axiosInstance";
import ServiceProviderRegistration from "./ServiceProviderRegistration";
import AgentRegistrationForm from "./AgentRegistrationForm";

interface LoginProps {
  onClose: () => void;
  onLoginSuccess: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
const [isRegisteringAsServiceProvider, setIsRegisteringAsServiceProvider] = useState(false);
const [isRegisteringAsAgent, setIsRegisteringAsAgent] = useState(false);

const handleSignUpAsAgent = () => {
  setIsRegisteringAsAgent(true);
};

const handleSignUpAsServiceProvider = () => {
  setIsRegisteringAsServiceProvider(true);
};

  const handleSignUpAsUser = () => {
    setIsRegistering(true);
  };
  
  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post("/api/user/login", {
        username: email,
        password: password,
      });

      if (response.status === 200 && response.data) {
        const { message, role } = response.data;

        Alert.alert("Success", message || "Login successful!");
        onLoginSuccess(role);
      } else {
        throw new Error(
          response.data?.message || "Login failed. Please try again."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "An error occurred during login."
      );
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
  };

  if (isForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  if (isRegistering) {
    return <Registration onBackToLogin={() => setIsRegistering(false)} />;
  }
  if (isRegisteringAsServiceProvider) {
  return <ServiceProviderRegistration onBackToLogin={function (): void {
    throw new Error("Function not implemented.");
  } } onRegistrationSuccess={function (): void {
    throw new Error("Function not implemented.");
  } }  
  />;
}
if (isRegisteringAsAgent) {
  return <AgentRegistrationForm 
           onBackToLogin={() => setIsRegisteringAsAgent(false)} 
           onRegistrationSuccess={() => {
             setIsRegisteringAsAgent(false);
             // You might want to handle successful registration here
           }} 
         />;
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.close}>
        <Button title="Close" onPress={onClose} color="#075aa8" />
      </View>
      <Text style={styles.title}>Log in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.iconButton}
        >
          <MaterialIcons
            name={showPassword ? "visibility" : "visibility-off"}
            size={24}
            color="#aaa"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleForgotPasswordClick}>
        <Text style={styles.forgotPassword}>Forgot your password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOG IN</Text>
      </TouchableOpacity>
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account?</Text>
        <TouchableOpacity onPress={handleSignUpAsUser}>
  <Text style={styles.signUpLink}>Sign Up As User</Text>
</TouchableOpacity>

       <TouchableOpacity onPress={handleSignUpAsServiceProvider}>
  <Text style={styles.signUpLink}>Sign Up As Service Provider</Text>
</TouchableOpacity>

<TouchableOpacity onPress={handleSignUpAsAgent}>
  <Text style={styles.signUpLink}>Sign Up As Agent</Text>
</TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  close: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  forgotPassword: {
    color: "#4f8ad5",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4f8ad5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  signUpContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    color: "#333",
  },
  signUpLink: {
    color: "#4f8ad5",
    textDecorationLine: "underline",
    marginTop: 5,
  },
});

export default Login;
