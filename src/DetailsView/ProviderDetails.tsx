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

// Enhanced types based on React code
interface BookingType {
  serviceproviderId: string;
  eveningSelection: string | null;
  morningSelection: string | null;
  timeRange?: string;
  duration?: number;
  [key: string]: any;
}

// Unified EnhancedProviderDetails interface with both naming conventions
interface EnhancedProviderDetails {
  // React naming (from web)
  serviceproviderid: string;
  firstname: string;
  lastname: string;
  housekeepingrole: string;
  middleName?: string;
  gender: string;
  dob: string;
  diet: string;
  
  // React Native naming (for compatibility with dialogs)
  serviceproviderId: string;
  firstName: string;
  lastName: string;
  housekeepingRole: string;
  
  // Common properties
  selectedMorningTime: number | null;
  selectedEveningTime: number | null;
  matchedMorningSelection: string | null;
  matchedEveningSelection: string | null;
  startTime: string;
  endTime: string;
  languageknown?: string[];
  experience?: number;
  otherServices?: string;
  availableTimeSlots?: string[];
  rating?: number;
  distance_km?: number;
  bestMatch?: boolean;
  monthlyAvailability?: {
    fullyAvailable: boolean;
    preferredTime?: string;
  };
  age?: number;
  locality?: string;
}

interface ProviderDetailsProps {
  // React naming
  housekeepingrole: string;
  serviceproviderid: string;
  firstname: string;
  middleName?: string;
  lastname: string;
  
  // Common props
  gender: string;
  dob: string;
  diet: string;
  languageknown?: string[];
  experience?: number;
  otherServices?: string;
  availableTimeSlots?: string[];
  rating?: number;
  distance_km?: number;
  bestMatch?: boolean;
  monthlyAvailability?: {
    fullyAvailable: boolean;
    preferredTime?: string;
  };
  age?: number;
  locality?: string;
  
  // Callbacks
  selectedProvider: (provider: any) => void;
  sendDataToParent?: (data: string) => void;
}

const ProviderDetails: React.FC<ProviderDetailsProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eveningSelection, setEveningSelection] = useState<number | null>(null);
  const [morningSelection, setMorningSelection] = useState<number | null>(null);
  const [eveningSelectionTime, setEveningSelectionTime] = useState<string | null>(null);
  const [morningSelectionTime, setMorningSelectionTime] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [open, setOpen] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
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
  const isMobile = windowWidth < 768;
  const isSmallScreen = windowWidth < 375;
  const isMediumScreen = windowWidth >= 375 && windowWidth < 768;
  const isLargeScreen = windowWidth >= 768;

  const dietImages: {[key: string]: any} = {
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

  // Clear selection
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

  // Toggle favorite status with event simulation
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    console.log("Favorite toggled for provider:", props.serviceproviderid, "New status:", !isFavorite);
  };

  // Check missing time slots
  const checkMissingTimeSlots = () => {
    const expectedTimeSlots = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];

    const missing = expectedTimeSlots.filter(slot => !props.availableTimeSlots?.includes(slot));
    setMissingSlots(missing);
  };

  // Toggle expand with async logic from React
  const toggleExpand = async () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    if (!newExpandedState) {
      try {
        if (props.serviceproviderid === bookingType?.serviceproviderId) {
          setMatchedMorningSelection(bookingType?.morningSelection || null);
          setMatchedEveningSelection(bookingType?.eveningSelection || null);
        } else {
          setMatchedMorningSelection(null);
          setMatchedEveningSelection(null);
        }

        // Fetch engagement data (similar to React version)
        const response = await axiosInstance.get(
          `/api/serviceproviders/get/engagement/by/serviceProvider/${props.serviceproviderid}`
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
        setAvailableTimeSlots(processedSlots.flatMap((entry: any) => entry.uniqueAvailableTimeSlots));
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

  // Get age from props or calculate from DOB
  const getAge = () => {
    // If age is directly provided in props, use it
    if (props.age) {
      return props.age;
    }
    
    // Otherwise calculate from DOB
    if (props.dob) {
      return calculateAge(props.dob);
    }
    
    return "";
  };

  const handleBookNow = () => {
    let booking: BookingType;

    if (props.housekeepingrole !== "NANNY") {
      booking = {
        serviceproviderId: props.serviceproviderid,
        eveningSelection: eveningSelectionTime,
        morningSelection: morningSelectionTime,
        ...bookingType
      };
    } else {
      booking = {
        serviceproviderId: props.serviceproviderid,
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
    
    // Call the selectedProvider callback
    props.selectedProvider(providerDetails);
    
    // Handle login flow similar to React
    if (!loggedInUser) {
      handleLogin();
    } else {
      setOpen(true);
    }
  };

  const getHoursDifference = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  // Handle login (from React code)
  const handleLogin = () => {
    Alert.alert(
      "Login Required",
      "Please login to proceed with booking.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Login",
          onPress: () => {
            // You can navigate to login screen here
            // navigation.navigate('Login');
            setOpen(true);
          }
        }
      ]
    );
  };

  const handleClose = () => {
    console.log('Closing service dialog');
    setOpen(false);
  };

  const handleBookingPage = (data: string) => {
    console.log('Data received from dialog:', data);
    setOpen(false);
    
    if (props.sendDataToParent) {
      props.sendDataToParent(data);
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    validateTimeRange(newStartTime, endTime);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    validateTimeRange(startTime, newEndTime);
  };

  // Validate time range
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

  // Create provider details data with both naming conventions
  const providerDetailsData: EnhancedProviderDetails = {
    // React naming (web)
    serviceproviderid: props.serviceproviderid,
    firstname: props.firstname,
    lastname: props.lastname,
    housekeepingrole: props.housekeepingrole,
    middleName: props.middleName,
    gender: props.gender,
    dob: props.dob,
    diet: props.diet,
    
    // React Native naming (dialogs)
    serviceproviderId: props.serviceproviderid,
    firstName: props.firstname,
    lastName: props.lastname,
    housekeepingRole: props.housekeepingrole,
    
    // Common properties
    selectedMorningTime: morningSelection,
    selectedEveningTime: eveningSelection,
    matchedMorningSelection,
    matchedEveningSelection,
    startTime,
    endTime,
    languageknown: props.languageknown,
    experience: props.experience,
    otherServices: props.otherServices,
    rating: props.rating,
    distance_km: props.distance_km,
    bestMatch: props.bestMatch,
    monthlyAvailability: props.monthlyAvailability,
    age: getAge() as number,
    locality: props.locality
  };

  const getGenderSymbol = (gender: string) => {
    switch (gender?.toUpperCase()) {
      case 'FEMALE': return 'F';
      case 'MALE': return 'M';
      default: return 'O';
    }
  };

  const getInitials = () => {
    return `${props.firstname?.[0] || ''}${props.lastname?.[0] || ''}`.toUpperCase();
  };

  // Format time for display (e.g., "05:00" -> "05:00 AM")
  const formatTimeForDisplay = (timeString: string | undefined) => {
    if (!timeString) return "08:00 AM";
    return moment(timeString, "HH:mm").format("hh:mm A");
  };

  // Get language display
  const getLanguageDisplay = () => {
    if (props.languageknown && props.languageknown.length > 0) {
      return props.languageknown[0];
    }
    return "English";
  };

  // Render service dialog based on role
  const renderServiceDialog = () => {
    switch (props.housekeepingrole) {
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
            // providerDetails={providerDetailsData}
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
            // providerDetails={providerDetailsData}
            sendDataToParent={handleBookingPage}
            user={user}
            bookingType={bookingType}
          />
        );
      default:
        return null;
    }
  };

  // Get age value
  const age = getAge();
  const genderSymbol = getGenderSymbol(props.gender);

  return (
    <>
      <View style={styles.container}>
        <View style={[
          styles.card,
          isMobile && styles.cardMobile,
          isSmallScreen && styles.cardSmall,
          isMediumScreen && styles.cardMedium,
          isLargeScreen && styles.cardLarge
        ]}>
          {/* Best Match Ribbon - Similar to React */}
          {props.bestMatch && (
            <View style={[
              styles.bestMatchRibbon,
              isMobile && styles.bestMatchRibbonMobile
            ]}>
              <Icon name="local-fire-department" size={isMobile ? 14 : 16} color="white" />
              <Text style={[
                styles.bestMatchRibbonText,
                isMobile && styles.bestMatchRibbonTextMobile
              ]}>Best Match</Text>
            </View>
          )}

          {/* Main Container - Row on desktop, Column on mobile */}
          <View style={[
            styles.mainContainer,
            isMobile && styles.mainContainerMobile
          ]}>
            {/* Center Section - Provider Details */}
            <View style={[
              styles.centerSection,
              isMobile && styles.centerSectionMobile
            ]}>
              {/* Name and basic info */}
              <View style={[
                styles.nameContainer,
                isMobile && styles.nameContainerMobile
              ]}>
                <View style={styles.nameRow}>
                  <Text style={[
                    styles.nameText,
                    isMobile && styles.nameTextMobile,
                    isSmallScreen && styles.nameTextSmall
                  ]}>
                    {props.firstname} {props.lastname}
                  </Text>
                  <View style={[
                    styles.genderAgeChip,
                    isMobile && styles.genderAgeChipMobile
                  ]}>
                    <Text style={[
                      styles.genderAgeText,
                      isMobile && styles.genderAgeTextMobile
                    ]}>
                      {genderSymbol}, {age}
                    </Text>
                  </View>
                </View>

                {/* Meta info row - similar to React */}
                <View style={[
                  styles.metaRow,
                  isMobile && styles.metaRowMobile
                ]}>
                  <View style={styles.metaItem}>
                    <Icon name="restaurant" size={isMobile ? 14 : 16} color="#666" />
                    <Text style={[
                      styles.metaText,
                      isMobile && styles.metaTextMobile
                    ]}>{props.diet}</Text>
                  </View>

                  {!isMobile && <View style={styles.verticalDivider} />}

                  <View style={styles.metaItem}>
                    <Icon name="language" size={isMobile ? 14 : 16} color="#666" />
                    <Text style={[
                      styles.metaText,
                      isMobile && styles.metaTextMobile
                    ]}>{getLanguageDisplay()}</Text>
                  </View>

                  {!isMobile && <View style={styles.verticalDivider} />}

                  <View style={styles.metaItem}>
                    <Icon name="location-on" size={isMobile ? 14 : 16} color="#666" />
                    <Text style={[
                      styles.metaText,
                      isMobile && styles.metaTextMobile
                    ]}>{props.locality || "Nearby"}</Text>
                  </View>
                </View>

                {/* Availability section */}
                <View style={[
                  styles.availabilityContainer,
                  isMobile && styles.availabilityContainerMobile
                ]}>
                  <Text style={[
                    styles.availabilityLabel,
                    isMobile && styles.availabilityLabelMobile
                  ]}>Availability</Text>
                  <View style={[
                    styles.availabilityRow,
                    isMobile && styles.availabilityRowMobile
                  ]}>
                    <Icon name="access-time" size={isMobile ? 14 : 16} color="#1976d2" />
                    <Text style={[
                      styles.availabilityText,
                      isMobile && styles.availabilityTextMobile
                    ]}>
                      Available at {formatTimeForDisplay(props.monthlyAvailability?.preferredTime)}
                    </Text>
                    <View style={[
                      styles.monthlyChip,
                      isMobile && styles.monthlyChipMobile
                    ]}>
                      <Text style={[
                        styles.monthlyChipText,
                        isMobile && styles.monthlyChipTextMobile
                      ]}>Monthly</Text>
                    </View>
                  </View>
                </View>

                {/* Other Services */}
                {props.otherServices && (
                  <View style={[
                    styles.otherServicesContainer,
                    isMobile && styles.otherServicesContainerMobile
                  ]}>
                    <Text style={[
                      styles.otherServicesLabel,
                      isMobile && styles.otherServicesLabelMobile
                    ]}>Additional Services</Text>
                    <Text style={[
                      styles.otherServicesText,
                      isMobile && styles.otherServicesTextMobile
                    ]} numberOfLines={2}>
                      {props.otherServices}
                    </Text>
                  </View>
                )}
              </View>

              {/* Metrics Section - Similar to React layout */}
              <View style={[
                styles.metricsContainer,
                isMobile && styles.metricsContainerMobile
              ]}>
                <View style={[
                  styles.metricBox,
                  isMobile && styles.metricBoxMobile
                ]}>
                  <Text style={[
                    styles.metricValue,
                    isMobile && styles.metricValueMobile
                  ]}>{props.distance_km || 0}</Text>
                  <Text style={[
                    styles.metricLabel,
                    isMobile && styles.metricLabelMobile
                  ]}>km away</Text>
                </View>

                <View style={[
                  styles.metricBox,
                  isMobile && styles.metricBoxMobile
                ]}>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={isMobile ? 14 : 16} color="#FFD700" />
                    <Text style={[
                      styles.metricValue,
                      isMobile && styles.metricValueMobile
                    ]}>{props.rating?.toFixed(1) || "5.0"}</Text>
                  </View>
                  <Text style={[
                    styles.metricLabel,
                    isMobile && styles.metricLabelMobile
                  ]}>{props.rating || 5} reviews</Text>
                </View>

                <View style={[
                  styles.metricBox,
                  isMobile && styles.metricBoxMobile
                ]}>
                  <Text style={[
                    styles.metricValue,
                    styles.experienceValue,
                    isMobile && styles.metricValueMobile
                  ]}>{props.experience || 1}</Text>
                  <Text style={[
                    styles.metricLabel,
                    isMobile && styles.metricLabelMobile
                  ]}>yrs experience</Text>
                </View>
              </View>
            </View>

            {/* Right Section - Actions */}
            <View style={[
              styles.rightSection,
              isMobile && styles.rightSectionMobile
            ]}>
              {/* Role Chip */}
              {props.housekeepingrole && (
                <View style={[
                  styles.roleChip,
                  isMobile && styles.roleChipMobile
                ]}>
                  <Text style={[
                    styles.roleChipText,
                    isMobile && styles.roleChipTextMobile
                  ]}>{props.housekeepingrole}</Text>
                </View>
              )}

              {/* View Details Button */}
              <TouchableOpacity 
                style={[
                  styles.detailsButton,
                  isMobile && styles.detailsButtonMobile
                ]}
                onPress={toggleExpand}
              >
                <Icon name="info-outline" size={isMobile ? 16 : 18} color="#1976d2" />
                <Text style={[
                  styles.detailsButtonText,
                  isMobile && styles.detailsButtonTextMobile
                ]}>
                  {isMobile ? "Details" : "View Details"}
                </Text>
              </TouchableOpacity>

              {/* Book Now Button */}
              <TouchableOpacity 
                style={[
                  styles.bookNowButton,
                  isMobile && styles.bookNowButtonMobile,
                  (!isBookNowEnabled && props.housekeepingrole !== "NANNY") && styles.bookNowButtonDisabled
                ]}
                onPress={handleBookNow}
                disabled={!isBookNowEnabled && props.housekeepingrole !== "NANNY"}
              >
                <Text style={[
                  styles.bookNowButtonText,
                  isMobile && styles.bookNowButtonTextMobile
                ]}>
                  {isMobile ? "Book" : "Book Now"}
                </Text>
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  isMobile && styles.favoriteButtonMobile
                ]}
                onPress={toggleFavorite}
              >
                <Icon 
                  name={isFavorite ? "favorite" : "favorite-border"} 
                  size={isMobile ? 20 : 24} 
                  color={isFavorite ? '#ff4081' : '#666'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={[
              styles.expandedContent,
              isMobile && styles.expandedContentMobile
            ]}>
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
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  cardMobile: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardSmall: {
    padding: 10,
    borderRadius: 10,
  },
  cardMedium: {
    padding: 14,
  },
  cardLarge: {
    padding: 16,
  },
  bestMatchRibbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bestMatchRibbonMobile: {
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bestMatchRibbonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  bestMatchRibbonTextMobile: {
    fontSize: 10,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  mainContainerMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  centerSection: {
    flex: 1,
  },
  centerSectionMobile: {
    width: '100%',
  },
  nameContainer: {
    marginBottom: 16,
  },
  nameContainerMobile: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  nameTextMobile: {
    fontSize: 18,
  },
  nameTextSmall: {
    fontSize: 16,
  },
  genderAgeChip: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  genderAgeChipMobile: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  genderAgeText: {
    fontSize: 12,
    color: '#666',
  },
  genderAgeTextMobile: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaTextMobile: {
    fontSize: 13,
  },
  verticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e0e0e0',
  },
  availabilityContainer: {
    marginBottom: 16,
  },
  availabilityContainerMobile: {
    marginBottom: 12,
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  availabilityLabelMobile: {
    fontSize: 13,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  availabilityTextMobile: {
    fontSize: 14,
  },
  monthlyChip: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  monthlyChipMobile: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  monthlyChipText: {
    fontSize: 12,
    color: '#1976d2',
  },
  monthlyChipTextMobile: {
    fontSize: 11,
  },
  otherServicesContainer: {
    marginBottom: 16,
  },
  otherServicesContainerMobile: {
    marginBottom: 12,
  },
  otherServicesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  otherServicesLabelMobile: {
    fontSize: 13,
  },
  otherServicesText: {
    fontSize: 14,
    color: '#333',
  },
  otherServicesTextMobile: {
    fontSize: 13,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricsContainerMobile: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minWidth: 80,
  },
  metricBoxMobile: {
    padding: 8,
    minWidth: 70,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  metricValueMobile: {
    fontSize: 16,
  },
  experienceValue: {
    color: '#2e7d32',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricLabelMobile: {
    fontSize: 11,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightSection: {
    width: 140,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  rightSectionMobile: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleChip: {
    backgroundColor: '#1976d2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  roleChipMobile: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  roleChipTextMobile: {
    fontSize: 11,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailsButtonMobile: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
  },
  detailsButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsButtonTextMobile: {
    fontSize: 13,
  },
  bookNowButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bookNowButtonMobile: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 36,
  },
  bookNowButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  bookNowButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bookNowButtonTextMobile: {
    fontSize: 13,
  },
  favoriteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  favoriteButtonMobile: {
    padding: 6,
  },
  expandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  expandedContentMobile: {
    marginTop: 12,
    paddingTop: 8,
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