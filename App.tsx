import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Header } from './src/Header';
import Footer from './src/Footer';
import LandingPage from './src/Landingpage';
import Login from './src/Login';
import DetailsView from './src/DetailsView';
import ServiceProviderDashboard from './src/ServiceProviderDashboard';
import Booking from './src/Bookings';
import { CONFIRMATION, DETAILS } from './src/Constants/pagesConstants';
import ProviderDetails from './src/ProviderDetails';
import ServiceProvidersList from './src/ServiceProvidersList';
import BookingDialog from './src/newServiceProvider';
import ServiceProviderSearch from './src/ApiSearch';


const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'bookingHistory' | 'details'>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selection, setSelection] = useState<string | undefined>(); 
  const [selectedBookingType, setSelectedBookingType] = useState<string | undefined>();
  
  const handleLoginRequest = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleLoginSuccess = (role: string) => {
    setSelectedRole(role);
    setShowLogin(false);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const goToLandingPage = () => {
    setSelectedRole(null);
    setCurrentView('landing');
    setIsLoggedIn(false);
  };

  const handleBackToLanding = () => {
    setSelectedRole(null);
    setCurrentView('landing');
  };

  const handleProfileClick = () => {
    // Logic to handle profile click
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentView('landing');
  };

  const handleDashboardClick = () => {
    setCurrentView('dashboard');
  };

  const handleBookingHistoryClick = () => {
    setCurrentView('bookingHistory');
  };

  const handleDataFromChild = (page: string) => {
    console.log("data from child ==> ", page);
    setSelection(page);
    if (page === DETAILS) {
      setCurrentView('details');
    }
  };

  const handleSelectedBookingType = (role: string) => {
    console.log("Selected booking type:", role);
    setSelectedRole(role);
    setSelectedBookingType(role);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ServiceProviderDashboard />;
      case 'bookingHistory':
        return <Booking goBack={() => setCurrentView('dashboard')} />;
      case 'details':
        return (
          <DetailsView
          sendDataToParent={() => {}}
            // role={selectedRole || ''}
            // goBack={() => setCurrentView('landing')}    
                />
        );
      case 'landing':
      default:
        if (showLogin) {
          return <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} />;
        }
        return (
          <LandingPage 
            sendDataToParent={handleDataFromChild} 
            bookingType={handleSelectedBookingType} 
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header
          onLoginRequest={handleLoginRequest}
          onProfileClick={handleProfileClick}
          goToLandingPage={goToLandingPage}
          isLoggedIn={isLoggedIn}
          onSignOut={handleSignOut}
          onDashboardClick={handleDashboardClick}
          onBookingHistoryClick={handleBookingHistoryClick}
        />
      </View>

      <View style={styles.body}>
        <SafeAreaView style={styles.safeArea}>
          {renderCurrentView()}
        </SafeAreaView>
      </View> 
     
     {/* <ServiceProviderSearch/> */}
{/* <ServiceProvidersList/> */}
{/* // <BookingDialog/> */}

      <View style={styles.footer}>
        <Footer />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  body: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  safeArea: {
    flex: 1,
  },
  footer: {
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default App;