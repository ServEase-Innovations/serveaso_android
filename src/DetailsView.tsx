import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import axios from 'axios';
import axiosInstance from './axiosInstance';
import LoadingIndicator from './LoadingIndicator';
import { CONFIRMATION } from './Constants/pagesConstants';
import { useDispatch } from 'react-redux';
import { add } from './features/detailsDataSlice';
import HeaderSearch from './HeaderSearch';
import { keys } from './env';
import Geolocation from '@react-native-community/geolocation';
import CookServicesDialog from './CookServiceDialog';

interface ServiceProvider {
  serviceproviderId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  housekeepingRole: string;
  diet: string;
  cookingSpeciality: string;
  rating: number;
  age: number;
  experience: number;
  timeslot: string;
  distance?: number;
  mobileNo: number;
  locality: string;
  currentLocation: string;
  dob: string;
  kyc: string;
}

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
  const [ServiceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProvider[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedCook, setSelectedCook] = useState<ServiceProvider | null>(null);

  const dispatch = useDispatch();


  
  const toggleCardExpansion = (providerId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  useEffect(() => {
    console.log("Selected ...", selected);
    setSelectedProviderType(selected || "");

    const fetchData = async () => {
      try {
        setLoading(true);
        let response;
        if (selected) {
          response = await axiosInstance.get(
            "api/serviceproviders/role?role=" + selected.toUpperCase()
          );
        } else {
          response = await axiosInstance.get(
            "api/serviceproviders/serviceproviders/all"
          );
        }
        setServiceProvidersData(response?.data);
        dispatch(add(response?.data));
      } catch (err) {
        console.error("There was a problem with the fetch operation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selected]);

  // const handleSelectedProvider = (provider: any) => {
  //   if (selectedProvider) {
  //     selectedProvider(provider);
  //   }
  //   sendDataToParent(CONFIRMATION);
  // };
  const handleSelectedProvider = (provider: any) => {
  if (provider.housekeepingRole === 'COOK') {
    setSelectedCook(provider);
    setDialogOpen(true);
  } else {
    if (selectedProvider) {
      selectedProvider(provider);
    }
    sendDataToParent(CONFIRMATION);
  }
};

  const handleSearch = () => {
    performSearch();
  };

  const performSearch = async () => {
    try {
      setSearchLoading(true);
      const params = {
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        timeslot: '06:00-20:00',
        housekeepingRole: 'COOK',
        latitude: 22.94739666666667,
        longitude: 88.65848666666668,
      };
  
      const response = await axios.get(
        'http://3.109.59.100:8080/api/serviceproviders/search',
        { params }
      );
      console.log('Response:', response.data);
      setServiceProviderData(response.data);
      // Initialize all cards as collapsed by default
      const initialExpandedState = response.data.reduce((acc: Record<number, boolean>, provider: ServiceProvider) => {
        acc[provider.serviceproviderId] = false;
        return acc;
      }, {});
      setExpandedCards(initialExpandedState);
    } catch (error: any) {
      console.error('API Error:', error?.response?.data || error.message);
      Alert.alert('Error', 'Something went wrong while fetching data.');
    } finally {
      setSearchLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ServiceProvider }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        
        <View style={styles.headerContent}>
          <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.roleText}>{item.housekeepingRole}</Text>
           <Text style={styles.detailLabel}>Experience:{item.experience} year(s)</Text>
        </View>
        {/* <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating || 'New'}</Text>
        </View> */}
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleCardExpansion(item.serviceproviderId)}
        >
          <Text style={styles.expandButtonText}>
            {expandedCards[item.serviceproviderId] ? '-' : '+'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {expandedCards[item.serviceproviderId] && (
        <View style={styles.cardBody}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>{item.age}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>{item.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>KYC:</Text>
              <Text style={styles.detailValue}>{item.kyc}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Diet Speciality:</Text>
              <Text style={styles.detailValue}>{item.diet}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cooking Speciality:</Text>
              <Text style={styles.detailValue}>{item.cookingSpeciality}</Text>
            </View>
           
            {item.distance && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance:</Text>
                <Text style={styles.detailValue}>{item.distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => handleSelectedProvider(item)}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.search}>
        <HeaderSearch onSearch={handleSearch} />
      </View>
      
      {searchLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={serviceProviderData}
          keyExtractor={(item) => item.serviceproviderId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            !searchLoading ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No service providers found. Try a search to find available providers.</Text>
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={handleSearch}
                >
                  <Text style={styles.searchButtonText}>Search Providers</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

       <CookServicesDialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        // providerDetails={selectedCook}
        sendDataToParent={sendDataToParent} open={false} handleClose={function (): void {
          throw new Error('Function not implemented.');
        } }    />
    </View>  
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  search: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  expandButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // ratingContainer: {
  //   backgroundColor: '#f8f8f8',
  //   padding: 6,
  //   borderRadius: 12,
  //   minWidth: 60,
  //   alignItems: 'center',
  // },
  // rating: {
  //   fontSize: 14,
  //   color: '#ffb400',
  //   fontWeight: 'bold',
  // },
  cardBody: {
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DetailsView;