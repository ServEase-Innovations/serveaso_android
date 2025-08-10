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

const App = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedBookingType, setSelectedBookingType] = useState('');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleBookingType = (type: string) => {
    setSelectedBookingType(type);
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
        return <Dashboard />;
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

  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header - Always visible */}
          <View style={styles.header}>
            <Head sendDataToParent={handleViewChange} />
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {currentView === PROFILE ? (
              // For ProfileScreen, use a separate ScrollView with flex: 1
              <ScrollView 
                style={styles.profileScrollView}
                contentContainerStyle={styles.profileScrollContent}
              >
                {renderContent()}
              </ScrollView>
            ) : (
              // For other views, use the existing ScrollView
              <ScrollView
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
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 0,
    height: 60, // Increased height to prevent cutting
    justifyContent: 'center',
  },
  contentContainer: {
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