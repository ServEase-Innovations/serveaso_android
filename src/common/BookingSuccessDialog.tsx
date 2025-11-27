// BookingSuccessDialog.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Types
interface BookingDetails {
  providerName?: string;
  serviceType?: string;
  totalAmount?: number;
  bookingDate?: string;
  persons?: number;
}

interface BookingSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  bookingDetails?: BookingDetails;
  message?: string;
  onRedirectToBookings?: () => void;
  onNavigateToBookings?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BookingSuccessDialog: React.FC<BookingSuccessDialogProps> = ({
  open,
  onClose,
  bookingDetails,
  message = "Payment verified and completed successfully",
  onRedirectToBookings,
  onNavigateToBookings
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (open) {
      startAnimations();

      const closeTimer = setTimeout(() => {
        handleAutoClose();
      }, 6500);

      return () => {
        clearTimeout(closeTimer);
      };
    } else {
      resetAnimations();
    }
  }, [open]);

  const startAnimations = () => {
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    bounceAnim.setValue(0);
    pulseAnim.setValue(1);
    countdownAnim.setValue(1);

    // Fade in with scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Bounce animation for icon
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: -4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for celebration icons
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Countdown animation
    Animated.timing(countdownAnim, {
      toValue: 0,
      duration: 6500,
      useNativeDriver: false,
    }).start();
  };

  const resetAnimations = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    bounceAnim.setValue(0);
    pulseAnim.setValue(1);
    countdownAnim.setValue(1);
  };

  const handleAutoClose = () => {
    if (onNavigateToBookings) {
      onNavigateToBookings();
    } else if (onRedirectToBookings) {
      onRedirectToBookings();
    }
    onClose();
  };

  const handleViewBookings = () => {
    if (onNavigateToBookings) {
      onNavigateToBookings();
    } else if (onRedirectToBookings) {
      onRedirectToBookings();
    }
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const countdownWidth = countdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const containerAnimatedStyle = {
    opacity: fadeAnim,
    transform: [
      { scale: scaleAnim },
      { translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 0],
      })},
    ],
  };

  const iconAnimatedStyle = {
    transform: [{ translateY: bounceAnim }],
  };

  const celebrationAnimatedStyle = {
    transform: [{ scale: pulseAnim }],
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={handleViewBookings}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.dialogContainer, containerAnimatedStyle]}>
          {/* Countdown Bar */}
          <View style={styles.countdownTrack}>
            <Animated.View 
              style={[
                styles.countdownBar,
                { width: countdownWidth }
              ]} 
            />
          </View>
          
          {/* Celebration Icons */}
          <Animated.View style={[styles.celebrationIcon, styles.celebrationTopLeft, celebrationAnimatedStyle]}>
            <Icon name="celebration" size={24} color="#FFD700" />
          </Animated.View>
          <Animated.View style={[styles.celebrationIcon, styles.celebrationTopRight, celebrationAnimatedStyle]}>
            <Icon name="celebration" size={24} color="#FF6B6B" />
          </Animated.View>
          <Animated.View style={[styles.celebrationIcon, styles.celebrationBottomLeft, celebrationAnimatedStyle]}>
            <Icon name="celebration" size={24} color="#4ECDC4" />
          </Animated.View>
          <Animated.View style={[styles.celebrationIcon, styles.celebrationBottomRight, celebrationAnimatedStyle]}>
            <Icon name="celebration" size={24} color="#FFA500" />
          </Animated.View>
          
          {/* Content */}
          <View style={styles.content}>
            {/* Success Icon */}
            <Animated.View style={[styles.successIconContainer, iconAnimatedStyle]}>
              <View style={styles.successIconBackground}>
                <Icon name="check-circle" size={60} color="#4CAF50" />
              </View>
            </Animated.View>
            
            {/* Title */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
            </Animated.View>
            
            {/* Message */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.successMessage}>{message}</Text>
            </Animated.View>
            
            {/* Booking Details */}
            {bookingDetails && (
              <Animated.View style={[styles.detailBox, { opacity: fadeAnim }]}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service Provider:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.providerName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service Type:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.serviceType}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Persons:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.persons}
                  </Text>
                </View>
                
                {bookingDetails.bookingDate && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Booking Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(bookingDetails.bookingDate)}
                    </Text>
                  </View>
                )}
                
                <View style={[styles.detailItem, styles.lastDetailItem]}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.amountValue}>
                    ₹{bookingDetails.totalAmount?.toFixed(2)}
                  </Text>
                </View>
              </Animated.View>
            )}
            
            {/* Email Note */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.emailNote}>
                You will receive a confirmation email shortly
              </Text>
            </Animated.View>
            
            {/* Redirect Message */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.redirectMessage}>
                Redirecting to bookings page in a few seconds...
              </Text>
            </Animated.View>
            
            {/* Manual Close Button */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleViewBookings}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>View My Bookings</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#667eea',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  countdownTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countdownBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  celebrationIcon: {
    position: 'absolute',
    opacity: 0.7,
  },
  celebrationTopLeft: {
    top: 12,
    left: 12,
  },
  celebrationTopRight: {
    top: 12,
    right: 12,
  },
  celebrationBottomLeft: {
    bottom: 12,
    left: 12,
  },
  celebrationBottomRight: {
    bottom: 12,
    right: 12,
  },
  successIconContainer: {
    marginBottom: 12,
  },
  successIconBackground: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  successMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.95,
    fontWeight: '500',
    lineHeight: 20,
  },
  detailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastDetailItem: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
    flex: 1,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emailNote: {
    fontSize: 13,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  redirectMessage: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
    width: '100%',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  continueButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BookingSuccessDialog;