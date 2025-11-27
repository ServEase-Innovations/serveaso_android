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
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Auth0Provider } from "react-native-auth0";
import config from "./auth0-configuration";
import Head from "./src/Header/Header";
import HomePage from "./src/HomePage/HomePage";
import DetailsView from "./src/DetailsView/DetailsView";
import Footer from "./src/Footer/Footer";
import Chatbot from "./src/Chatbot/Chatbot";
import Booking from "./src/UserProfile/Bookings";
import Dashboard from "./src/ServiceProvider/Dashboard";
import ProfileScreen from "./src/UserProfile/ProfileScreen";
import { BOOKINGS, DASHBOARD, PROFILE } from "./src/Constants/pagesConstants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationButton from "./src/Notifications/NotificationButton";
import NotificationClient from "./src/NotificationClient/NotificationClient";
import BookingRequestToast from "./src/Notifications/BookingRequestToast";
import io, { Socket } from "socket.io-client";
import { AppUserProvider, useAppUser } from "./src/context/AppUserContext";
import axios from "axios";
import { useDispatch } from "react-redux";
import { add } from "./src/features/pricingSlice";
import MobileNumberDialog from "./src/UserProfile/MobileNumberDialog";
import axiosInstance from "./src/services/axiosInstance";
import Config from "react-native-config";

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
  const [shouldShowMobileDialog, setShouldShowMobileDialog] = useState(false);
  const [hasCheckedMobileNumber, setHasCheckedMobileNumber] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = "https://payments-j5id.onrender.com";

  console.log("Loaded ENV =", Config.API_BASE_URL);
  // console.log("UTILS BASE URL =", process.env.REACT_APP_UTLIS_URL);

  const dispatch = useDispatch();
  const { appUser } = useAppUser();

  useEffect(() => {
    console.log("🔄 AppUser changed:", appUser ? `Logged in as ${appUser.role}` : "Logged out");

    if (!appUser) {
      console.log("👤 No user detected, resetting to HOME view");
      setCurrentView("HOME");
      setShowProfileFromDashboard(false);
      setShowNotificationClient(false);
      setShouldShowMobileDialog(false);
      setHasCheckedMobileNumber(false);
      setCustomerData(null);
    }
  }, [appUser]);

  useEffect(() => {
    if (!appUser || appUser?.role?.toUpperCase() !== "CUSTOMER" || hasCheckedMobileNumber) {
      return;
    }

    const fetchCustomerDetails = async () => {
      try {
        console.log("📱 Fetching customer details for ID:", appUser.customerid);
        const response = await axiosInstance.get
          (`/api/customer/get-customer-by-id/${appUser.customerid}`
        );

        const customer = response.data;
        setCustomerData(customer);

        if (!customer?.mobileNo) {
          console.warn("⚠️ Customer mobile number is missing (null). Showing dialog...");
          setShouldShowMobileDialog(true);
        } else {
          console.log("✅ Customer has mobile number:", customer.mobileNo);
          setShouldShowMobileDialog(false);
        }

        setHasCheckedMobileNumber(true);
      } catch (error: any) {
        console.error("❌ Error fetching customer details:", error);
        if (error.response?.status === 404) {
          setCustomerData(null);
          setShouldShowMobileDialog(true);
        } else {
          setShouldShowMobileDialog(false);
        }
        setHasCheckedMobileNumber(true);
      }
    };

    const timer = setTimeout(() => {
      fetchCustomerDetails();
    }, 1500);

    return () => clearTimeout(timer);
  }, [appUser, hasCheckedMobileNumber]);

  const handleMobileDialogSuccess = () => {
    console.log("✅ Mobile dialog completed successfully");
    setShouldShowMobileDialog(false);
    setHasCheckedMobileNumber(true);
    if (appUser?.customerid) {
      setTimeout(() => {
        setHasCheckedMobileNumber(false);
      }, 1000);
    }
  };

  const handleMobileDialogClose = () => {
    console.log("📱 Mobile dialog closed");
    setShouldShowMobileDialog(false);
    setHasCheckedMobileNumber(true);
  };

  useEffect(() => {
    setHasCheckedMobileNumber(false);
    setShouldShowMobileDialog(false);
    setCustomerData(null);
  }, [appUser?.customerid]);

  useEffect(() => {
    console.log("🔍 Mobile Dialog State:", {
      shouldShowMobileDialog,
      hasCheckedMobileNumber,
      customerData: customerData ? "Exists" : "No data",
      appUser: appUser
        ? {
            role: appUser.role,
            customerid: appUser.customerid,
            hasCustomerId: !!appUser.customerid,
          }
        : "No user",
    });
  }, [shouldShowMobileDialog, hasCheckedMobileNumber, appUser, customerData]);

  useEffect(() => {
    getPricingData();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
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

    return () => subscription.remove();
  }, [isFirstLaunch, fadeAnim]);

  const getPricingData = async () => {
    try {
      const response = await axios.get(`https://utils-ndt3.onrender.com/records`);
      dispatch(add(response.data));
      console.log("Pricing Data:", response.data);
    } catch (error) {
      console.error("Error fetching pricing data:", error);
    }
  };

  useEffect(() => {
    if (!appUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (appUser.role?.toUpperCase() !== "SERVICE_PROVIDER") return;
    if (socketRef.current) return;

    let mounted = true;

    (async () => {
      const token = appUser?.accessToken ?? null;

      const socket = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        auth: token ? { token } : undefined,
        timeout: 20000,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[socket] connected", socket.id);
        socket.emit("join", { providerId: appUser.serviceProviderId });
      });

      socket.on("new-engagement", (payload: any) => {
        console.log("[socket] new-engagement", payload);
        const engagement = payload?.engagement ?? payload;
        Alert.alert(
          "New Booking Request",
          `Booking for ${engagement?.service_type ?? "a service"}`
        );
      });

      socket.on("connect_error", (err) => {
        console.error("[socket] connect_error", err);
      });

      socket.io.on("reconnect_attempt", (attempt) => {
        console.log("[socket] reconnect attempt", attempt);
      });

      if (!mounted) {
        socket.disconnect();
        socketRef.current = null;
      }
    })().catch((e) => console.warn("[socket] init failed", e));

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s) {
        s.off("connect");
        s.off("new-engagement");
        s.off("connect_error");
        s.disconnect();
        socketRef.current = null;
      }
    };
  }, [appUser]);

  const handleAccept = (id: number) => {
    Alert.alert("Success", "Booking request accepted successfully");
    setActiveToast(null);
  };

  const handleReject = (id: number) => {
    Alert.alert("Rejected", "Booking request has been rejected");
    setActiveToast(null);
  };

  const handleViewChange = (view: string) => {
    if (view === "" || view === "FORCE_HOME") {
      setCurrentView("HOME");
      setShowProfileFromDashboard(false);
    } else {
      setCurrentView(view);
    }
  };

  const handleDashboardProfilePress = () => setShowProfileFromDashboard(true);
  const handleBackToDashboard = () => setShowProfileFromDashboard(false);
  const handleNotificationButtonPress = () => setShowNotificationClient(true);
  const forceShowMobileDialog = () => {
    setShouldShowMobileDialog(true);
    setHasCheckedMobileNumber(false);
  };

  const renderContent = () => {
    if (appUser && appUser.role?.toUpperCase() === "SERVICE_PROVIDER" && currentView === "HOME") {
      return showProfileFromDashboard ? (
        <ProfileScreen />
      ) : (
        <Dashboard onProfilePress={handleDashboardProfilePress} />
      );
    }

    switch (currentView) {
      case "HOME":
        return (
          <View style={styles.homeContainer}>
            <HomePage sendDataToParent={handleViewChange} bookingType={() => {}} />
            {/* {__DEV__ && appUser?.role?.toUpperCase() === "CUSTOMER" && (
              <TouchableOpacity style={styles.testButton} onPress={forceShowMobileDialog}>
                <Text style={styles.testButtonText}>Test Mobile Dialog</Text>
              </TouchableOpacity>
            )} */}
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
        return <DetailsView sendDataToParent={handleViewChange} selected={selectedBookingType} />;
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
      {/* ✅ FIXED STATUS BAR SECTION */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.headerWrapper}>
          <Head sendDataToParent={handleViewChange} />
        </View>
        

        {appUser && appUser.role?.toUpperCase() === "SERVICE_PROVIDER" && (
          <View style={styles.notificationButtonContainer}>
            <NotificationButton onPress={handleNotificationButtonPress} />
          </View>
        )}

        <View style={styles.contentContainer}>
          {currentView === PROFILE ||
          (currentView === DASHBOARD && showProfileFromDashboard) ? (
            <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent}>
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
              {currentView === "HOME" &&
                (!appUser || appUser?.role?.toUpperCase() === "CUSTOMER") && <Footer />}
            </ScrollView>
          )}
        </View>

        {shouldShowMobileDialog && (
          <MobileNumberDialog 
            open={shouldShowMobileDialog}
            onClose={handleMobileDialogClose}
            onSuccess={handleMobileDialogSuccess}
          />
        )}

        <Modal
          visible={showNotificationClient}
          animationType="slide"
          onRequestClose={() => setShowNotificationClient(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotificationClient(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>
            <NotificationClient />
          </View>
        </Modal>

        <Chatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />

        {!chatbotOpen && (
          <View style={styles.chatButtonContainer}>
            <TouchableOpacity style={styles.chatButton} onPress={() => setChatbotOpen(true)}>
              <Icon name="chat" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

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

const App = () => (
  <Auth0Provider domain={config.domain} clientId={config.clientId}>
    <AppUserProvider>
      <MainApp />
    </AppUserProvider>
  </Auth0Provider>
);

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0d2b61ff",
    justifyContent: "center",
    alignItems: "center",
  },
  splashImage: { width: "80%", height: "80%" },
  safeArea: {
    flex: 1,
    backgroundColor: "#0a2a66", // ✅ blue background for status bar area
  },
  headerWrapper: {
    width: "100%",
    backgroundColor: "#0a2a66ff",
    zIndex: 50,
  },
  homeContainer: { flex: 1 },
  notificationButtonContainer: {
    position: "absolute",
    top: 80,
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
  contentContainer: { flex: 1, marginTop: 50, backgroundColor: "#fff" },
  mainScrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "space-between", minHeight: "100%" },
  fullScreenScrollContent: { paddingBottom: 0 },
  profileScrollView: { flex: 1 },
  profileScrollContent: { flexGrow: 1 },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: 50,
  },
  closeButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 16, color: "#333" },
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
  // testButton: {
  //   position: "absolute",
  //   bottom: 20,
  //   left: 20,
  //   backgroundColor: "#ff6b6b",
  //   padding: 10,
  //   borderRadius: 8,
  //   zIndex: 1000,
  // },
  // testButtonText: { color: "white", fontSize: 12, fontWeight: "bold" },
});

export default App;
