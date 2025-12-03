/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { add, add as addBooking } from "../features/bookingTypeSlice";
import dayjs from 'dayjs';
import BookingDialog from '../BookingDialog/BookingDialog';
import CookServicesDialog from '../ServiceDialogs/CookServiceDialog';
import MaidServiceDialog from '../ServiceDialogs/MaidServiceDialog';
import NannyServicesDialog from '../ServiceDialogs/NannyServiceDialog';

// Import local images - same as in HomePage
const cookImage = require("../../assets/images/Cooknew.png");
const maidImage = require("../../assets/images/Maidnew.png");
const nannyImage = require("../../assets/images/Nannynew.png");

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  imageSource: any;
  iconColor: string;
  bgColor: string;
  accentColor: string;
}

interface ServicesDialogProps {
  open: boolean;
  onClose: () => void;
  onServiceSelect?: (serviceType: string) => void;
  sendDataToParent?: (data: string, type?: string) => void;
}

const ServicesDialog: React.FC<ServicesDialogProps> = ({
  open,
  onClose,
  onServiceSelect,
  sendDataToParent
}) => {
  const dispatch = useDispatch();
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;

  // Booking states - SIMILAR TO HOMEPAGE
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'COOK' | 'MAID' | 'NANNY' | ''>('');
  const [selectedService, setSelectedService] = useState('');

  const [selectedOption, setSelectedOption] = useState<string>("Date"); // Changed from "Date" to empty string
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);

  // Service dialogs states - SIMILAR TO HOMEPAGE
  const [showCookDialog, setShowCookDialog] = useState(false);
  const [showMaidServiceDialog, setShowMaidServiceDialog] = useState(false);
  const [showNannyServicesDialog, setShowNannyServicesDialog] = useState(false);

  const handleServiceSelect = (serviceId: string) => {
    let serviceType: 'COOK' | 'MAID' | 'NANNY' = 'COOK';
    let serviceName = '';

    if (serviceId === 'home-cook') {
      serviceType = 'COOK';
      serviceName = 'Home Cook';
    } else if (serviceId === 'cleaning-help') {
      serviceType = 'MAID';
      serviceName = 'Cleaning Help';
    } else if (serviceId === 'caregiver') {
      serviceType = 'NANNY';
      serviceName = 'Caregiver';
    }

    setSelectedType(serviceType);
    setSelectedService(serviceName);

    // OPEN BOOKING DIALOG FIRST (like HomePage)
    setBookingDialogOpen(true);

    if (onServiceSelect) {
      onServiceSelect(serviceId);
    }
  };

  // HANDLE BOOKING SAVE - SIMILAR TO HOMEPAGE
  const handleBookingSave = (bookingDetails: any) => {
    console.log("📝 handleBookingSave called with:", bookingDetails);
    
    const formatDate = (value: any) => {
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toISOString().split("T")[0];
    };

    const formatTime = (value: any) => {
      if (!value) return "";
      
      console.log("🔧 formatTime input:", value, typeof value);
      
      // If it's a dayjs object, use it directly
      if (value && typeof value === 'object' && value.format) {
        console.log("📅 Using dayjs format");
        return value.format("HH:mm");
      }
      
      // If it's a Date object
      if (value instanceof Date) {
        console.log("📅 Using Date object");
        return value.toTimeString().slice(0, 5);
      }
      
      // If it's already a string, clean it up
      if (typeof value === 'string') {
        console.log("📅 Processing string time:", value);
        
        let timeStr = value.trim();
        
        // Handle 12-hour format with AM/PM
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          console.log("🕒 Converting 12-hour to 24-hour format");
          const [timePart, period] = timeStr.split(/\s+/);
          let [hours, minutes] = timePart.split(':').map(Number);
          
          if (period === 'PM' && hours < 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          console.log("🔄 Converted:", timeStr, "→", result);
          return result;
        }
        
        // If it's already in 24-hour format, clean and return
        const cleaned = timeStr.replace(/\s+/g, '');
        console.log("🧹 Cleaned time:", timeStr, "→", cleaned);
        return cleaned;
      }
      
      console.log("❌ Unhandled time format");
      return "";
    };

    const booking = {
      start_date: formatDate(bookingDetails.startDate),
      start_time: formatTime(bookingDetails.startTime),
      end_date: formatDate(bookingDetails.endDate || bookingDetails.startDate),
      end_time: formatTime(bookingDetails.endTime),
      timeRange:
        bookingDetails.startTime && bookingDetails.endTime
          ? `${formatTime(bookingDetails.startTime)} - ${formatTime(bookingDetails.endTime)}`
          : formatTime(bookingDetails.startTime) || "",
      bookingPreference: selectedOption,
      housekeepingRole: selectedType,
    };

    console.log("✅ Final booking object:", JSON.stringify(booking, null, 2));

    // Close booking dialog
    setBookingDialogOpen(false);

    // OPEN SERVICE-SPECIFIC DIALOG BASED ON SELECTED TYPE (like HomePage)
    if (selectedOption === "Date") {
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
          if (sendDataToParent) {
            sendDataToParent('DETAILS');
          }
      }
    } else {
      if (sendDataToParent) {
        sendDataToParent('DETAILS');
      }
    }

    dispatch(add(booking));
  };

  // HANDLE OPTION CHANGE - SIMILAR TO HOMEPAGE
  const handleOptionChange = (value: string) => {
    console.log("📋 Option changed to:", value);
    setSelectedOption(value);
    // Reset date/time when option changes
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
  };

  // HANDLE SERVICE DIALOG CLOSE
  const handleServiceDialogClose = () => {
    setShowCookDialog(false);
    setShowMaidServiceDialog(false);
    setShowNannyServicesDialog(false);
    
    if (sendDataToParent) {
      sendDataToParent('DETAILS');
    }
  };

  // Theme colors
  const themeColors = {
    headerBg: 'rgb(14, 48, 92)',
    primary: '#2FB3FF',
    textPrimary: 'rgb(14, 48, 92)',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    background: '#FFFFFF'
  };

  const cleaningHelpColors = {
    iconColor: '#2FB3FF',
    bgColor: '#EFF6FF',
    accentColor: '#2FB3FF'
  };

  const serviceOptions: ServiceOption[] = [
    {
      id: 'home-cook',
      title: 'Home Cook',
      description: 'Verified cooks for hygienic, home-style meals',
      imageSource: cookImage,
      iconColor: cleaningHelpColors.iconColor,
      bgColor: cleaningHelpColors.bgColor,
      accentColor: cleaningHelpColors.accentColor
    },
    {
      id: 'cleaning-help',
      title: 'Cleaning Help',
      description: 'Trained maids for thorough home cleaning',
      imageSource: maidImage,
      iconColor: cleaningHelpColors.iconColor,
      bgColor: cleaningHelpColors.bgColor,
      accentColor: cleaningHelpColors.accentColor
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      description: 'Compassionate caregivers for children & elderly',
      imageSource: nannyImage,
      iconColor: cleaningHelpColors.iconColor,
      bgColor: cleaningHelpColors.bgColor,
      accentColor: cleaningHelpColors.accentColor
    },
  ];

  return (
    <>
      {/* Services Dialog */}
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            { maxWidth: 900, width: screenWidth > 900 ? '80%' : '95%' }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                  Select Your Service
                </Text>

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    isMobile && styles.closeButtonMobile
                  ]}
                  onPress={onClose}
                >
                  <Icon
                    name="close"
                    size={isMobile ? 20 : 24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content}>
              <View style={styles.servicesGrid}>
                {serviceOptions.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      { borderLeftColor: service.accentColor }
                    ]}
                    onPress={() => handleServiceSelect(service.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      {/* Circular Image Container */}
                      <View style={styles.imageContainer}>
                        <View style={[
                          styles.circleImageWrapper,
                          { backgroundColor: alpha(service.accentColor, 0.2) }
                        ]}>
                          <Image
                            source={service.imageSource}
                            style={styles.serviceImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay} />
                        </View>
                      </View>

                      {/* Title and Description */}
                      <View style={styles.textContainer}>
                        <Text style={styles.serviceTitle}>
                          {service.title}
                        </Text>
                        
                        <Text style={styles.serviceDescription}>
                          {service.description}
                        </Text>
                      </View>

                      {/* Select Service Button */}
                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          { backgroundColor: service.accentColor }
                        ]}
                        onPress={(e) => {
                          // Prevent card click from also triggering
                          e.stopPropagation();
                          handleServiceSelect(service.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.buttonText}>
                          Select Service
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Dialog - SIMILAR TO HOMEPAGE */}
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false);
          // Reset states when closing
          setSelectedOption("Date");
          setStartDate(null);
          setEndDate(null);
          setStartTime(null);
          setEndTime(null);
        }}
        onSave={handleBookingSave}
        selectedOption={selectedOption}
        onOptionChange={handleOptionChange}
        startDate={startDate}
        endDate={endDate}
        startTime={startTime}
        endTime={endTime}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
      />

      {/* Service Dialogs - SIMILAR TO HOMEPAGE */}
      {showCookDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <CookServicesDialog
              open={showCookDialog}
              handleClose={() => {
                setShowCookDialog(false);
                if (sendDataToParent) {
                  sendDataToParent('DETAILS');
                }
              }}
              sendDataToParent={sendDataToParent}
              bookingType={{
                start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                start_time: startTime ? startTime.format("HH:mm") : "",
                end_date: endDate
                  ? new Date(endDate).toISOString().split("T")[0]
                  : startDate
                  ? new Date(startDate).toISOString().split("T")[0]
                  : "",
                end_time: endTime ? endTime.format("HH:mm") : "",
                timeRange:
                  startTime && endTime
                    ? `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    : startTime
                    ? startTime.format("HH:mm")
                    : "",
                bookingPreference: selectedOption,
                housekeepingRole: selectedType,
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
              handleClose={() => {
                setShowNannyServicesDialog(false);
                if (sendDataToParent) {
                  sendDataToParent('DETAILS');
                }
              }}
              sendDataToParent={sendDataToParent}
              bookingType={{
                start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                start_time: startTime ? startTime.format("HH:mm") : "",
                end_date: endDate
                  ? new Date(endDate).toISOString().split("T")[0]
                  : startDate
                  ? new Date(startDate).toISOString().split("T")[0]
                  : "",
                end_time: endTime ? endTime.format("HH:mm") : "",
                timeRange:
                  startTime && endTime
                    ? `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    : startTime
                    ? startTime.format("HH:mm")
                    : "",
                bookingPreference: selectedOption,
                housekeepingRole: selectedType,
              }}
            />
          </View>
        </View>
      )}

      {showMaidServiceDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <MaidServiceDialog
              open={showMaidServiceDialog}
              handleClose={() => {
                setShowMaidServiceDialog(false);
                if (sendDataToParent) {
                  sendDataToParent('DETAILS');
                }
              }}
              sendDataToParent={sendDataToParent}
              bookingType={{
                start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                start_time: startTime ? startTime.format("HH:mm") : "",
                end_date: endDate
                  ? new Date(endDate).toISOString().split("T")[0]
                  : startDate
                  ? new Date(startDate).toISOString().split("T")[0]
                  : "",
                end_time: endTime ? endTime.format("HH:mm") : "",
                timeRange:
                  startTime && endTime
                    ? `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    : startTime
                    ? startTime.format("HH:mm")
                    : "",
                bookingPreference: selectedOption,
                housekeepingRole: selectedType,
              }}
            />
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    backgroundColor: 'rgb(14, 48, 92)',
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    opacity: 0.9,
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 1300,
  },
  closeButtonMobile: {
    width: 32,
    height: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  servicesGrid: {
    marginTop: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 20,
  },
  circleImageWrapper: {
    borderRadius: 70,
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(47, 179, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#2FB3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    backgroundColor: 'rgba(47, 179, 255, 0.1)',
  },
  textContainer: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  serviceTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: 'rgba(21, 57, 104, 1)',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19.5,
    textAlign: 'center',
  },
  selectButton: {
    marginTop: 'auto',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
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

// Helper function for alpha colors - move this outside component
const alpha = (color: string, opacity: number) => {
  if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g);
    if (rgb) {
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
    }
  }
  return color;
};

export default ServicesDialog;