import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/Header';
import Footer from './src/Footer';
import LandingPage from './src/Landingpage';
import Login from './src/Login';
import DetailsView from './src/DetailsView';
import ServiceProviderDashboard from './src/ServiceProviderDashboard';
import Booking from './src/Bookings';
import { CONFIRMATION, DETAILS, PROFILE } from './src/Constants/pagesConstants';
import HomePage from './src/HomePage';
import Head from './src/Head';

const App = () => {
  // const [showLogin, setShowLogin] = useState(false);
  // const [selectedRole, setSelectedRole] = useState<string | null>(null);
  // const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'bookingHistory' | 'details'>('landing');
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [selection, setSelection] = useState<string | undefined>(); 
  // const [selectedBookingType, setSelectedBookingType] = useState<string | undefined>();
  
    const [currentView, setCurrentView] = useState('HOME');
  const [selectedBookingType, setSelectedBookingType] = useState('');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleBookingType = (type: string) => {
    setSelectedBookingType(type);
  };

  // const handleLoginRequest = () => {
  //   setShowLogin(true);
  // };

  // const handleCloseLogin = () => {
  //   setShowLogin(false);
  // };

  // const handleLoginSuccess = () => {
  //   setIsLoggedIn(true);
  //   setShowLogin(false);
  //   setCurrentView('landing');
  // };

  // const handleServiceProviderLogin = (role: string) => {
  //   setSelectedRole(role);
  //   setShowLogin(false);
  //   setIsLoggedIn(true);
  //   setCurrentView('dashboard');
  // };

  // const goToLandingPage = () => {
  //   setSelectedRole(null);
  //   setCurrentView('landing');
  //   setIsLoggedIn(false);
  // };

  // const handleBackToLanding = () => {
  //   setSelectedRole(null);
  //   setCurrentView('landing');
  // };

  // const handleProfileClick = () => {
  //   // Logic to handle profile click
  // };

  // const handleSignOut = () => {
  //   setIsLoggedIn(false);
  //   setCurrentView('landing');
  // };

  // const handleDashboardClick = () => {
  //   setCurrentView('dashboard');
  // };

  // const handleBookingHistoryClick = () => {
  //   setCurrentView('bookingHistory');
  // };

  // const handleDataFromChild = (page: string) => {
  //   console.log("data from child ==> ", page);
  //   setSelection(page);
  //   if (page === DETAILS) {
  //     setCurrentView('details');
  //   } else if (page === PROFILE) {
  //     setCurrentView('dashboard');
  //   }
  // };

  // const handleSelectedBookingType = (role: string) => {
  //   console.log("Selected booking type:", role);
  //   setSelectedRole(role);
  //   setSelectedBookingType(role);
  // };

  // const renderCurrentView = () => {
  //   switch (currentView) {
  //     case 'dashboard':
  //       return <ServiceProviderDashboard />;
  //     case 'bookingHistory':
  //       return <Booking goBack={() => setCurrentView('dashboard')} />;
  //     case 'details':
  //       return (
  //         <DetailsView
  //           sendDataToParent={() => {}}
  //         />
  //       );
  //     case 'landing':
  //     default:
  //       if (showLogin) {
  //         return (
  //           <Login 
  //             onClose={handleCloseLogin}
  //             onLoginSuccess={handleLoginSuccess}
  //             sendDataToParent={handleDataFromChild}
  //           />
  //         );
  //       }
  //       return (
  //         <LandingPage 
  //           sendDataToParent={handleDataFromChild} 
  //           bookingType={handleSelectedBookingType} 
  //         />
  //       );
  //   }
  // };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
      
        <View style={styles.header}>
          {/* <Header
            onLoginRequest={handleLoginRequest}
            onProfileClick={handleProfileClick}
            goToLandingPage={goToLandingPage}
            isLoggedIn={isLoggedIn}
            onSignOut={handleSignOut}
            onDashboardClick={handleDashboardClick}
            onBookingHistoryClick={handleBookingHistoryClick}
          /> */}
          <Head sendDataToParent={function (data: string): void {
          throw new Error('Function not implemented.');
        } }/>
        </View>

        {/* <View style={styles.body}>
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {renderCurrentView()}
          </SafeAreaView>
        </View>  */}
        {/* <HomePage sendDataToParent={function (data: string): void {
          throw new Error('Function not implemented.');
        } } bookingType={function (data: string): void {
          throw new Error('Function not implemented.');
        } }/> */}
         
        <SafeAreaView style={styles.body} edges={['bottom']}>
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
        </SafeAreaView>


        <View style={styles.footer}>
          <Footer />
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
//  container: {
//   flex: 1,
//   backgroundColor: '#fff',
// },
// body: {
//   flex: 1,
//   backgroundColor: '#fff',
// },

//   header: {
//     width: '100%',
//     backgroundColor: '#fff',
//     zIndex: 10,
//   },
 
//   safeArea: {
//     flex: 1,
//   },
//   footer: {
//     width: '100%',
//     backgroundColor: '#fff',
//   },
});

export default App;