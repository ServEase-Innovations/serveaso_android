import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
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
                {currentView !== BOOKINGS && currentView !== DASHBOARD && <Footer />}
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
    paddingBottom: 20,
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

