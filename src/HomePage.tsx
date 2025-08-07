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
} from "react-native";
import { useDispatch } from "react-redux";
import { add } from "./features/bookingTypeSlice";
import { DETAILS } from "./Constants/pagesConstants";
import DateTimePicker from "@react-native-community/datetimepicker";
import RadioButton from './RadioButton';
import ServiceProviderRegistration from './ServiceProviderRegistration';
import ServiceDetailsDialog from './ServiceDetailsDialog'; 
import Chatbot from './Chatbot'; 
import CookServiceDialog from './CookServiceDialog';
import MaidServiceDialog from "./MaidServiceDialog";
import NannyServiceDialog from "./NannyServiceDialog";
import DemoCook from "./demoCook";
import NannyServicesDialog from "./NannyServiceDialog";

// Import local images
const cookImage = require("../assets/images/CookAi.png");
const maidImage = require("../assets/images/MaidAi.png");
const nannyImage = require("../assets/images/NannyAi.png");
const heroImage = require("../assets/images/maid-hero.png");

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
  bookingType: (data: string) => void;
  user?: any;
  providerDetails?: any;
}

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

const HowItWorksSection = () => {
  const slides = [
    {
      icon: "✋",
      title: "Choose your service",
      desc: "Select from a variety of tasks that suit your needs.",
      color: "#FF9E9E", // Light red
      iconColor: "#FF5C5C",
    },
    {
      icon: "📅",
      title: "Schedule in minutes",
      desc: "Book a time that works for you, quickly and easily.",
      color: "#9ED2FF", // Light blue
      iconColor: "#5C9EFF",
    },
    {
      icon: "🏠",
      title: "Relax, we'll handle the rest",
      desc: "Our verified professionals ensure your peace of mind.",
      color: "#9EFFB2", // Light green
      iconColor: "#5CFF7A",
    },
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Slide out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        // Reset animation values for next slide
        slideAnim.setValue(50);
        // Slide in animation
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
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

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
              backgroundColor: slides[currentSlide].color,
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
              shadowColor: slides[currentSlide].iconColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={[styles.stepIcon, { color: slides[currentSlide].iconColor }]}>
              {slides[currentSlide].icon}
            </Text>
          </View>
          <Text style={styles.stepTitle}>{slides[currentSlide].title}</Text>
          <Text style={styles.stepDesc}>{slides[currentSlide].desc}</Text>
        </Animated.View>
      </View>
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && [
                styles.activeDot,
                { backgroundColor: slides[index].iconColor },
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
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>
            Book trusted household help in minutes
          </Text>
          <Text style={styles.heroSubtitle}>
           ServEaso delivers instant, regular and short term access to safe, affordable, and trained maids, cooks, and caregivers.
          </Text>
          <View style={styles.serviceIconsContainer}>
            {/* Cook Service */}
            <View style={styles.serviceTooltipContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainer,
                  hoveredService === "COOK" && styles.serviceIconContainerHover,
                ]}
                onPress={() => handleClick("COOK")}
                onPressIn={() => setHoveredService("COOK")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={cookImage} style={styles.serviceImage} />
              </TouchableOpacity>
              {hoveredService === "COOK" && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{getServiceRole("COOK")}</Text>
                </View>
              )}
            </View>

            {/* Maid Service */}
            <View style={styles.serviceTooltipContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainer,
                  hoveredService === "MAID" && styles.serviceIconContainerHover,
                ]}
                onPress={() => handleClick("MAID")}
                onPressIn={() => setHoveredService("MAID")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={maidImage} style={styles.serviceImage} />
              </TouchableOpacity>
              {hoveredService === "MAID" && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{getServiceRole("MAID")}</Text>
                </View>
              )}
            </View>

            {/* Nanny Service */}
            <View style={styles.serviceTooltipContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceIconContainer,
                  hoveredService === "NANNY" && styles.serviceIconContainerHover,
                ]}
                onPress={() => handleClick("NANNY")}
                onPressIn={() => setHoveredService("NANNY")}
                onPressOut={() => setHoveredService(null)}
              >
                <Image source={nannyImage} style={styles.serviceImage} />
              </TouchableOpacity>
              {hoveredService === "NANNY" && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{getServiceRole("NANNY")}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => setChatbotOpen(true)}>
              <Text style={styles.outlineButtonText}>I need help</Text>
            </TouchableOpacity>
  
            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={handleWorkButtonClick}
            >
              <Text style={styles.outlineButtonText}>I want to work</Text>
            </TouchableOpacity>

            <Chatbot 
              open={chatbotOpen} 
              onClose={() => setChatbotOpen(false)} 
            />

            {/* Add the registration modal */}
            <Modal visible={showRegistration} animationType="slide">
              <ServiceProviderRegistration
                onBackToLogin={() => setShowRegistration(false)}
                onRegistrationSuccess={() => setShowRegistration(false)}
              />
            </Modal>
          </View>
        </View>
        <View style={styles.heroImageContainer}>
          <Image source={heroImage} style={styles.heroImage} />
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <View style={styles.servicesGrid}>
          {[
            {
              title: "Home Cook",
              desc: "Skilled and hygienic cooks who specialize in home-style meals.",
              icon: "👩‍🍳",
            },
            {
              title: "Cleaning Help",
              desc: "Reliable maids for daily, deep, or special occasion cleaning.",
              icon: "🧼",
            },
            {
              title: "Caregiver",
              desc: "Trained support for children, seniors, or patients at home.",
              icon: "❤️",
            },
          ].map((service, index) => (
            <View key={index} style={styles.serviceCard}>
              <View style={styles.serviceCardContent}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
                <TouchableOpacity  onPress={() => handleLearnMore(service.title)}>
                  <Text style={styles.learnMoreLink}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* How it works - replaced with new slideshow component */}
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
                {/* Date Selection - Show for all booking types */}
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

                {/* Only show end date for non-monthly bookings */}
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

                {/* Time Selection - Show for all booking types */}
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
                  
                  {/* Only show end time for non-monthly bookings */}
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
  heroSection: ViewStyle;
  heroTextContainer: ViewStyle;
  heroTitle: TextStyle;
  heroSubtitle: TextStyle;
  serviceIconsContainer: ViewStyle;
  serviceIconContainer: ViewStyle;
  serviceIconContainerHover: ViewStyle;
  serviceImage: ImageStyle;
  buttonContainer: ViewStyle;
  outlineButton: ViewStyle;
  outlineButtonText: TextStyle;
  heroImageContainer: ViewStyle;
  heroImage: ImageStyle;
  servicesSection: ViewStyle;
  sectionTitle: TextStyle;
  servicesGrid: ViewStyle;
  serviceCard: ViewStyle;
  serviceCardContent: ViewStyle;
  serviceIcon: TextStyle;
  serviceTitle: TextStyle;
  serviceDesc: TextStyle;
  learnMoreLink: TextStyle;
  howItWorksSection: ViewStyle;
  slideshowContainer: ViewStyle;
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
  serviceTooltipContainer: ViewStyle;
  tooltip: ViewStyle;
  tooltipText: TextStyle;
  dateInputText: TextStyle;
  timeInputText: TextStyle;
  disabledInput: ViewStyle;
  dialogOverlay: ViewStyle;
  dialogBox: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  heroSection: {
    backgroundColor: "#fff",
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
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
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
    gap: 12,
    paddingTop: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  outlineButtonText: {
    fontSize: 14,
  },
  heroImageContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  heroImage: {
    width: "80%",
    maxWidth: 400,
    height: 450,
    borderRadius: 12,
  },
  servicesSection: {
    padding: 16,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  servicesGrid: {
    flexDirection: "column",
    gap: 16,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 20,
  },
  serviceCardContent: {
    alignItems: "center",
    gap: 8,
  },
  serviceIcon: {
    fontSize: 36,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  serviceDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  learnMoreLink: {
    fontSize: 14,
    color: "#1976d2",
    marginTop: 8,
  },
  howItWorksSection: {
    backgroundColor: "#e6f2ff",
    padding: 40,
    paddingVertical: 20,
  },
  slideshowContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
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
  padding: 30,
  borderRadius: 20,
  width: '90%',
  maxWidth: 350,
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
});

export default HomePage;