import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const serviceProviders = [
  { name: 'Alice Smith', age: 28 },
  { name: 'John Doe', age: 35 },
  { name: 'Priya Patel', age: 24 },
  { name: 'Carlos Reyes', age: 31 },
];

const getRandomProvider = () => {
  const index = Math.floor(Math.random() * serviceProviders.length);
  return serviceProviders[index];
};

const BookingCard = () => {
  const provider = getRandomProvider();

  const handleBookNow = () => {
    console.log('Booked:', provider.name, provider.age);
    // Add your booking logic here
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image 
          source={require('../assets/images/nonveg.png')} 
          style={styles.foodImage}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{provider.name}</Text>
          <Text style={styles.age}>Age: {provider.age}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  foodImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingCard;
