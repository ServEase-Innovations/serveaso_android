// AddReviewDialog.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Star, CheckCircle } from 'lucide-react-native';
import { useAuth0 } from 'react-native-auth0';
import axiosInstance from './axiosInstance';

interface AddReviewDialogProps {
   visible: boolean; // Changed from 'open' to 'visible'
  onClose: () => void;
  booking: any;
  onReviewSubmitted: (bookingId: number) => void;
}

const AddReviewDialog: React.FC<AddReviewDialogProps> = ({
  visible,
  onClose,
  booking,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: auth0User } = useAuth0();

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    if (!booking || !auth0User) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    if (!booking.serviceProviderId) {
      Alert.alert('Error', 'Service provider information is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: auth0User.customerid,
        serviceProviderId: booking.serviceProviderId,
        rating: rating,
        comment: review.trim() || 'No comment provided',
      };

      await axiosInstance.post('/api/customer/add-feedback', payload);
      
      onReviewSubmitted(booking.id);
      
      Alert.alert('Success', 'Review submitted successfully!');
      
      setTimeout(() => {
        setRating(0);
        setReview('');
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => !isSubmitting && setRating(star)}
        disabled={isSubmitting}
      >
        <Star
          size={32}
          color={rating >= star ? '#fbbf24' : '#d1d5db'}
          fill={rating >= star ? '#fbbf24' : 'transparent'}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Review</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.closeButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Service Information */}
            {booking && (
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceText}>
                  Reviewing service:{' '}
                  {booking.serviceType
                    ? booking.serviceType.charAt(0).toUpperCase() +
                      booking.serviceType.slice(1)
                    : 'Unknown Service'}
                </Text>
                <Text style={styles.providerText}>
                  Provider: {booking.serviceProviderName || 'Not specified'}
                </Text>
              </View>
            )}

            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.label}>
                How would you rate this service? *
              </Text>
              <View style={styles.starsContainer}>{renderStars()}</View>
            </View>

            {/* Review Input */}
            <View style={styles.reviewSection}>
              <Text style={styles.label}>Your review (optional)</Text>
              <TextInput
                value={review}
                onChangeText={setReview}
                style={styles.textInput}
                placeholder="Share your experience with this service..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={6}
                editable={!isSubmitting}
                textAlignVertical="top"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!rating || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!rating || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    padding: 16,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  serviceInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  providerText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  ratingSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default AddReviewDialog;