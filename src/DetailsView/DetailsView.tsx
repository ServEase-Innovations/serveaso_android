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
import axiosInstance from '../services/axiosInstance';
import ProviderDetails from './ProviderDetails';
import { add } from '../features/detailsDataSlice';
import { CONFIRMATION } from '../Constants/pagesConstants';
import { usePricingFilterService } from '../utils/PricingFilter';

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

  // Updated useEffect to include location dependency like React version
  useEffect(() => {
    performSearch();
  }, [selectedProviderType, location]); // Added location dependency

  // Added useEffect to handle selected prop changes like React version
  useEffect(() => {
    console.log('Selected ...', selected);
    setSelectedProviderType(selected || '');

    const fetchData = async () => {
      try {
        setLoading(true);
        let response;
        if (selected) {
          response = await axiosInstance.get(
            'api/serviceproviders/role?role=' + selected.toUpperCase()
          );
        } else {
          response = await axiosInstance.get(
            'api/serviceproviders/serviceproviders/all'
          );
        }
        setServiceProvidersData(response?.data);
        dispatch(add(response?.data));
      } catch (err) {
        console.error('There was a problem with the fetch operation:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we have a selected provider type
    if (selected) {
      fetchData();
    }
  }, [selected]);

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

      console.log('Booking Type in performSearch:', bookingType);
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

      // Updated date formatting to match React version
      const formatDateOnly = (dateString?: string) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
      };

      // Updated to use bookingType structure from React version
      const startDate = formatDateOnly(bookingType?.startDate) || '2025-04-01';
      const endDate = formatDateOnly(bookingType?.endDate) || '2025-04-30';
      const timeslot = bookingType?.timeRange || '16:37-16:37';
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      const queryParams = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
        timeslot: timeslot,
        housekeepingRole: housekeepingRole,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

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
    console.log('📊 Service provider data length:', serviceProviderData?.length || 0);
    console.log('⏳ Loading state:', loading);

    if (Array.isArray(serviceProviderData) && serviceProviderData.length > 0) {
      console.log('✅ Rendering providers list');
      return serviceProviderData.map((provider, index) => (
        <View key={index} style={styles.providerContainer}>
          <ProviderDetails 
            {...provider} 
            onCheckout={handleCheckoutData}
            onSelectProvider={handleSelectedProvider}
          />
        </View>
      ));
    } else if (loading) {
      console.log('🔄 Rendering loading state');
      return (
        <View style={styles.centeredContainer}>
          <Image 
            source={require('../../assets/images/search.gif')} 
            style={styles.loadingImage}
          />
          <Text style={styles.loadingText}>Searching providers near you...</Text>
        </View>
      );
    } else {
      console.log('❌ Rendering no data state');
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.noDataTitle}>Service Not Available in Your Area</Text>
          <Text style={styles.noDataText}>
            Currently, we are unable to provide services in your location. 
            We hope to be available in your area soon.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => sendDataToParent('')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  providerContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  loadingImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007bff',
    borderRadius: 8,
    minWidth: 120,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
});

export default DetailsView;