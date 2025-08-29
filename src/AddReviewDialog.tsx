import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';

type AddReviewDialogProps = {
  open: boolean;
  onClose: () => void;
  booking?: any; // Replace 'any' with a more specific type if available
};

const AddReviewDialog: React.FC<AddReviewDialogProps> = ({ open, onClose, booking }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    // Hardcoded API call simulation
    console.log('Review submitted:', { rating, review });
    onClose();
  };

  type StarProps = {
    filled: boolean;
    onPress: () => void;
  };

  const Star: React.FC<StarProps> = ({ filled, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.star, filled && styles.starFilled]}>
        {filled ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  );

  type ButtonProps = {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'outline';
  };

  const Button: React.FC<ButtonProps> = ({ children, onPress, variant = 'primary' }) => (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.outlineButton,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryButtonText : styles.outlineButtonText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Review</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Star Rating */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                filled={rating >= star}
                onPress={() => setRating(star)}
              />
            ))}
          </View>

          {/* Review Input */}
          <TextInput
            value={review}
            onChangeText={setReview}
            style={styles.textInput}
            placeholder="Write your review..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button variant="outline" onPress={onClose}>
              Cancel
            </Button>
            <Button onPress={handleSubmit}>
              Submit
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
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
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  star: {
    fontSize: 24,
    color: '#d1d5db',
  },
  starFilled: {
    color: '#fbbf24',
  },
  textInput: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: 'white',
  },
  outlineButtonText: {
    color: '#374151',
  },
});

export default AddReviewDialog;