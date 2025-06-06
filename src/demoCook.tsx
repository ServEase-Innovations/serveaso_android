import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';

const packages = [
  {
    name: 'Breakfast',
    price: 2000,
    rating: 4.8,
    reviews: '2.9M reviews',
    prepTime: '30 mins preparation',
    includes: ['5-8 chapatis/parathas', '1 dry veg/non-veg item'],
  },
  {
    name: 'Lunch',
    price: 3500,
    rating: 4.84,
    reviews: '1.7M reviews',
    prepTime: '45 mins preparation',
    includes: [
      '5-8 chapatis/parathas',
      '1 dry veg/non-veg item',
      '1 gravy veg/non-veg item',
      'Rice',
    ],
  },
  {
    name: 'Dinner',
    price: 3500,
    rating: 4.84,
    reviews: '2.7M reviews',
    prepTime: '1.5 hrs preparation',
    includes: [
      '5-8 chapatis/parathas',
      '1 dry veg/non-veg item',
      '1 gravy veg/non-veg item',
      'Rice',
    ],
  },
];

const calculatePriceForPersons = (basePrice: number, persons: number): number => {
  if (persons <= 3) return basePrice;
  if (persons <= 6) return basePrice + basePrice * 0.2 * (persons - 3);
  if (persons <= 9) {
    const base = basePrice + basePrice * 0.2 * 3;
    return base + base * 0.1 * (persons - 6);
  }
  const base = basePrice + basePrice * 0.2 * 3;
  const extraBase = base + base * 0.1 * 3;
  return extraBase + extraBase * 0.05 * (persons - 9);
};

const DemoCook = ({
  visible,
  onClose,
  sendDataToParent,
  user,
  providerDetails,
  bookingType,
}: any) => {
  const [persons, setPersons] = useState(packages.map(() => 1));
  const [voucher, setVoucher] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<boolean[]>(
    packages.map(() => false)
  );

  const handleSelectPackage = (index: number) => {
    const updated = [...selectedPackages];
    updated[index] = !updated[index];
    setSelectedPackages(updated);
  };

  const getTotal = () => {
    return packages.reduce((sum, pkg, idx) => {
      if (!selectedPackages[idx]) return sum;
      return sum + calculatePriceForPersons(pkg.price, persons[idx]);
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      const selected = packages
        .map((pkg, i) => ({
          mealType: pkg.name.toUpperCase(),
          persons: persons[i],
          price: calculatePriceForPersons(pkg.price, persons[i]),
          selected: selectedPackages[i],
        }))
        .filter((pkg) => pkg.selected);

      if (selected.length === 0) {
        Alert.alert('Select at least one package');
        return;
      }

      const totalAmount = selected.reduce((sum, p) => sum + p.price, 0);
      const response = await axios.post(
        'http://13.201.229.41:3000/create-order',
        { amount: totalAmount * 100 },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 && response.data.success) {
        const orderId = response.data.orderId;
        const options = {
          description: 'Meal Package Booking',
          image: 'https://your-logo-url.png',
          currency: 'INR',
          key: 'RAZORPAY_KEY', // Replace with real key
          amount: totalAmount * 100,
          name: 'YourAppName',
          order_id: orderId,
          prefill: {
            name: `${user?.customerDetails?.firstName} ${user?.customerDetails?.lastName}`,
            contact: user?.customerDetails?.phone,
            email: user?.customerDetails?.email,
          },
          theme: { color: '#F37254' },
        };

        RazorpayCheckout.open(options)
          .then(() => {
            const bookingDetails = {
              serviceProviderId: Number(providerDetails?.serviceproviderId),
              serviceProviderName: `${providerDetails?.firstName} ${providerDetails?.lastName}`,
              customerId: user?.customerDetails?.customerId,
              customerName: `${user?.customerDetails?.firstName} ${user?.customerDetails?.lastName}`,
              address: user?.customerDetails?.currentLocation,
              startDate:
                bookingType?.startDate || new Date().toISOString().split('T')[0],
              endDate: bookingType?.endDate || '',
              engagements: selected
                .map((s) => `${s.mealType} for ${s.persons} persons`)
                .join(', '),
              timeslot: bookingType?.timeRange || '',
              monthlyAmount: totalAmount,
              paymentMode: 'UPI',
              bookingType: 'MEAL_PACKAGE',
              taskStatus: 'NOT_STARTED',
              responsibilities: [],
            };

            // You can now send bookingDetails to backend
            sendDataToParent(bookingDetails);
            onClose();
          })
          .catch(() => {
            Alert.alert('Payment Cancelled');
          });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Payment failed, try again later.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.dialogBox}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>MEAL PACKAGES</Text>
            {packages.map((pkg, index) => (
              <View key={index} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageTitle}>{pkg.name}</Text>
                  <Text style={styles.price}>₹{pkg.price}</Text>
                </View>
                <Text style={styles.rating}>
                  {pkg.rating} ({pkg.reviews}) - {pkg.prepTime}
                </Text>
                <View style={styles.personRow}>
                  <Text>Person:</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => {
                      if (persons[index] > 1) {
                        const updated = [...persons];
                        updated[index] -= 1;
                        setPersons(updated);
                      }
                    }}>
                    <Text style={styles.counterSymbol}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.personCount}>{persons[index]}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => {
                      const updated = [...persons];
                      updated[index] += 1;
                      setPersons(updated);
                    }}>
                    <Text style={styles.counterSymbol}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.includes}>
                  {pkg.includes.map((item, i) => (
                    <Text key={i}>- Includes preparing of {item}</Text>
                  ))}
                  <Text>- *Sunday leave</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    selectedPackages[index] && styles.selectedButton,
                  ]}
                  onPress={() => handleSelectPackage(index)}>
                  <Text
                    style={[
                      styles.selectButtonText,
                      selectedPackages[index] && styles.selectedButtonText,
                    ]}>
                    {selectedPackages[index] ? 'SELECTED' : 'SELECT PACKAGE'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.voucherSection}>
              <TextInput
                placeholder="Enter voucher code"
                value={voucher}
                onChangeText={setVoucher}
                style={styles.voucherInput}
              />
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>
                Total for {selectedPackages.reduce((sum, s, i) => (s ? sum + persons[i] : sum), 0)} person(s):
              </Text>
              <Text style={styles.totalPrice}>₹{getTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleCheckout}>
              <Text style={styles.continueButtonText}>CONFIRM BOOKING</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  dialogBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: height * 0.85,
  },
  container: { padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  packageCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  packageTitle: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold', color: 'red' },
  rating: { marginVertical: 8, fontSize: 12, color: '#666' },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  counterButton: {
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  counterSymbol: { fontSize: 16 },
  personCount: { marginHorizontal: 8, fontSize: 16 },
  includes: { marginVertical: 8 },
  selectButton: {
    borderWidth: 1,
    borderColor: '#0099cc',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  selectedButton: {
    backgroundColor: '#0099cc',
  },
  selectButtonText: {
    color: '#0099cc',
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#fff',
  },
  voucherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  voucherInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#009944',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalText: { fontWeight: 'bold' },
  totalPrice: { fontWeight: 'bold', fontSize: 16 },
  continueButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
});

export default DemoCook;
