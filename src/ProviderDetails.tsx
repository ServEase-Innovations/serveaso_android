/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert
} from "react-native";
import moment from "moment";
import AddIcon from 'react-native-vector-icons/MaterialIcons';
import RemoveIcon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from "react-redux";
import { add, update } from "./features/bookingTypeSlice";
import DemoCook from "./demoCook";

// Types
interface BookingType {
  serviceproviderId: string;
  eveningSelection: string | null;
  morningSelection: string | null;
  timeRange?: string;
  duration?: number;
}

interface EnhancedProviderDetails {
  serviceproviderId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dob: string;
  diet: string;
  housekeepingRole: string;
  selectedMorningTime: number | null;
  selectedEveningTime: number | null;
  matchedMorningSelection: string | null;
  matchedEveningSelection: string | null;
  startTime: string;
  endTime: string;
  language?: string;
  experience?: string;
  otherServices?: string;
  availableTimeSlots?: string[];
}

interface ProviderDetailsProps {
  housekeepingRole: string;
  selectedProvider: (provider: any) => void;
  serviceproviderId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dob: string;
  diet: string;
  language?: string;
  experience?: string;
  otherServices?: string;
  availableTimeSlots?: string[];
}

const ProviderDetails: React.FC<ProviderDetailsProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eveningSelection, setEveningSelection] = useState<number | null>(null);
  const [morningSelection, setMorningSelection] = useState<number | null>(null);
  const [eveningSelectionTime, setEveningSelectionTime] = useState<string | null>(null);
  const [morningSelectionTime, setMorningSelectionTime] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [warning, setWarning] = useState("");
  const [matchedMorningSelection, setMatchedMorningSelection] = useState<string | null>(null);
  const [matchedEveningSelection, setMatchedEveningSelection] = useState<string | null>(null);

  const hasCheckedRef = useRef(false);

  const dietImages = {
    VEG: require("../assets/images/veg.png"),
    NONVEG: require("../assets/images/nonveg.png"),
    BOTH: require("../assets/images/nonveg.png"),
  };

  const dispatch = useDispatch();
  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);

  // Handle selection for morning or evening availability
  const handleSelection = (hour: number, isEvening: boolean, time: number) => {
    const startTime = moment({ hour: time, minute: 0 }).format("HH:mm");
    const endTime = moment({ hour: time + 1, minute: 0 }).format("HH:mm");
    const formattedTime = `${startTime}-${endTime}`;

    if (isEvening) {
      setEveningSelection(hour);
      setEveningSelectionTime(formattedTime);
      setMatchedEveningSelection(formattedTime);
      dispatch(update({ eveningSelection: formattedTime }));
    } else {
      setMorningSelection(hour);
      setMorningSelectionTime(formattedTime);
      setMatchedMorningSelection(formattedTime);
      dispatch(update({ morningSelection: formattedTime }));
    }
  };

  const clearSelection = (isEvening: boolean) => {
    if (isEvening) {
      setEveningSelection(null);
      setEveningSelectionTime(null);
      setMatchedEveningSelection(null);
      dispatch(update({ eveningSelection: null }));
    } else {
      setMorningSelection(null);
      setMorningSelectionTime(null);
      setMatchedMorningSelection(null);
      dispatch(update({ morningSelection: null }));
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    if (!isExpanded && props.serviceproviderId === bookingType?.serviceproviderId) {
      setMatchedMorningSelection(bookingType?.morningSelection || null);
      setMatchedEveningSelection(bookingType?.eveningSelection || null);
    } else {
      setMatchedMorningSelection(null);
      setMatchedEveningSelection(null);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    return moment().diff(moment(dob), "years");
  };

  const handleBookNow = () => {
    let booking: BookingType;

    if (props.housekeepingRole !== "NANNY") {
      booking = {
        serviceproviderId: props.serviceproviderId,
        eveningSelection: eveningSelectionTime,
        morningSelection: morningSelectionTime,
        ...bookingType
      };
    } else {
      booking = {
        serviceproviderId: props.serviceproviderId,
        timeRange: `${startTime} - ${endTime}`,
        duration: getHoursDifference(startTime, endTime),
        ...bookingType
      };
    }

    if (bookingType) {
      dispatch(update(booking));
    } else {
      dispatch(add(booking));
    }

    const providerDetails = {
      ...props,
      selectedMorningTime: morningSelection,
      selectedEveningTime: eveningSelection
    };
    props.selectedProvider(providerDetails);
  };

  const getHoursDifference = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const handleLogin = () => {
    setOpen(true); // Directly open the dialog
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBookingPage = (e: string | undefined) => {
    setOpen(false);
  };

  const validateTimeRange = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes - startTotalMinutes < 240) {
      setWarning("The time range must be at least 4 hours.");
    } else {
      setWarning("");
    }
  };

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
    }
  }, []);

  const dietImage = dietImages[props.diet as keyof typeof dietImages];
  const isBookNowEnabled = 
    (morningSelection !== null || eveningSelection !== null) || 
    (matchedMorningSelection !== null || matchedEveningSelection !== null);

  const providerDetailsData: EnhancedProviderDetails = {
    ...props,
    selectedMorningTime: morningSelection,
    selectedEveningTime: eveningSelection,
    matchedMorningSelection,
    matchedEveningSelection,
    startTime,
    endTime
  };

  const renderServiceDialog = () => {
    return (
      <DemoCook 
        visible={open}
        onClose={handleClose}
        sendDataToParent={handleBookingPage}
        user={user}
        providerDetails={providerDetailsData}
        bookingType={bookingType}
      />
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpand}
          >
            {isExpanded ? (
              <RemoveIcon name="remove" size={24} color="#1976d2" />
            ) : (
              <AddIcon name="add" size={24} color="#1976d2" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={handleLogin}
          >
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.essentials}>
              <Text style={styles.nameText}>
                {props.firstName} {props.middleName} {props.lastName}
                <Text style={styles.genderAgeText}>
                  ({props.gender === "FEMALE" ? "F " : props.gender === "MALE" ? "M " : "O"}
                  {calculateAge(props.dob)})
                </Text>
                <Image
                  source={dietImage}
                  style={styles.dietImage}
                />
              </Text>
            </View>

            {isExpanded && (
              <View>
                <Text style={styles.detailText}>
                  Language: {props.language || "English"}
                </Text>
                <Text style={styles.detailText}>
                  Experience: {props.experience || "1 year"}, 
                  Other Services: {props.otherServices || "N/A"}
                </Text>
                {warning && <Text style={styles.warningText}>{warning}</Text>}
              </View>
            )}
          </View>
        </View>
      </View>

      {renderServiceDialog()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  expandButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1,
    borderColor: '#1976d2',
    padding: 8,
    borderRadius: 4,
  },
  bookNowButton: {
    position: 'absolute',
    top: 10,
    right: 80,
    borderWidth: 1,
    borderColor: '#1976d2',
    padding: 8,
    borderRadius: 4,
  },
  bookNowText: {
    color: '#1976d2',
    fontSize: 14,
  },
  content: {
    marginTop: 20,
  },
  essentials: {
    marginBottom: 10,
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderAgeText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  dietImage: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  detailText: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warningText: {
    color: 'red',
    textAlign: 'right',
  },
});

export default ProviderDetails;