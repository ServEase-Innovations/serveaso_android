import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from '@react-native-community/geolocation';
import axiosInstance from "./axiosInstance";
import ProviderDetails from "./ProviderDetails";
import { useDispatch } from "react-redux";
import { add } from "./features/detailsDataSlice";

interface DetailsProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const NewDetails: React.FC<DetailsProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  const [ServiceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<any>();
  const [locationError, setLocationError] = useState<string | null>(null);

  const dispatch = useDispatch();

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
          setLocationError(error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const performSearch = async () => {
    const housekeepingRole = selected?.toUpperCase() || "cook";

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError("Location permission denied");
        return;
      }

      const { latitude, longitude } = await getCurrentLocation();
      console.log("Latitude:", latitude, "Longitude:", longitude);

      const response = await axiosInstance.get(
        "/api/serviceproviders/search?startDate=2025-04-01&endDate=2025-04-30&timeslot=16:37-16:37&housekeepingRole=COOK&latitude=22.94739666666667&longitude=88.65848666666668"
      );
      
      console.log("Response:", response.data);
      if (response.data.length === 0) {
        setLoading(true);
      } else {
        setLoading(false);
        setServiceProviderData(response.data);
      }
    } catch (error: any) {
      console.error('Error:', error.message || error);
      setLocationError(error.message || "Failed to get location");
    }
  };

  useEffect(() => {
    performSearch();
  }, []);

  return (
    <View style={styles.mainContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : locationError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      ) : Array.isArray(serviceProviderData) && serviceProviderData.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {serviceProviderData.map((provider, index) => (
            <View key={index} style={styles.providerContainer}>
              <ProviderDetails {...provider} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Image
            source={require("../assets/images/search.gif")}
            style={styles.noDataImage}
          />
          <Text style={styles.noDataText}>Search providers near you</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  providerContainer: {
    paddingTop: 10,
    marginBottom: 10,
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataImage: {
    width: 100,
    height: 100,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default NewDetails;