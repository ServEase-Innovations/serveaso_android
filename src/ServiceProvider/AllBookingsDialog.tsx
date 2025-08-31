/* eslint-disable */
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  TouchableWithoutFeedback
} from "react-native";
import { Calendar, MapPin, X } from "lucide-react-native";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "../common/BookingUtils";

interface Booking {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: string;
  amount: string;
  bookingData: any;
}

interface AllBookingsDialogProps {
  bookings: Booking[];
  trigger: React.ReactNode;
   visible: boolean;
   onClose: () => void;
    onContactClient: (booking: any) => void;
}

export function AllBookingsDialog({ bookings, trigger, visible, onClose , onContactClient}: AllBookingsDialogProps) {
  const [open, setOpen] = useState(false);

  const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "success":
          return styles.badgeSuccess;
        case "warning":
          return styles.badgeWarning;
        case "destructive":
          return styles.badgeDestructive;
        case "secondary":
          return styles.badgeSecondary;
        default:
          return styles.badgeDefault;
      }
    };

    return (
      <View style={[styles.badge, getVariantStyle()]}>
        <Text style={styles.badgeText}>{children}</Text>
      </View>
    );
  };

  const Button = ({ 
    children, 
    variant = "default", 
    size = "md", 
    onPress,
    className 
  }: { 
    children: React.ReactNode; 
    variant?: string;
    size?: string;
    onPress?: () => void;
    className?: string;
  }) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "outline":
          return styles.buttonOutline;
        case "secondary":
          return styles.buttonSecondary;
        case "ghost":
          return styles.buttonGhost;
        default:
          return styles.buttonDefault;
      }
    };

    const getSizeStyle = () => {
      switch (size) {
        case "sm":
          return styles.buttonSm;
        case "lg":
          return styles.buttonLg;
        default:
          return styles.buttonMd;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.button, getVariantStyle(), getSizeStyle()]}
        onPress={onPress}
      >
        <Text style={[
          styles.buttonText,
          variant === "outline" && styles.buttonOutlineText,
          variant === "secondary" && styles.buttonSecondaryText
        ]}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Trigger */}
      <TouchableWithoutFeedback onPress={() => setOpen(true)}>
        <View>{trigger}</View>
      </TouchableWithoutFeedback>

      <Modal
        visible={open}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom header with close button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                All Bookings ({bookings.length})
              </Text>
              <TouchableOpacity 
                onPress={() => setOpen(false)}
                style={styles.closeButton}
                aria-label="Close"
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {bookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No bookings found.</Text>
                </View>
              ) : (
                <View style={styles.bookingsContainer}>
                  {bookings.map((booking) => (
                    <View key={booking.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <Text style={styles.cardTitle}>
                            {booking.clientName}
                          </Text>
                          <Text style={styles.serviceText}>
                            {getServiceTitle(booking.service)}
                          </Text>
                        </View>
                        <View style={styles.badgesContainer}>
                          {getBookingTypeBadge(booking.bookingData.bookingType)}
                          {getStatusBadge(booking.bookingData.taskStatus)}
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.infoGrid}>
                          <View style={styles.infoRow}>
                            <Calendar size={16} color="#9ca3af" />
                            <Text style={styles.infoText}>
                              {booking.date} at {booking.time}
                            </Text>
                          </View>
                          <Text style={styles.amountText}>
                            {booking.amount}
                          </Text>
                        </View>

                        <View style={styles.locationRow}>
                          <MapPin size={16} color="#9ca3af" />
                          <Text style={styles.locationText}>
                            {booking.location}
                          </Text>
                        </View>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onPress={() => {}}
                        >
                          Contact Client
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  modalBody: {
    padding: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  bookingsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  badgeDefault: {
    backgroundColor: '#3b82f6',
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b',
  },
  badgeDestructive: {
    backgroundColor: '#ef4444',
  },
  badgeSecondary: {
    backgroundColor: '#6b7280',
  },
  // Button styles
  button: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMd: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonDefault: {
    backgroundColor: '#3b82f6',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: '#374151',
  },
  buttonSecondaryText: {
    color: 'white',
  },
});