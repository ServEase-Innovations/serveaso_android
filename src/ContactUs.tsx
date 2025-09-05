import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Mail, Phone, MapPin, CheckCircle, X } from 'lucide-react-native';

const ContactUs = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:contact.serveaso@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+917648999213');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Cross button (top-right corner) */}
      <TouchableOpacity style={styles.closeButton}>
        <X size={Platform.OS === 'ios' ? 28 : 24} color="#374151" />
      </TouchableOpacity>

      {/* Heading */}
      <View style={styles.headingContainer}>
        <Text style={styles.subHeading}>CONTACT US</Text>
        <Text style={styles.mainHeading}>Get in touch with us</Text>
        <Text style={styles.description}>
          Fill out the form below or schedule a meeting with us at your
          convenience.
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Left: Form */}
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your message"
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.termsText}>
                I agree with{' '}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Send Your Request</Text>
            </TouchableOpacity>
          </View>

          {/* Contact info bottom */}
          <View style={styles.contactInfo}>
            <Text style={styles.contactInfoText}>
              You can also Contact Us via
            </Text>
            <View style={styles.contactMethods}>
              <TouchableOpacity 
                style={styles.contactMethod} 
                onPress={handleEmailPress}
              >
                <Mail size={20} color="#374151" />
                <Text style={styles.contactText}>contact.serveaso@gmail.com</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactMethod} 
                onPress={handlePhonePress}
              >
                <Phone size={20} color="#374151" />
                <Text style={styles.contactText}>+91 7648999213</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right: Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoHeading}>With our services you can</Text>
          <View style={styles.benefitsList}>
            {[
              'Improve usability of your product',
              'Engage users at a higher level and outperform your competition',
              'Reduce the onboarding time and improve sales',
              'Balance user needs with your business goal',
            ].map((item, index) => (
              <View key={index} style={styles.benefitItem}>
                <CheckCircle size={20} color="#374151" style={styles.checkIcon} />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Locations */}
          <View style={styles.locations}>
            <View style={styles.location}>
              <MapPin size={20} color="#374151" />
              <Text style={styles.locationTitle}>USA</Text>
              <Text style={styles.locationText}>280 W, 17th street</Text>
              <Text style={styles.locationText}>4th floor, Flat no: 407</Text>
              <Text style={styles.locationText}>New York NY, 10018</Text>
            </View>
            <View style={styles.location}>
              <MapPin size={20} color="#374151" />
              <Text style={styles.locationTitle}>India</Text>
              <Text style={styles.locationText}>Plot No 8-2-601/p/15ms</Text>
              <Text style={styles.locationText}>Banjara Hills, Road No 10</Text>
              <Text style={styles.locationText}>Hyderabad, 500034</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Copyright */}
      <View style={styles.footer}>
        <Text style={styles.copyrightText}>
          ©2025 <Text style={styles.bold}>ServEaso</Text>. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6f0ff',
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 300,
  },
  content: {
    flexDirection: 'column',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#4B5563',
  },
  termsLink: {
    color: '#111827',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  contactMethods: {
    flexDirection: 'column',
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  locations: {
    flexDirection: 'column',
  },
  location: {
    marginBottom: 24,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#4B5563',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#4B5563',
  },
  bold: {
    fontWeight: '600',
  },
});

export default ContactUs;