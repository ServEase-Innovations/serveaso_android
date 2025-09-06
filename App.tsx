import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Image, Animated, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Auth0Provider } from 'react-native-auth0';
import config from './auth0-configuration';
import Head from './src/Head';
import HomePage from './src/HomePage';
import DetailsView from './src/DetailsView';
import Footer from './src/Footer';
import Chatbot from './src/Chatbot';
import Booking from './src/Bookings';
import Dashboard from './src/ServiceProvider/Dashboard';
import ProfileScreen from './src/ProfileScreen';
import { BOOKINGS, DASHBOARD, PROFILE } from './src/Constants/pagesConstants';
import UserHoliday from './src/UserHoliday';
import ModifyBookingDialog from './src/ModifyBookingDialog';

const App = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedBookingType, setSelectedBookingType] = useState('');
  const [showProfileFromDashboard, setShowProfileFromDashboard] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        setShowSplash(true);
        fadeAnim.setValue(1);
        
        // Show splash for 2 seconds then fade out
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setShowSplash(false);
          });
        }, 1000);
      }
      
      appState.current = nextAppState;
    });

    // Initial splash screen
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2000);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, []);

  const handleViewChange = (view: string) => {
    // Empty string means HomePage
    if (view === '') {
      setCurrentView('HOME');
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

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <HomePage 
            sendDataToParent={handleViewChange} 
            bookingType={handleBookingType}
          />
        );
      case BOOKINGS:
        return <Booking />;
      case DASHBOARD:
        return showProfileFromDashboard ? (
          <ProfileScreen/>
        ) : (
          <Dashboard onProfilePress={handleDashboardProfilePress} />
        );
      case PROFILE:
        return <ProfileScreen  />;
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
          source={require('./assets/images/Final1.png')} 
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Fixed Header */}
          <View style={styles.header}>
            <Head sendDataToParent={handleViewChange} />
          </View>

          {/* Scrollable Content Below Header */}
          <View style={styles.contentContainer}>
          {currentView === PROFILE || (currentView === DASHBOARD && showProfileFromDashboard) ? (
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
                  styles.fullScreenScrollContent
                ]}
                contentInsetAdjustmentBehavior="automatic"
              >
                {renderContent()}
                {/* Only show Footer for HomePage */}
                {currentView === 'HOME' && <Footer />}
              </ScrollView>
            )}
          </View>

          {/* Chatbot */}
          <Chatbot 
            open={chatbotOpen} 
            onClose={() => setChatbotOpen(false)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0d2b61ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '80%',
    height: '80%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 0,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: 50, // This pushes the content below the fixed header
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingBottom: 20,
     justifyContent: 'space-between', // This ensures content expands properly
    minHeight: '100%', // Ensure it takes at least full height
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
});

export default App;