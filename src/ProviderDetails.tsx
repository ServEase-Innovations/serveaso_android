/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ScrollView,
  Alert
} from "react-native";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { add, update } from "./features/bookingTypeSlice";
import axiosInstance from "./axiosInstance";
import { Bookingtype } from "./types/bookingTypeData";
import { EnhancedProviderDetails } from "./types/ProviderDetailsType";
import MaidServiceDialog from "./MaidServiceDialog";
import CookServicesDialog from "./CookServiceDialog";
import CookServiceDialog from "./CookServiceDialog";
import NannyServiceDialog from "./NannyServiceDialog";

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
  const [loggedInUser, setLoggedInUser] = useState();
  const [open, setOpen] = useState(false);
  const [engagementData, setEngagementData] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [missingTimeSlots, setMissingTimeSlots] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [warning, setWarning] = useState("");
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
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

  const checkMissingTimeSlots = () => {
    const expectedTimeSlots = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];

    const missing = expectedTimeSlots.filter(slot => !props.availableTimeSlots?.includes(slot));
    setMissingSlots(missing);
  };

  const toggleExpand = async () => {
    setIsExpanded(!isExpanded);

    if (!isExpanded) {
      try {
        if (props.serviceproviderId === bookingType?.serviceproviderId) {
          setMatchedMorningSelection(bookingType?.morningSelection || null);
          setMatchedEveningSelection(bookingType?.eveningSelection || null);
        } else {
          setMatchedMorningSelection(null);
          setMatchedEveningSelection(null);
        }

        const response = await axiosInstance.get(
          `/api/serviceproviders/get/engagement/by/serviceProvider/${props.serviceproviderId}`
        );

        const engagementData = response.data.map((engagement: { id?: number; availableTimeSlots?: string[] }) => ({
          id: engagement.id ?? Math.random(),
          availableTimeSlots: engagement.availableTimeSlots || [],
        }));

        const fullTimeSlots: string[] = Array.from({ length: 24 }, (_, i) =>
          `${i.toString().padStart(2, "0")}:00`
        );

        const processedSlots = engagementData.map((entry: any) => {
          const uniqueAvailableTimeSlots = Array.from(new Set(entry.availableTimeSlots)).sort();
          const missingTimeSlots = fullTimeSlots.filter(slot => !uniqueAvailableTimeSlots.includes(slot));

          return {
            id: entry.id,
            uniqueAvailableTimeSlots,
            missingTimeSlots,
          };
        });

        const uniqueMissingSlots: string[] = Array.from(
          new Set(processedSlots.flatMap((slot: any) => slot.missingTimeSlots))
        ).sort() as string[];

        setUniqueMissingSlots(uniqueMissingSlots);
        setAvailableTimeSlots(processedSlots.map((entry: any) => entry.uniqueAvailableTimeSlots));
      } catch (error) {
        console.error("Error fetching engagement data:", error);
      }
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    return moment().diff(moment(dob), "years");
  };

  const handleBookNow = () => {
    let booking: Bookingtype;

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
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBookingPage = (e: string | undefined) => {
    setOpen(false);
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    validateTimeRange(newStartTime, endTime);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    validateTimeRange(startTime, newEndTime);
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
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  if (!hasCheckedRef.current) {
    checkMissingTimeSlots();
    hasCheckedRef.current = true;
  }

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

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpand}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? "-" : "+"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={handleLogin}
          >
            <Text style={styles.bookNowButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>

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
            <View style={styles.expandedContent}>
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

      {/* Dialogs would be implemented as Modals in React Native */}
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {props.housekeepingRole === "COOK" && (
              <CookServiceDialog 
                open={open}
                handleClose={handleClose}
                providerDetails={providerDetailsData} visible={false} onClose={function (): void {
                  throw new Error("Function not implemented.");
                } }              />
            )}
            
            {props.housekeepingRole === "MAID" && (
              <MaidServiceDialog 
                // open={open} 
                // handleClose={handleClose} 
                providerDetails={providerDetailsData} visible={false} onClose={function (): void {
                  throw new Error("Function not implemented.");
                } }              />
            )}
            
            {props.housekeepingRole === "NANNY" && (
              <NannyServiceDialog 
                // open={open} 
                // handleClose={handleClose} 
                providerDetails={providerDetailsData} visible={false} onClose={function (): void {
                  throw new Error("Function not implemented.");
                } }              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  expandButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  expandButtonText: {
    color: '#1976d2',
    fontSize: 16,
  },
  bookNowButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 4,
    padding: 8,
  },
  bookNowButtonText: {
    color: '#1976d2',
    fontSize: 14,
  },
  content: {
    marginTop: 10,
  },
  essentials: {
    marginBottom: 8,
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
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
  expandedContent: {
    marginTop: 8,
  },
  detailText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: 'red',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
  },
});

export default ProviderDetails;