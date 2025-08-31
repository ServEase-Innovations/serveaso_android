import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

const Footer = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const makePhoneCall = () => {
    Linking.openURL('tel:+919876543210').catch(err => console.error("Couldn't make phone call", err));
  };

  return (
    <LinearGradient
      colors={[
        'rgba(255, 255, 255, 1)',       // White at the top
        'rgba(213, 229, 233, 0.8)',     // Lighter blue
        'rgba(139, 187, 221, 0.8)',     // Blue tone at the bottom
      ]}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.gradientContainer}
    >
      <View style={styles.footer}>
        {/* Left side - Logo and Brand Info */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            {/* Logo Image */}
            <Image 
              source={require('../assets/images/Final1.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandSubtitle}>ServEase Innovations</Text>
          </View>
          
          <View style={styles.companyInfo}>
            <Text style={styles.infoText}>Est. 2024</Text>
          </View>
        </View>

        {/* Right side - Social Media Icons and Contact */}
        <View style={styles.rightSection}>
          {/* Contact Us Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Contact us:</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={makePhoneCall}
            >
              <FontAwesome name="phone" size={16} color="#0a3d62" style={styles.phoneIcon} />
              <Text style={styles.contactText}>Helpline: +91 98765 43210</Text>
            </TouchableOpacity>
          </View>

          {/* Follow Us Section */}
          <View style={styles.followSection}>
            <Text style={styles.followText}>Follow Us:</Text>
            <View style={styles.socialMedia}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => openLink('https://x.com/ServEaso')}
              >
                <View style={styles.xIconContainer}>
                  <Text style={styles.xIcon}>X</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => openLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
              >
                <Ionicons name="logo-instagram" size={20} color="#0a3d62" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => openLink('https://www.youtube.com/@ServEaso')}
              >
                <Ionicons name="logo-youtube" size={20} color="#0a3d62" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => openLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
              >
                <Ionicons name="logo-linkedin" size={20} color="#0a3d62" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852')}
              >
                <Ionicons name="logo-facebook" size={20} color="#0a3d62" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderTopWidth: 1,
    borderTopColor: '#a0c8ff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 25,
    paddingBottom: 30,
  },
  leftSection: {
    flex: 1,
    marginRight: 20,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 200,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
    backgroundColor: '#0a3d62',
    borderRadius: 12,
    padding: 10,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
    marginLeft: 0, // Align text to start with logo
    textAlign: 'left',
  },
  companyInfo: {
    marginTop: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#0a3d62',
    marginBottom: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  contactSection: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
    marginBottom: 8,
    textAlign: 'right',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a3d62',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  phoneIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a3d62',
  },
  followSection: {
    alignItems: 'flex-end',
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
    marginBottom: 12,
    textAlign: 'right',
  },
  socialMedia: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  iconButton: {
    padding: 10,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#0a3d62',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  xIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a3d62',
  },
});

export default Footer;