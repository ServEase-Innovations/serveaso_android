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
import Dashboard from './src/ServiceProvider/Dashboard'; // Import the Dashboard component
import { BOOKINGS, DASHBOARD } from './src/Constants/pagesConstants'; // Add DASHBOARD to the import

const App = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedBookingType, setSelectedBookingType] = useState('');

  const handleViewChange = (view: string) => {
    if (view === 'HOME') {
      setCurrentView('HOME');
    } else if (view === BOOKINGS) {
      setCurrentView(BOOKINGS);
    } else if (view === DASHBOARD) { // Add this condition
      setCurrentView(DASHBOARD);
    } else {
      setCurrentView(view);
    }
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
      case DASHBOARD: // Add this case
        return <Dashboard />;
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
          <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
              <Head sendDataToParent={handleViewChange} />
            </View>

            {/* Scrollable Content */}
            <View style={styles.contentContainer}>
              <SafeAreaView style={styles.body} edges={['bottom']}>
                <ScrollView 
                  contentContainerStyle={[
                    styles.scrollContent,
                    (currentView === BOOKINGS || currentView === DASHBOARD) && styles.fullScreenScrollContent
                  ]}
                  contentInsetAdjustmentBehavior="automatic"
                >
                  {renderContent()}
                  {currentView !== BOOKINGS && currentView !== DASHBOARD && <Footer />}
                </ScrollView>
              </SafeAreaView>
            </View>

            {/* Chatbot - Rendered outside the scroll view */}
            <Chatbot 
              open={chatbotOpen} 
              onClose={() => setChatbotOpen(false)}
            />
          </View>
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
    backgroundColor: '#fff',
    position: 'relative',
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 0,
    height: 45,
  },
  contentContainer: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  fullScreenScrollContent: { // Renamed from bookingScrollContent to be more generic
    paddingBottom: 0,
  },
});

export default App;