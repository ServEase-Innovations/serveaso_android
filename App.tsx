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

const App = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedBookingType, setSelectedBookingType] = useState('');

  const handleDataFromChild = (data: string) => {
    if (data === 'HOME') {
      setCurrentView('HOME');
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleBookingType = (type: string) => {
    setSelectedBookingType(type);
  };

  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
              <Head sendDataToParent={handleDataFromChild} />
            </View>

            {/* Scrollable Content */}
            <View style={styles.contentContainer}>
              <SafeAreaView style={styles.body} edges={['bottom']}>
                <ScrollView 
                  contentContainerStyle={styles.scrollContent}
                  contentInsetAdjustmentBehavior="automatic"
                >
                  {currentView === 'HOME' ? (
                    <HomePage 
                      sendDataToParent={handleViewChange} 
                      bookingType={handleBookingType}
                    />
                  ) : (
                    <DetailsView 
                      sendDataToParent={handleViewChange} 
                      selected={selectedBookingType} 
                    />
                  )}
                  <Footer />
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
     height: 45, // Remove any manual padding here
  },
  contentContainer: {
    flex: 1,
    // No need for marginTop as SafeAreaView handles it
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default App;