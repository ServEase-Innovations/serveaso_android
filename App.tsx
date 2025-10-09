import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  AppState,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  AppStateStatus,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Auth0Provider } from "react-native-auth0";
import config from "./auth0-configuration";
import Head from "./src/Head";
import HomePage from "./src/HomePage";
import DetailsView from "./src/DetailsView";
import Footer from "./src/Footer";
import Chatbot from "./src/Chatbot";
import Booking from "./src/Bookings";
import Dashboard from "./src/ServiceProvider/Dashboard";
import ProfileScreen from "./src/ProfileScreen";
import { BOOKINGS, DASHBOARD, PROFILE } from "./src/Constants/pagesConstants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationButton from "./src/NotificationButton";
import NotificationClient from "./src/NotificationClient/NotificationClient";
import BookingRequestToast from "./src/Notifications/BookingRequestToast";
import { io, Socket } from "socket.io-client";
import { AppUserProvider, useAppUser } from "./src/context/AppUserContext";

// Define types based on your component expectations
interface Engagement {
  engagement_id: number;
  service_type: string;
  booking_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  base_amount: number;
  customer_name?: string;
  customer_email?: string;
  status?: string;
}

interface SocketEngagementData {
  engagement: Engagement;
}

// Main App Component that uses the context
const MainApp = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState("HOME");
  const [selectedBookingType, setSelectedBookingType] = useState("");
  const [showProfileFromDashboard, setShowProfileFromDashboard] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [activeToast, setActiveToast] = useState<Engagement | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showNotificationClient, setShowNotificationClient] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Use the actual AppUserContext
  const { appUser } = useAppUser();

  useEffect(() => {
    // Handle app state changes
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (isFirstLaunch) {
          setShowSplash(true);
          fadeAnim.setValue(1);

          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setShowSplash(false);
              setIsFirstLaunch(false);
            });
          }, 1000);
        }
      }

      appState.current = nextAppState;
    });

    if (isFirstLaunch) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
          setIsFirstLaunch(false);
        });
      }, 2000);

      return () => {
        subscription.remove();
        clearTimeout(timer);
      };
    }

    return () => {
      subscription.remove();
    };
  }, [isFirstLaunch, fadeAnim]);

  // Socket connection for notifications
  useEffect(() => {
    // if (!appUser) {
    //   console.log("⏳ Waiting for user authentication...");
    //   return;
    // }

    console.log("🔎 Full user object:", appUser);

    // if (appUser?.role?.toUpperCase() === "SERVICE_PROVIDER") {
      console.log("++++++++++++++ CONNECTING TO SOCKET ++++++++++++++");

      const socketUrl = "http://localhost:5000";

      const newSocket = io(socketUrl, {
        transports: ["websocket"],
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to server:", newSocket.id);
        newSocket.emit("join", { providerId: 202 });
      });

      newSocket.on("new-engagement", (data: SocketEngagementData) => {
        console.log("📩 New engagement received:", data);
        setActiveToast(data.engagement);
        
        Alert.alert(
          "New Booking Request",
          `You have a new booking request for ${data.engagement.service_type}`,
          [
            {
              text: "View",
              onPress: () => setActiveToast(data.engagement)
            },
            {
              text: "Dismiss",
              style: "cancel"
            }
          ]
        );
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Disconnected from server");
      });

      newSocket.on("connect_error", (err: Error) => {
        console.error("❌ Connection error:", err.message);
      });

      setSocket(newSocket);

      return () => {
        console.log("🔌 Closing socket connection...");
        newSocket.disconnect();
      };
    // }
    
  }, [appUser]);

  const handleAccept = async (engagementId: number) => {
    try {
      const payload = {
        providerId: appUser?.serviceProviderId,
      };

      console.log("✅ Engagement accepted:", engagementId);
      setActiveToast(null);
      
      Alert.alert("Success", "Booking request accepted successfully");
    } catch (err) {
      console.error("❌ Failed to accept engagement", err);
      Alert.alert("Error", "Failed to accept booking request");
    }
  };

  const handleReject = (engagementId: number) => {
    console.log("❌ Engagement rejected:", engagementId);
    setActiveToast(null);
    Alert.alert("Rejected", "Booking request has been rejected");
  };

  const handleViewChange = (view: string) => {
    if (view === "") {
      setCurrentView("HOME");
      setShowProfileFromDashboard(false);
    } else {
      setCurrentView(view);
    }
  };

  const handleBookingType = (type: string) => {
    setSelectedBookingType(type);
  };

  const handleDashboardProfilePress = () => {
    setShowProfileFromDashboard(true);
  };

  const handleBackToDashboard = () => {
    setShowProfileFromDashboard(false);
  };

  const handleNotificationButtonPress = () => {
    setShowNotificationClient(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case "HOME":
        return (
          <View style={styles.homeContainer}>
            <HomePage
              sendDataToParent={handleViewChange}
              bookingType={handleBookingType}
            />
          </View>
        );
      case BOOKINGS:
        return <Booking />;
      case DASHBOARD:
        return showProfileFromDashboard ? (
          <ProfileScreen />
        ) : (
          <Dashboard onProfilePress={handleDashboardProfilePress} />
        );
      case PROFILE:
        return <ProfileScreen />;
      default:
        return (
          <DetailsView
            sendDataToParent={handleViewChange}
            selected={selectedBookingType}
          />
        );
    }
  };

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image
          source={require("./assets/images/serveasologo.png")}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#0a2a66ff" barStyle="light-content" translucent={true} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Fixed Header */}
        <View style={styles.headerWrapper}>
          <Head sendDataToParent={handleViewChange} />
        </View>
        
        {/* Notification Button - Positioned below header */}
        {appUser?.role?.toUpperCase() === "SERVICE_PROVIDER" && currentView === "HOME" && (
          <View style={styles.notificationButtonContainer}>
            <NotificationButton onPress={handleNotificationButtonPress} />
          </View>
        )}
        
        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {currentView === PROFILE ||
          (currentView === DASHBOARD && showProfileFromDashboard) ? (
            <ScrollView
              style={styles.profileScrollView}
              contentContainerStyle={styles.profileScrollContent}
            >
              {renderContent()}
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.mainScrollView}
              contentContainerStyle={[
                styles.scrollContent,
                (currentView === BOOKINGS || currentView === DASHBOARD) &&
                  styles.fullScreenScrollContent,
              ]}
              contentInsetAdjustmentBehavior="automatic"
            >
              {renderContent()}
              {currentView === "HOME" && <Footer />}
            </ScrollView>
          )}
        </View>

        {/* Notification Client Modal */}
        <Modal
          visible={showNotificationClient}
          animationType="slide"
          onRequestClose={() => setShowNotificationClient(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowNotificationClient(false)}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>
            <NotificationClient />
          </View>
        </Modal>

        {/* Chatbot */}
        <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        
        {/* Floating Chat Button */}
        {!chatbotOpen && (
          <View style={styles.chatButtonContainer}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setChatbotOpen(true)}
            >
              <Icon name="chat" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Booking Request Toast/Modal */}
        {activeToast && (
          <BookingRequestToast
            engagement={activeToast}
            onAccept={handleAccept}
            onReject={handleReject}
            onClose={() => setActiveToast(null)}
            visible={!!activeToast}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// Root App Component that wraps everything with providers
const App = () => {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <AppUserProvider>
        <MainApp />
        {/* <NotificationButton /> */}
      </AppUserProvider>
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0d2b61ff",
    justifyContent: "center",
    alignItems: "center",
  },
  splashImage: {
    width: "80%",
    height: "80%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerWrapper: {
    width: "100%",
    backgroundColor: "#0a2a66ff",
    zIndex: 50,
  },
  homeContainer: {
    flex: 1,
  },
  notificationButtonContainer: {
    position: "absolute",
    top: 80, // Position below the header
    right: 20,
    zIndex: 45,
    backgroundColor: "#3b82f6",
    borderRadius: 30,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  contentContainer: {
    flex: 1,
    marginTop: 50,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: "100%",
  },
  fullScreenScrollContent: {
    paddingBottom: 0,
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    flexGrow: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  chatButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 2000,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default App;