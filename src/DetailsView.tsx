import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import axiosInstance from './axiosInstance';
import ProviderDetails from './ProviderDetails';
// import HeaderSearch from '../HeaderSearch/HeaderSearch';
// import PreferenceSelection from '../PreferenceSelection/PreferenceSelection';
import { add } from './features/detailsDataSlice';
import { CONFIRMATION } from './Constants/pagesConstants';
import { usePricingFilterService } from './utils/PricingFilter';

interface DetailsViewProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  const [serviceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState('');
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<any>([]);
  
  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  const dispatch = useDispatch();

  const location = useSelector((state: any) => {
    console.log('🌍 Retrieving geolocation from Redux state:', state);
    return state?.geoLocation?.value;
  });

  const handleCheckoutData = (data: any) => {
    console.log('Received checkout data:', data);

    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  useEffect(() => {
    performSearch();
  }, [selectedProviderType]);

  const handleBackClick = () => {
    sendDataToParent('');
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const handleSearchResults = (data: any[]) => {
    setSearchResults(data);
    toggleDrawer(false);
  };

  const handleSelectedProvider = (provider: any) => {
    if (selectedProvider) {
      selectedProvider(provider);
    }
    sendDataToParent(CONFIRMATION);
  };

  const handleSearch = (formData: { serviceType: string; startTime: string; endTime: string }) => {
    console.log('Search data received in MainComponent:', formData);
    setSearchData(formData);
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      console.log('Booking Type in performSearch:', location);
      console.log('Location object:', location?.geometry?.location);

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location?.geometry?.location?.lat;
        longitude = location?.geometry?.location?.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location?.lat;
        longitude = location?.lng;
      }

      const formatDateOnly = (dateString?: string) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
      };

      // const startDate = formatDateOnly(bookingType?.start_Date) || '2025-04-01';
      // const endDate = formatDateOnly(bookingType?.end_Date) || '2025-04-30';
      // const timeslot = bookingType?.timeRange || '16:37-16:37';
      // const housekeepingRole = bookingType?.housekeepingRole || 'COOK';
  const startDate = bookingType?.start_date || "";
      const endDate = bookingType?.end_date || "";
      const timeslot = bookingType?.timeRange ;
      const housekeepingRole = bookingType?.housekeepingRole || selected?.toUpperCase() || "COOK";

      const queryParams = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
        timeslot: timeslot,
        housekeepingRole: housekeepingRole,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

      // Console queryParams in detail
      console.log('🔍 QUERY PARAMS DETAILS:');
      console.log('📅 Start Date:', startDate);
      console.log('📅 End Date:', endDate);
      console.log('⏰ Timeslot:', timeslot);
      console.log('👤 Housekeeping Role:', housekeepingRole);
      console.log('📍 Latitude:', latitude.toString());
      console.log('📍 Longitude:', longitude.toString());
      console.log('🌐 Full Query String:', queryParams.toString());

      const response = await axiosInstance.get(
        `/api/serviceproviders/search?${queryParams.toString()}`
      );

      console.log('✅ API Response:', response.data);
      console.log('📊 Number of providers found:', response.data.length);

      if (response.data.length === 0) {
        setServiceProviderData([]);
        console.log('❌ No providers found with current filters');
      } else {
        setServiceProviderData(response.data);
        console.log('🎉 Providers successfully loaded');
      }
    } catch (error: any) {
      console.error('❌ Geolocation or API error:', error.message || error);
      console.log('💡 Error details:', error.response?.data || error);
      setServiceProviderData([]);
    } finally {
      setLoading(false);
      console.log('🏁 Search completed, loading:', loading);
    }
  };

  console.log('📦 Service Providers Data:', serviceProviderData);
  console.log('🔄 Current loading state:', loading);
  console.log('🎯 Selected provider type:', selectedProviderType);

  const renderContent = () => {
    console.log('🎨 Rendering content...');
    console.log('📊 Service provider data length:', serviceProviderData.length);
    console.log('⏳ Loading state:', loading);

    if (Array.isArray(serviceProviderData) && serviceProviderData.length > 0) {
      console.log('✅ Rendering providers list');
      return serviceProviderData.map((provider, index) => (
        <View key={index} style={styles.providerContainer}>
          <ProviderDetails {...provider} />
        </View>
      ));
    } else if (loading) {
      console.log('🔄 Rendering loading state');
      return (
        <View style={styles.centeredContainer}>
            <Image 
              source={require('../assets/images/search.gif')} 
              style={styles.loadingImage}
            />
          <Text style={styles.loadingText}>Searching providers near you...</Text>
        </View>
      );
    } else {
      console.log('❌ Rendering no data state');
      return (
        <View style={styles.centeredContainer}>
          {/* <Image 
            source={require('../../assets/no-data.png')} 
            style={styles.noDataImage}
          /> */}
          <Text style={styles.noDataText}>No providers found near you</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  providerContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  loadingImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  noDataImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DetailsView;