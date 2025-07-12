import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Head sendDataToParent={handleDataFromChild} />
          </View>

          {/* Main Content */}
          <SafeAreaView style={styles.body} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {currentView === 'HOME' ? (
                <HomePage 
                  sendDataToParent={handleViewChange} 
                  bookingType={handleBookingType}
                  // chatbotOpen={chatbotOpen}
                  // setChatbotOpen={setChatbotOpen}
                />
              ) : (
                <DetailsView 
                  sendDataToParent={handleViewChange} 
                  selected={selectedBookingType} 
                />
              )}
            </ScrollView>
          </SafeAreaView>

          {/* Footer */}
          <View style={styles.footer}>
            <Footer />
          </View>

          {/* Chatbot - Rendered outside the scroll view */}
          <Chatbot 
            open={chatbotOpen} 
            onClose={() => setChatbotOpen(false)}
          />
        </View>
      </SafeAreaProvider>
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative', // Needed for absolute positioning of Chatbot
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    width: '100%',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
});

export default App;