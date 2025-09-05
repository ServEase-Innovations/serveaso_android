import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Button,
  Platform,
  TextStyle,
  ViewStyle,
  ImageStyle,
  Animated,
  Dimensions
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "./features/bookingTypeSlice";
import { DETAILS } from "./Constants/pagesConstants";
import DateTimePicker from "@react-native-community/datetimepicker";
import RadioButton from './RadioButton';
import ServiceProviderRegistration from './ServiceProviderRegistration';
import ServiceDetailsDialog from './ServiceDetailsDialog'; 
import Chatbot from './Chatbot'; 
import MaidServiceDialog from "./MaidServiceDialog";
import DemoCook from "./demoCook";
import NannyServicesDialog from "./NannyServiceDialog";
import LinearGradient from 'react-native-linear-gradient';
import AgentRegistrationForm from './AgentRegistrationForm';

// Import local images
const cookImage = require("../assets/images/Cooknew.png");
const maidImage = require("../assets/images/Maidnew.png");
const nannyImage = require("../assets/images/Nannynew.png");
const heroImage1 = require("../assets/images/CookLand.png");
const heroImage2 = require("../assets/images/MaidLand.png");
const heroImage3 = require("../assets/images/NannyLand.png");

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: (data: string) => void;
  user?: any;
  providerDetails?: any;
}

// Define slides outside the component
const howItWorksSlides = [
  {
    icon: "✋",
    title: "Choose your service",
    desc: "Select from a variety of tasks that suit your needs.",
    color: "#c0aceeff",
    iconColor: "#d7b0eeff",
    gradientColors: ['#d59effff', '#e5dbf0ff', '#f2e9faff']
  },
  {
    icon: "📅",
    title: "Schedule in minutes",
    desc: "Book a time that works for you, quickly and easily.",
    color: "#9ED2FF",
    iconColor: "#5C9EFF",
    gradientColors: ['#9ED2FF', '#D2E9FF', '#F0F8FF']
  },
  {
    icon: "🏠",
    title: "Relax, we'll handle the rest",
    desc: "Our verified professionals ensure your peace of mind.",
    color: "#a4f6c6ff",
    iconColor: "#92f5d9ff",
    gradientColors: ['#90e9e5ff', '#d2fff4ff', '#F0FFF2']
  },
];

const HomePage: React.FC<ChildComponentProps> = ({
  sendDataToParent,
  bookingType,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedtype] = useState("");
  const [selectedRadioButtonValue, setSelectedRadioButtonValue] = useState("");
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<"start" | "end">("start");
  const [showRegistration, setShowRegistration] = useState(false);
  const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<"cook" | "maid" | "babycare" | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showCookServicesDialog, setShowCookServicesDialog] = useState(false);
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleAgentWorkButtonClick = () => {
    setShowAgentRegistration(true);
  };
  
  // Carousel images array
  const carouselImages = [heroImage1, heroImage2, heroImage3];

  // Single interval for both carousel and How It Works slides
  useEffect(() => {
    const interval = setInterval(() => {
      // Update carousel
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
      
      // Update How It Works slides
      setCurrentSlide((prevSlide) => 
        prevSlide === howItWorksSlides.length - 1 ? 0 : prevSlide + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const HowItWorksSection = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Animation when slide changes
    useEffect(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [currentSlide]);

    return (
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.slideshowContainer}>
          <Animated.View
            style={[
              styles.slide,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
                shadowColor: howItWorksSlides[currentSlide].iconColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 10,
              },
            ]}
          >
            <LinearGradient
              colors={howItWorksSlides[currentSlide].gradientColors}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.gradientContainer}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.stepIcon, { color: howItWorksSlides[currentSlide].iconColor }]}>
                  {howItWorksSlides[currentSlide].icon}
                </Text>
              </View>
              <Text style={styles.stepTitle}>{howItWorksSlides[currentSlide].title}</Text>
              <Text style={styles.stepDesc}>{howItWorksSlides[currentSlide].desc}</Text>
            </LinearGradient>
          </Animated.View>
        </View>
        <View style={styles.dotsContainer}>
          {howItWorksSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide && [
                  styles.activeDot,
                  { backgroundColor: howItWorksSlides[index].iconColor },
                ],
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const handleWorkButtonClick = () => {
    setShowRegistration(true);
  };

  const dispatch = useDispatch();

  const handleClick = (data: string) => {
    setOpen(true);
    setSelectedtype(data);
  };

  const getSelectedValue = (value: string) => {
    setSelectedRadioButtonValue(value);
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diffInMs = end.getTime() - start.getTime();
    return diffInMs / (1000 * 60 * 60);
  };

  const handleSave = () => {
    let duration = 0;
    const booking = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString(),
      bookingPreference: selectedRadioButtonValue,
      serviceType: selectedType,
    };

    if (selectedRadioButtonValue === "Date") {
      switch (selectedType) {
        case "COOK":
          setShowCookDialog(true);
          break;
        case "MAID":
          setShowMaidServiceDialog(true);
          break;
        case "NANNY":
          setShowNannyServicesDialog(true);
          break;
        default:
          sendDataToParent(DETAILS);
      }
    } else {
      sendDataToParent(DETAILS);
    }

    setOpen(false);
    dispatch(add(booking));
  };

  const isConfirmDisabled = () => {
    if (!startDate) return true;
    if (selectedRadioButtonValue !== "Monthly" && !endDate) return true;
    if (!startTime) return true;
    if (selectedRadioButtonValue !== "Monthly" && !endTime) return true;
    return false;
  };

  const showDatepicker = (type: "start" | "end") => {
    setCurrentPicker(type);
    setShowDatePicker(true);
  };

  const showTimepicker = (type: "start" | "end") => {
    setCurrentPicker(type);
    setShowTimePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (currentPicker === "start") {
        setStartDate(selectedDate);
        if (selectedRadioButtonValue === "Date") {
          setEndDate(selectedDate);
        }
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      if (currentPicker === "start") {
        setStartTime(selectedTime);
      } else {
        setEndTime(selectedTime);
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  const formatTime = (time: Date | null) => {
    if (!time) return "";
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  
  const handleLearnMore = (service: string) => {
    switch (service) {
      case "Home Cook":
        setSelectedServiceType("cook");
        break;
      case "Cleaning Help":
        setSelectedServiceType("maid");
        break;
      case "Caregiver":
        setSelectedServiceType("babycare");
        break;
      default:
        setSelectedServiceType(null);
    }
    setServiceDetailsOpen(true);
  };

  const getServiceRole = (serviceType: string) => {
    switch (serviceType) {
      case "COOK":
        return "Cook";
      case "MAID":
        return "Maid";
      case "NANNY":
        return "Nanny";
      default:
        return "";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0a2a66', '#004aad']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.heroSectionGradient}
      >
        {/* Hero Section */}
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>
            Book trusted household help in minutes
          </Text>
          <Text style={styles.heroSubtitle}>
            ServEaso delivers instant, regular and short term access to safe, affordable, and trained maids, cooks, and caregivers.
          </Text>
          
          {/* Service Selection Header */}
          <Text style={styles.selectorTitle}>What service do you need?</Text>
          <Text style={styles.selectorSubtitle}>Tap to book instantly</Text>
          
          <View style={styles.serviceIconsContainer}>
            {/* Cook Service */}
            <View style={styles.serviceSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainerRectangular,
                  hoveredService === "COOK" && styles.serviceIconContainerRectangularHover,
                ]}
                onPress={() => handleClick("COOK")}
                onPressIn={() => setHoveredService("COOK")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={cookImage} style={styles.serviceImageRectangular} />
                <View style={styles.serviceOverlay}>
                  <Text style={styles.serviceLabelRectangular}>Home Cook</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Maid Service */}
            <View style={styles.serviceSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainerRectangular,
                  hoveredService === "MAID" && styles.serviceIconContainerRectangularHover,
                ]}
                onPress={() => handleClick("MAID")}
                onPressIn={() => setHoveredService("MAID")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={maidImage} style={styles.serviceImageRectangular} />
                <View style={styles.serviceOverlay}>
                  <Text style={styles.serviceLabelRectangular}>Cleaning Help</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Nanny Service */}
            <View style={styles.serviceSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainerRectangular,
                  hoveredService === "NANNY" && styles.serviceIconContainerRectangularHover,
                ]}
                onPress={() => handleClick("NANNY")}
                onPressIn={() => setHoveredService("NANNY")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={nannyImage} style={styles.serviceImageRectangular} />
                <View style={styles.serviceOverlay}>
                  <Text style={styles.serviceLabelRectangular}>Caregiver</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Three Buttons after service selectors */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.outlineButton,
                hoveredButton === "help" && styles.outlineButtonHover
              ]}
              onPress={() => setChatbotOpen(true)}
              onPressIn={() => setHoveredButton("help")}
              onPressOut={() => setHoveredButton(null)}
            >
              <Text style={styles.outlineButtonText}>I need help</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.outlineButton,
                hoveredButton === "work" && styles.outlineButtonHover
              ]}
              onPress={handleWorkButtonClick}
              onPressIn={() => setHoveredButton("work")}
              onPressOut={() => setHoveredButton(null)}
            >
              <Text style={styles.outlineButtonText}>I want to work</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.outlineButton,
                hoveredButton === "agent" && styles.outlineButtonHover
              ]}
              onPress={handleAgentWorkButtonClick}
              onPressIn={() => setHoveredButton("agent")}
              onPressOut={() => setHoveredButton(null)}
            >
              <Text style={styles.outlineButtonText}>Work as Agent</Text>
            </TouchableOpacity>

            <Chatbot 
              open={chatbotOpen} 
              onClose={() => setChatbotOpen(false)} 
            />

            <Modal visible={showAgentRegistration} animationType="slide">
              <AgentRegistrationForm
                onBackToLogin={() => setShowAgentRegistration(false)}
                onRegistrationSuccess={() => setShowAgentRegistration(false)}
              />
            </Modal>

            <Modal visible={showRegistration} animationType="slide">
              <ServiceProviderRegistration
                onBackToLogin={() => setShowRegistration(false)}
                onRegistrationSuccess={() => setShowRegistration(false)}
              />
            </Modal>
          </View>
        </View>
        
        {/* Carousel Section */}
        <View style={styles.carouselContainer}>
          <Image 
            source={carouselImages[currentImageIndex]} 
            style={styles.carouselImage}
            resizeMode="cover"
          />
          <View style={styles.carouselIndicators}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.carouselIndicator,
                  index === currentImageIndex && styles.carouselIndicatorActive
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
      
      {/* Services Section */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <View style={styles.servicesGrid}>
          {[
            {
              title: "Home Cook",
              desc: "Skilled and hygienic cooks who specialize in home-style meals.",
              icon: "👩‍🍳",
              gradient: ['#c5d6efff', '#176269ff'],
              iconBg: '#FFF5F5',
            },
            {
              title: "Cleaning Help",
              desc: "Reliable maids for daily, deep, or special occasion cleaning.",
              icon: "🧼",
              gradient: ['#c5d6efff', '#124c66ff'],
              iconBg: '#F0F9F8',
            },
            {
              title: "Caregiver",
              desc: "Trained support for children, seniors, or patients at home.",
              icon: "❤️",
              gradient: ['#c5d6efff', '#233572ff'],
              iconBg: '#FFF5F5',
            },
          ].map((service, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.serviceCard}
              onPress={() => handleLearnMore(service.title)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={service.gradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.serviceCardGradient}
              >
                <View style={styles.serviceCardContent}>
                  <View style={[styles.serviceIconContainer, { backgroundColor: service.iconBg }]}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                  <View style={styles.learnMoreContainer}>
                    <Text style={styles.learnMoreLink}>Learn More</Text>
                    <Text style={styles.learnMoreArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* How it works */}
      <HowItWorksSection />

      {/* Booking Dialog */}
      <Modal visible={open} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book a {selectedType.toLowerCase()}</Text>

            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>Book by</Text>
              <View style={styles.radioOptions}>
                <View style={styles.radioOption}>
                  <RadioButton
                    selected={selectedRadioButtonValue === "Date"}
                    onPress={() => getSelectedValue("Date")}
                  />
                  <Text>Date</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton
                    selected={selectedRadioButtonValue === "Short term"}
                    onPress={() => getSelectedValue("Short term")}
                  />
                  <Text>Short term</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton
                    selected={selectedRadioButtonValue === "Monthly"}
                    onPress={() => getSelectedValue("Monthly")}
                  />
                  <Text>Monthly</Text>
                </View>
              </View>
            </View>

            {/* Date/Time Selection Section */}
            {selectedRadioButtonValue && (
              <View style={styles.dateTimeContainer}>
                {/* Date Selection */}
                <View style={styles.dateContainer}>
                  <Text style={styles.label}>
                    {selectedRadioButtonValue === "Monthly" ? "Select Month" : "Select Date"}
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => showDatepicker("start")}
                  >
                    <Text style={styles.dateInputText}>
                      {formatDate(startDate) || "Select date"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* End date for non-monthly bookings */}
                {(selectedRadioButtonValue === "Date" || selectedRadioButtonValue === "Short term") && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity
                      style={[styles.dateInput, !startDate && styles.disabledInput]}
                      onPress={() => showDatepicker("end")}
                      disabled={!startDate}
                    >
                      <Text style={styles.dateInputText}>
                        {formatDate(endDate) || "Select date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Time Selection */}
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeInputWrapper}>
                    <Text style={styles.label}>Start Time</Text>
                    <TouchableOpacity
                      style={styles.timeInput}
                      onPress={() => showTimepicker("start")}
                    >
                      <Text style={styles.timeInputText}>
                        {formatTime(startTime) || "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* End time for non-monthly bookings */}
                  {(selectedRadioButtonValue === "Date" || selectedRadioButtonValue === "Short term") && (
                    <View style={styles.timeInputWrapper}>
                      <Text style={styles.label}>End Time</Text>
                      <TouchableOpacity
                        style={[styles.timeInput, !startTime && styles.disabledInput]}
                        onPress={() => showTimepicker("end")}
                        disabled={!startTime}
                      >
                        <Text style={styles.timeInputText}>
                          {formatTime(endTime) || "Select time"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={handleClose} />
              <Button
                title="Confirm"
                onPress={handleSave}
                disabled={isConfirmDisabled()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {(showDatePicker || showTimePicker) && (
        <DateTimePicker
          value={
            currentPicker === "start"
              ? startDate || new Date()
              : endDate || new Date()
          }
          mode={showDatePicker ? "date" : "time"}
          display="default"
          onChange={showDatePicker ? onDateChange : onTimeChange}
          minimumDate={new Date()}
        />
      )}

      {showCookDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <DemoCook
              onClose={() => setShowCookDialog(false)}
              sendDataToParent={sendDataToParent}
              bookingType={{
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
                timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
                bookingPreference: selectedRadioButtonValue
              }}
            />
          </View>
        </View>
      )}

      {showNannyServicesDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <NannyServicesDialog
              open={showNannyServicesDialog}
              handleClose={() => setShowNannyServicesDialog(false)}
              sendDataToParent={sendDataToParent}
            />
          </View>
        </View>
      )}

      {showMaidServiceDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <MaidServiceDialog
              open={showMaidServiceDialog}
              handleClose={() => setShowMaidServiceDialog(false)}
              sendDataToParent={sendDataToParent}
            />
          </View>
        </View>
      )}

      <ServiceDetailsDialog
        open={serviceDetailsOpen}
        onClose={() => setServiceDetailsOpen(false)}
        serviceType={selectedServiceType}
      />
    </ScrollView>
  );
};

interface Styles {
  container: ViewStyle;
  selectorTitle: TextStyle;
  selectorSubtitle: TextStyle;
  serviceSelectorContainer: ViewStyle;
  serviceLabel: TextStyle;
  heroSectionGradient: ViewStyle;
  heroTextContainer: ViewStyle;
  heroTitle: TextStyle;
  heroSubtitle: TextStyle;
  serviceIconsContainer: ViewStyle;
  serviceTooltipContainer: ViewStyle;
  serviceIconContainerHover: ViewStyle;
  serviceImage: ImageStyle;
  tooltip: ViewStyle;
  tooltipText: TextStyle;
  buttonContainer: ViewStyle;
  outlineButton: ViewStyle;
  outlineButtonHover: ViewStyle;
  outlineButtonText: TextStyle;
  carouselContainer: ViewStyle;
  carouselImage: ImageStyle;
  carouselIndicators: ViewStyle;
  carouselIndicator: ViewStyle;
  carouselIndicatorActive: ViewStyle;
  servicesSection: ViewStyle;
  sectionTitle: TextStyle;
  servicesGrid: ViewStyle;
  serviceCard: ViewStyle;
  serviceCardPressed: ViewStyle;
  serviceCardGradient: ViewStyle;
  serviceCardContent: ViewStyle;
  serviceIconContainer: ViewStyle;
  serviceIcon: TextStyle;
  serviceTitle: TextStyle;
  serviceDesc: TextStyle;
  learnMoreContainer: ViewStyle;
  learnMoreLink: TextStyle;
  learnMoreArrow: TextStyle;
  howItWorksSection: ViewStyle;
  slideshowContainer: ViewStyle;
  gradientContainer: ViewStyle;
  iconContainer: ViewStyle;
  slide: ViewStyle;
  dotsContainer: ViewStyle;
  dot: ViewStyle;
  activeDot: ViewStyle;
  stepIcon: TextStyle;
  stepTitle: TextStyle;
  stepDesc: TextStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  radioGroup: ViewStyle;
  radioLabel: TextStyle;
  radioOptions: ViewStyle;
  radioOption: ViewStyle;
  dateTimeContainer: ViewStyle;
  dateContainer: ViewStyle;
  monthlyContainer: ViewStyle;
  label: TextStyle;
  dateInput: ViewStyle;
  timeInputContainer: ViewStyle;
  timeInputWrapper: ViewStyle;
  timeInput: ViewStyle;
  dateBlock: ViewStyle;
  modalButtons: ViewStyle;
  dateInputText: TextStyle;
  timeInputText: TextStyle;
  disabledInput: ViewStyle;
  dialogOverlay: ViewStyle;
  dialogBox: ViewStyle;
  // New styles for rectangular service selectors
  serviceIconContainerRectangular: ViewStyle;
  serviceIconContainerRectangularHover: ViewStyle;
  serviceImageRectangular: ImageStyle;
  serviceOverlay: ViewStyle;
  serviceLabelRectangular: TextStyle;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  selectorSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  serviceSelectorContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    flex: 1,
  },
  serviceLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  heroSectionGradient: {
    padding: 16,
    flexDirection: "column",
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 0,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  serviceIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  serviceTooltipContainer: {
    alignItems: "center",
    position: 'relative',
  },
  serviceIconContainer: {
    alignItems: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1976d2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainerHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderColor: "#0d47a1",
    borderWidth: 3,
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  tooltip: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  outlineButtonHover: {
    backgroundColor: "#f8f9fa",
    transform: [{ scale: 1.05 }],
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976d2",
    textAlign: 'center',
  },
  carouselContainer: {
    height: 270,
    position: 'relative',
    marginTop: 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  servicesSection: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    color: '#1a365d',
  },
  servicesGrid: {
    flexDirection: "column",
    gap: 16,
  },
  serviceCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    overflow: 'hidden',
  },
  serviceCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
  },
  serviceCardGradient: {
    borderRadius: 20,
    padding: 0,
  },
  serviceCardContent: {
    alignItems: "center",
    padding: 16,
    gap: 15,
  },
  // serviceIconContainer: {
  //   width: 60,
  //   height: 60,
  //   borderRadius: 30,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginBottom: 10,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 3,
  //   elevation: 2,
  // },
  serviceIcon: {
    fontSize: 28,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 16,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  learnMoreLink: {
    fontSize: 14,
    color: "#fff",
    fontWeight: '600',
  },
  learnMoreArrow: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 'bold',
  },
  howItWorksSection: {
    backgroundColor: "#ffffffff",
    padding: 40,
    paddingVertical: 20,
  },
  slideshowContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: '90%',
    maxWidth: 350,
    height: '100%',
    overflow: 'hidden',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#1976d2',
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: '#333',
  },
  stepDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  radioOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeContainer: {
    gap: 16,
  },
  dateContainer: {
    gap: 16,
  },
  monthlyContainer: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
  },
  timeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
  },
  dateBlock: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  dateInputText: {
    color: '#000',
  },
  timeInputText: {
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  
  // New styles for rectangular service selectors
  serviceIconContainerRectangular: {
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1976d2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  serviceIconContainerRectangularHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderColor: "#0d47a1",
    borderWidth: 2,
  },
  serviceImageRectangular: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },
  serviceLabelRectangular: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
export default HomePage;