import React, { useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import axiosInstance from './axiosInstance';

interface ServiceProvider {
  id: number;
  name: string;
  role: string;
  distance: number;
  firstName:string;
  lastName:string;
}

const ServiceProviderSearch = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const params = {
    startDate: '2025-04-01',
    endDate: '2025-04-30',
    timeslot: '06:00-20:00',
    housekeepingRole: 'COOK',
    latitude: 22.94739666666667,
    longitude: 88.65848666666668,
  };

  const handleSearch = async () => {
  try {
    setLoading(true);
    const response = await axios.get(
      'http://3.109.59.100:8080/api/serviceproviders/search',
     { params}
    );
    setData(response.data); // Adjust if API response has a nested structure
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    Alert.alert('Error', 'Something went wrong while fetching data.');
  } finally {
    setLoading(false);
  }
};


  const renderItem = ({ item }: { item: ServiceProvider }) => (
  <View style={styles.itemContainer}>
    <Text style={styles.name}>{item.name}</Text>
    {/* <Text>{item.role}</Text> */}
    {/* <Text>{item.distance} km away</Text> */}
    <Text>{item.firstName} </Text>
    <Text>{item.lastName} </Text>
  </View>
);

  return (
    <View style={styles.container}>
      <Button title="Search" onPress={handleSearch} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? <Text>No results found.</Text> : null}
        style={styles.list}
      />
    </View>
  );
};

export default ServiceProviderSearch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginVertical: 20,
  },
  list: {
    marginTop: 10,
  },
  itemContainer: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
