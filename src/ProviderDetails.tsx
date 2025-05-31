/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';

// import Dialog from 'react-native-dialog';
// import MaidServiceDialog from './MaidServiceDialog';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import CookServicesDialog from './CookServiceDialog';
import axiosInstance from './axiosInstance';

const ProviderDetails = (props : any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eveningSelection, setEveningSelection] = useState<number | null>(null);
  const [morningSelection, setMorningSelection] = useState<number | null>(null);
  const [eveningSelectionTime, setEveningSelectionTime] = useState<string | null>(null);
  const [morningSelectionTime, setMorningSelectionTime] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState();
  const [open, setOpen] = useState(false);
  const [engagementData, setEngagementData] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [missingTimeSlots, setMissingTimeSlots] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [warning, setWarning] = useState('');
  const [matchedMorningSelection, setMatchedMorningSelection] = useState<string | null>(null);
  const [matchedEveningSelection, setMatchedEveningSelection] = useState<string | null>(null);
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const dispatch = useDispatch();
  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);
  const hasCheckedRef = useRef(false);

  const dietImages = {
    VEG: require('../assets/images/veg.png'),
    NONVEG: require('../assets/images/nonveg.png'),
    BOTH: require('../assets/images/nonveg.png'),
  };

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  const handleSelection = (hour: number, isEvening: boolean, time: number) => {
    const startTime = moment({ hour: time, minute: 0 }).format('HH:mm');
    const endTime = moment({ hour: time + 1, minute: 0 }).format('HH:mm');
    const formattedTime = `${startTime}-${endTime}`;

    if (isEvening) {
      setEveningSelection(hour);
      setEveningSelectionTime(formattedTime);
      setMatchedEveningSelection(formattedTime);
    //   dispatch(update({ eveningSelection: formattedTime }));
    } else {
      setMorningSelection(hour);
      setMorningSelectionTime(formattedTime);
      setMatchedMorningSelection(formattedTime);
    //   dispatch(update({ morningSelection: formattedTime }));
    }

    const payload = { timeslot: formattedTime };
    console.log('Payload being sent:', payload);
  };

  const clearSelection = (isEvening: boolean) => {
    if (isEvening) {
      setEveningSelection(null);
      setEveningSelectionTime(null);
      setMatchedEveningSelection(null);
    //   dispatch(update({ eveningSelection: null }));
    } else {
      setMorningSelection(null);
      setMorningSelectionTime(null);
      setMatchedMorningSelection(null);
    //   dispatch(update({ morningSelection: null }));
    }
  };

  const checkMissingTimeSlots = () => {
    const expectedTimeSlots = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00'
    ];
    const missing = expectedTimeSlots.filter(slot => !props.availableTimeSlots?.includes(slot));
    setMissingTimeSlots(missing);
    if (missing.length > 0) console.log('Missing time slots:', missing);
  };

  if (!hasCheckedRef.current) {
    checkMissingTimeSlots();
    hasCheckedRef.current = true;
  }

//   const toggleExpand = async () => {
//     setIsExpanded(!isExpanded);
//     if (!isExpanded) {
//       try {
//         const response = await axiosInstance.get(
//           `/api/serviceproviders/get/engagement/by/serviceProvider/${props.serviceproviderId}`
//         );
//         const engagementData = response.data.map((engagement: any) => ({
//           id: engagement.id ?? Math.random(),
//           availableTimeSlots: engagement.availableTimeSlots || [],
//         }));
//         const fullTimeSlots: string[] = Array.from({ length: 24 }, (_, i) =>
//           `${i.toString().padStart(2, '0')}:00`
//         );
//         const processedSlots = engagementData.map((entry:any) => {
//           const uniqueAvailableTimeSlots = Array.from(new Set(entry.availableTimeSlots)).sort();
//           const missingTimeSlots = fullTimeSlots.filter(slot => !uniqueAvailableTimeSlots.includes(slot));
//           return { id: entry.id, uniqueAvailableTimeSlots, missingTimeSlots };
//         });
//         const uniqueMissingSlots: string[] = Array.from(
//           new Set(processedSlots.flatMap((slot:any) => slot.missingTimeSlots))
//         ).sort() as string[];
//         setUniqueMissingSlots(uniqueMissingSlots);
//         setAvailableTimeSlots(processedSlots.map((entry: any )=> entry.uniqueAvailableTimeSlots));
//         setMissingTimeSlots(processedSlots.map((entry: any ) => ({ id: entry.id, missingSlots: entry.missingTimeSlots })));
//       }
//       //  catch (error) {
//       //   console.error('Error fetching engagement data:', error);
//       // }
//       catch (error: any) {
//   if (axios.isAxiosError(error)) {
//     console.error('Axios error:', {
//       message: error.message,
//       code: error.code,
//       status: error.response?.status,
//       data: error.response?.data,
//       config: error.config,
//     });
//   } else {
//     console.error('Unexpected error:', error);
//   }
// }
//     }
//   };

//   const calculateAge = (dob) => {
//     if (!dob) return '';
//     return moment().diff(moment(dob), 'years');
//   };

//   const handleBookNow = () => {
//     let booking: Bookingtype;
//     if (props.housekeepingRole !== 'NANNY') {
//       booking = {
//         serviceproviderId: props.serviceproviderId,
//         eveningSelection: eveningSelectionTime,
//         morningSelection: morningSelectionTime,
//         ...bookingType,
//       };
//     } else {
//       booking = {
//         serviceproviderId: props.serviceproviderId,
//         timeRange: `${startTime} - ${endTime}`,
//         duration: getHoursDifference(startTime, endTime),
//         ...bookingType,
//       };
//     }
//     bookingType ? dispatch(update(booking)) : dispatch(add(booking));
//     props.selectedProvider({ ...props, selectedMorningTime: morningSelection, selectedEveningTime: eveningSelection });
//   };

//   const getHoursDifference = (start, end) => {
//     const [startHours, startMinutes] = start.split(':').map(Number);
//     const [endHours, endMinutes] = end.split(':').map(Number);
//     return (endHours * 60 + endMinutes - startHours * 60 - startMinutes) / 60;
//   };
const toggleExpand = async () => {
  setIsExpanded(!isExpanded);

  // Proceed only if expanding and serviceproviderId is valid
  if (!isExpanded) {
    if (!props.serviceproviderId) {
      console.warn("Missing serviceproviderId. Cannot fetch engagement data.");
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/api/serviceproviders/get/engagement/by/serviceProvider/${props.serviceproviderId}`
      );

      const engagementData = response.data.map((engagement: any) => ({
        id: engagement.id ?? Math.random(),
        availableTimeSlots: engagement.availableTimeSlots || [],
      }));

      const fullTimeSlots: string[] = Array.from({ length: 24 }, (_, i) =>
        `${i.toString().padStart(2, '0')}:00`
      );

      const processedSlots = engagementData.map((entry: any) => {
        const uniqueAvailableTimeSlots = Array.from(new Set(entry.availableTimeSlots)).sort();
        const missingTimeSlots = fullTimeSlots.filter(
          slot => !uniqueAvailableTimeSlots.includes(slot)
        );
        return { id: entry.id, uniqueAvailableTimeSlots, missingTimeSlots };
      });

      // const uniqueMissingSlots: string[] = Array.from(
      //   new Set(processedSlots.flatMap((slot: any) => slot.missingTimeSlots))
      // ).sort();
console.log("Service Provider ID:", props.serviceproviderId);

      setUniqueMissingSlots(uniqueMissingSlots);
      setAvailableTimeSlots(processedSlots.map((entry: any) => entry.uniqueAvailableTimeSlots));
      setMissingTimeSlots(
        processedSlots.map((entry: any) => ({ id: entry.id, missingSlots: entry.missingTimeSlots }))
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
        });
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }
};

  const handleLogin = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const isBookNowEnabled =
    morningSelection !== null || eveningSelection !== null ||
    matchedMorningSelection !== null || matchedEveningSelection !== null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <Icon name={isExpanded ? 'remove' : 'add'} size={24} color="#1976d2" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} style={styles.bookButton}>
          <Text style={{ color: '#1976d2' }}>Book Now</Text>
        </TouchableOpacity>

        {/* <Text style={styles.name}>
          {props.firstName} {props.middleName} {props.lastName} (
          {props.gender?.charAt(0)} {calculateAge(props.dob)})
        </Text> */}

        {/* <Image source={dietImages[props.diet]} style={styles.dietIcon} /> */}

        {isExpanded && (
          <>
            <Text style={styles.details}>Language: {props.language || 'English'}</Text>
            <Text style={styles.details}>
              Experience: {props.experience || '1 year'}, Other Services: {props.otherServices || 'N/A'}
            </Text>
            {warning ? <Text style={{ color: 'red' }}>{warning}</Text> : null}
          </>
        )}
      </View>
      {props.housekeepingRole === 'COOK' && (
        <CookServicesDialog open={open} handleClose={handleClose} visible={false} onClose={function (): void {
          throw new Error('Function not implemented.');
        } } />
      )}

      {/* <MaidServiceDialog visible={open} onClose={handleClose} /> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  card: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  details: { fontSize: 16, marginVertical: 4 },
  expandButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  bookButton: {
    position: 'absolute',
    top: 10,
    right: 70,
    borderColor: '#1976d2',
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
  },
  dietIcon: { width: 20, height: 20, marginLeft: 8 },
});

export default ProviderDetails;
