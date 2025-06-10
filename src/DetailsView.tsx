/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import axiosInstance from "./axiosInstance";
import LoadingIndicator from "./LoadingIndicator";
import { CONFIRMATION } from "./Constants/pagesConstants";
import ProviderDetails from "./ProviderDetails";
import { useDispatch } from "react-redux";
import { add } from "./features/detailsDataSlice";
import HeaderSearch from "./HeaderSearch";
import PreferenceSelection from "./PreferenceSelection";
import axios from "axios";
import { keys } from "./env";
import Geolocation from '@react-native-community/geolocation';

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<any>();

  const dispatch = useDispatch();

  const handleCheckoutData = (data: any) => {
    console.log("Received checkout data:", data);

    if (checkoutItem) {
      checkoutItem(data);
    }
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
        Alert.alert("Error", "There was a problem fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selected]);

  const handleBackClick = () => {
    sendDataToParent("");
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
    console.log("Search data received in MainComponent:", formData);
    setSearchData(formData);
    performSearch(formData);
  };

  const performSearch = async (formData: any) => {
    const timeSlotFormatted = `${formData.startTime}-${formData.endTime}`;
    const housekeepingRole = selected?.toUpperCase() || "";
  
    const getCoordinates = (): Promise<{ latitude: number; longitude: number }> =>
      new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    
    try {
      const { latitude, longitude } = await getCoordinates();
      console.log("Latitude:", latitude, "Longitude:", longitude);

      const params = {
        startDate: "2025-04-01",
        endDate: "2025-04-30",
        timeslot: timeSlotFormatted,
        housekeepingRole,
        latitude,
        longitude,
      };

      const response = await axiosInstance.get('/api/serviceproviders/search', { params });
      console.log('Response:', response.data);
      setServiceProviderData(response.data);
    } catch (error: any) {
      console.error('Geolocation or API error:', error.message || error);
      Alert.alert("Error", "Failed to get location or fetch service providers");
    }
  };

  console.log("Service Providers Data:", ServiceProvidersData);
  console.log("Service Providers Data:", serviceProviderData);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <HeaderSearch onSearch={handleSearch}/>
        {/* <PreferenceSelection /> */}
      </View>
      
      {loading ? (
        <LoadingIndicator />
      ) : Array.isArray(serviceProviderData) && serviceProviderData.length > 0 ? (
        <ScrollView>
          {serviceProviderData.map((provider, index) => (
            <ProviderDetails key={index} {...provider} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No Data</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    marginBottom: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
  },
});

export default DetailsView;