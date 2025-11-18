import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  Dimensions,
  useWindowDimensions,
  ScrollView
} from "react-native";
import moment from "moment";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from "react-redux";
import { add, update } from "../features/bookingTypeSlice";
import DemoCook from "../ServiceDialogs/CookServiceDialog";
import MaidServiceDialog from "../ServiceDialogs/MaidServiceDialog";
import NannyServicesDialog from "../ServiceDialogs/NannyServiceDialog";
import axiosInstance from "../services/axiosInstance";
import { useAppUser } from "../context/AppUserContext";

// Types (keep your existing types)

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
  const [isFavorite, setIsFavorite] = useState(false);

  const hasCheckedRef = useRef(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isSmallScreen = windowWidth < 375;
  const isMediumScreen = windowWidth >= 375 && windowWidth < 768;
  const isLargeScreen = windowWidth >= 768;

  const dietImages = {
    VEG: require("../../assets/images/veg.png"),
    NONVEG: require("../../assets/images/nonveg.png"),
    BOTH: require("../../assets/images/nonveg.png"),
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

  // Toggle favorite status
  const toggleFavorite = (event: any) => {
    setIsFavorite(!isFavorite);
    console.log("Favorite toggled for provider:", props.serviceproviderId, "New status:", !isFavorite);
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
        Alert.alert("Error", "Failed to fetch engagement data");
      }
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    return moment().diff(moment(dob), "years");
  };

  const handleBookNow = () => {
    // Alert.alert("Booking", "Proceeding to book the service provider.");
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
        timeRange: `${startTime} `,
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

    // console.log("Props ==> , ",providerDetails)
    // props.selectedProvider(providerDetails);
    
    // CRITICAL FIX: Set open to true to show the dialog
    setOpen(true);
  };

  const getHoursDifference = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const handleClose = () => {
    console.log('Closing service dialog');
    setOpen(false);
  };

  const handleBookingPage = (data: string) => {
    console.log('Data received from dialog:', data);
    setOpen(false);
    // Handle navigation or other actions based on the data
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
  
  const { appUser } = useAppUser();

  useEffect(() => {
    if (appUser?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [appUser]);

  useEffect(() => {
    if (!hasCheckedRef.current) {
      checkMissingTimeSlots();
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

  const getGenderSymbol = (gender: string) => {
    switch (gender) {
      case 'FEMALE': return 'F';
      case 'MALE': return 'M';
      default: return 'O';
    }
  };

  const renderServiceDialog = () => {
    switch (props.housekeepingRole) {
      case "COOK":
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
      case "MAID":
        return (
          <MaidServiceDialog
            open={open}
            handleClose={handleClose}
            providerDetails={providerDetailsData}
            sendDataToParent={handleBookingPage}
            user={user}
            bookingType={bookingType}        
          />
        );
      case "NANNY":
        return (
          <NannyServicesDialog 
            open={open}
            handleClose={handleClose}
            providerDetails={providerDetailsData}
            sendDataToParent={handleBookingPage}
            user={user}
            bookingType={bookingType}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={[
          styles.card,
          isSmallScreen && styles.cardSmall,
          isMediumScreen && styles.cardMedium,
          isLargeScreen && styles.cardLarge
        ]}>
          {/* Header with provider name and buttons */}
          <View style={[
            styles.headerContainer,
            isSmallScreen && styles.headerContainerSmall
          ]}>
            {/* Provider Name */}
            <View style={styles.providerNameContainer}>
              <Text style={[
                styles.nameText,
                isSmallScreen && styles.nameTextSmall,
                isMediumScreen && styles.nameTextMedium
              ]} numberOfLines={1}>
                {props.firstName} {props.middleName} {props.lastName}
              </Text>
              <View style={styles.genderAgeContainer}>
                <Text style={[
                  styles.genderAgeText,
                  isSmallScreen && styles.genderAgeTextSmall
                ]}>
                  ({getGenderSymbol(props.gender)} {calculateAge(props.dob)})
                </Text>
                <Image 
                  source={dietImage} 
                  style={[
                    styles.dietIcon,
                    isSmallScreen && styles.dietIconSmall
                  ]}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[
              styles.headerButtons,
              isSmallScreen && styles.headerButtonsSmall
            ]}>
              <TouchableOpacity 
                style={[
                  styles.expandButton,
                  isSmallScreen && styles.expandButtonSmall
                ]}
                onPress={toggleExpand}
              >
                <Icon 
                  name={isExpanded ? "remove" : "add"} 
                  size={isSmallScreen ? 20 : 24} 
                  color="#1976d2" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.bookNowButton,
                  isSmallScreen && styles.bookNowButtonSmall
                ]}
                onPress={handleBookNow}
                // disabled={!isBookNowEnabled}
              >
                <Text style={[
                  styles.bookNowText,
                  isSmallScreen && styles.bookNowTextSmall
                ]}>
                  Book Now
                </Text>
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  isSmallScreen && styles.favoriteButtonSmall
                ]}
                onPress={toggleFavorite}
              >
                <Icon 
                  name={isFavorite ? "favorite" : "favorite-border"} 
                  size={isSmallScreen ? 20 : 24} 
                  color={isFavorite ? 'red' : 'gray'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={[
                styles.detailRow,
                isSmallScreen && styles.detailRowSmall
              ]}>
                <Text style={[
                  styles.detailLabel,
                  isSmallScreen && styles.detailLabelSmall
                ]}>Language: </Text>
                <Text style={[
                  styles.detailValue,
                  isSmallScreen && styles.detailValueSmall
                ]} numberOfLines={2}>
                  {props.language || "English"}
                </Text>
              </View>

              <View style={[
                styles.detailRow,
                isSmallScreen && styles.detailRowSmall
              ]}>
                <Text style={[
                  styles.detailLabel,
                  isSmallScreen && styles.detailLabelSmall
                ]}>Experience: </Text>
                <Text style={[
                  styles.detailValue,
                  isSmallScreen && styles.detailValueSmall
                ]} numberOfLines={2}>
                  {props.experience || "1 year"}
                </Text>
              </View>

              <View style={[
                styles.detailRow,
                isSmallScreen && styles.detailRowSmall
              ]}>
                <Text style={[
                  styles.detailLabel,
                  isSmallScreen && styles.detailLabelSmall
                ]}>Other Services: </Text>
                <Text style={[
                  styles.detailValue,
                  isSmallScreen && styles.detailValueSmall
                ]} numberOfLines={3}>
                  {props.otherServices || "N/A"}
                </Text>
              </View>

              {warning ? (
                <View style={[
                  styles.warningContainer,
                  isSmallScreen && styles.warningContainerSmall
                ]}>
                  <Text style={[
                    styles.warningText,
                    isSmallScreen && styles.warningTextSmall
                  ]}>{warning}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {renderServiceDialog()}
    </>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: SCREEN_WIDTH < 375 ? 6 : 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  cardSmall: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardMedium: {
    padding: 14,
  },
  cardLarge: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContainerSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  providerNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButtonsSmall: {
    gap: 6,
    alignSelf: 'flex-end',
  },
  expandButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 4,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonSmall: {
    padding: 6,
    minWidth: 36,
  },
  bookNowButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  bookNowButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  bookNowText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  bookNowTextSmall: {
    fontSize: 12,
  },
  bookNowTextDisabled: {
    color: '#999',
  },
  favoriteButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonSmall: {
    padding: 6,
    minWidth: 36,
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  nameTextSmall: {
    fontSize: 16,
  },
  nameTextMedium: {
    fontSize: 17,
  },
  genderAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  genderAgeText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  genderAgeTextSmall: {
    fontSize: 14,
  },
  dietIcon: {
    width: 20,
    height: 20,
  },
  dietIconSmall: {
    width: 18,
    height: 18,
  },
  expandedContent: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  detailRowSmall: {
    marginBottom: 6,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    minWidth: 100,
  },
  detailLabelSmall: {
    fontSize: 13,
    minWidth: 'auto',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
  },
  detailValueSmall: {
    fontSize: 13,
  },
  warningContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningContainerSmall: {
    padding: 6,
    marginTop: 6,
  },
  warningText: {
    color: '#d32f2f',
    fontSize: 12,
  },
  warningTextSmall: {
    fontSize: 11,
  },
});

export default ProviderDetails;