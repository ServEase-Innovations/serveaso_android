import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Modal, ScrollView, Dimensions, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Type definitions
interface TeamMember {
  id: string;
  name: string;
  image: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const Footer = () => {
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const makePhoneCall = () => {
    Linking.openURL('tel:+919876543210').catch(err => console.error("Couldn't make phone call", err));
  };

  // AboutPage content (copied from your AboutPage component)
  const teamMembers: TeamMember[] = [
    { id: '1', name: 'John', image: 'https://i.pravatar.cc/100?img=1' },
    { id: '2', name: 'Sara', image: 'https://i.pravatar.cc/100?img=2' },
    { id: '3', name: 'Kenio', image: 'https://i.pravatar.cc/100?img=3' },
    { id: '4', name: 'Miguel', image: 'https://i.pravatar.cc/100?img=4' },
    { id: '5', name: 'Sierra', image: 'https://i.pravatar.cc/100?img=5' },
    { id: '6', name: 'Evelyn', image: 'https://i.pravatar.cc/100?img=6' },
  ];

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I book a service?',
      answer: 'Simply sign up, choose the service you need, and schedule at your convenience.'
    },
    {
      id: '2',
      question: 'Are the providers verified?',
      answer: 'Yes, all our service providers go through strict verification and background checks.'
    },
    {
      id: '3',
      question: 'Do you offer support?',
      answer: 'Yes, we provide customer support for all bookings to ensure a smooth experience.'
    },
    {
      id: '4',
      question: 'Where are you located?',
      answer: 'We currently serve customers in India and USA with plans to expand further.'
    }
  ];

 const renderTeamMember = ({ item }: { item: TeamMember }) => (
  <View style={aboutStyles.teamMemberCard}>
    <Image source={{ uri: item.image }} style={aboutStyles.teamMemberImage} />
    <Text style={aboutStyles.teamMemberName}>{item.name}</Text>
  </View>
);

const renderFaqItem = ({ item }: { item: FAQItem }) => (
  <View style={aboutStyles.faqItem}>
    <Text style={aboutStyles.faqQuestion}>{item.question}</Text>
    <Text style={aboutStyles.faqAnswer}>{item.answer}</Text>
  </View>
);

  return (
    <>
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
              {/* About Button */}
              <TouchableOpacity 
                style={styles.aboutButton}
                onPress={() => setAboutModalVisible(true)}
              >
                <Text style={styles.aboutButtonText}>About Us</Text>
              </TouchableOpacity>
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
                <Text style={styles.contactText}>Helpline: +91 87928 27744</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={makePhoneCall}
              >
                <FontAwesome name="phone" size={16} color="#0a3d62" style={styles.phoneIcon} />
                <Text style={styles.contactText}>Join Us: +91 87928 27754</Text>
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

      {/* About Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={aboutStyles.modalContainer}>
          <View style={aboutStyles.modalContent}>
            <TouchableOpacity 
              style={aboutStyles.closeButton}
              onPress={() => setAboutModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#0a3d62" />
            </TouchableOpacity>
            
            <ScrollView style={aboutStyles.container}>
              {/* Hero Section */}
              <View style={aboutStyles.heroSection}>
                <Text style={aboutStyles.heroTitle}>
                  We're making a difference{'\n'}to people's lives
                </Text>
                <Text style={aboutStyles.heroSubtitle}>
                  Providing trusted service providers like cleaners, cooks, and nannies
                  to make life easier and stress-free for families and businesses.
                </Text>
                <View style={aboutStyles.heroImageContainer}>
                  <Image
                    source={{ uri: 'workers.png' }} // replace with your image
                    style={aboutStyles.heroImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Mission Section */}
              <View style={aboutStyles.missionSection}>
                <View style={aboutStyles.missionContent}>
                  <Text style={aboutStyles.sectionTitle}>Our mission</Text>
                  <Text style={aboutStyles.sectionText}>
                    Our mission is to connect families and businesses with trusted and
                    skilled service providers. Whether it's home cleaning, cooking, or
                    childcare, we aim to make everyday life smoother.
                  </Text>
                  <Text style={aboutStyles.sectionText}>
                    We believe in professionalism, reliability, and making life stress-free
                    for our clients.
                  </Text>
                </View>
                <View style={aboutStyles.missionImageContainer}>
                  <Image
                    source={{ uri: 'mission.jpg' }} // replace with your image
                    style={aboutStyles.missionImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Who We Are Section */}
              <View style={aboutStyles.whoWeAreSection}>
                <View style={aboutStyles.whoWeAreContent}>
                  <Text style={aboutStyles.sectionTitle}>Who we are & how we arrived here</Text>
                  <Text style={aboutStyles.sectionText}>
                    Founded in 2025, ServEaso was built to make everyday life easier for
                    families and businesses. We realized how difficult it was for people
                    to find trusted and reliable service providers.
                  </Text>
                  <Text style={aboutStyles.sectionText}>
                    Our platform connects skilled professionals with those who need them,
                    offering reliable, affordable, and timely services.
                  </Text>
                  <Text style={aboutStyles.sectionText}>
                    Today, we are proud to serve hundreds of families and businesses while
                    expanding our team of professionals every day.
                  </Text>
                </View>
              </View>

              {/* Team Section */}
              <View style={aboutStyles.teamSection}>
                <Text style={aboutStyles.teamTitle}>We're here, there, everywhere</Text>
                <FlatList
                  data={teamMembers}
                  renderItem={renderTeamMember}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={aboutStyles.teamList}
                />
              </View>

              {/* FAQ Section */}
              <View style={aboutStyles.faqSection}>
                <Text style={aboutStyles.faqTitle}>Got any questions? We have got answers.</Text>
                <FlatList
                  data={faqData}
                  renderItem={renderFaqItem}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  columnWrapperStyle={aboutStyles.faqColumnWrapper}
                  scrollEnabled={false}
                />
              </View>

              {/* Call to Action */}
              <View style={aboutStyles.ctaSection}>
                <Text style={aboutStyles.ctaTitle}>Become a ServEaso member like you want!</Text>
                <Text style={aboutStyles.ctaText}>
                  Join our growing community of satisfied customers and trusted
                  professionals. Sign up today to experience stress-free services at your
                  convenience.
                </Text>
                <TouchableOpacity style={aboutStyles.ctaButton}>
                  <Text style={aboutStyles.ctaButtonText}>Join Now</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={aboutStyles.footer}>
                <Text style={aboutStyles.footerText}>
                  ©2025 <Text style={aboutStyles.footerBold}>ServEaso</Text>. All rights reserved.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    padding: 15,
    paddingBottom: 10,
    // height:250,
     minHeight: 250, // Use minHeight instead of fixed height
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
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: '#0a3d62',
    // marginBottom: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  aboutButton: {
    
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a3d62',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  aboutButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a3d62',
    textAlign: 'center',
    
  },
  contactSection: {
    marginBottom: 20,
    alignItems: 'flex-start',
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
    alignItems: 'flex-start',
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
    marginBottom: 12,
    textAlign: 'right',
    paddingLeft: 12,
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

// About page styles
const aboutStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: '90%',
    height: '90%',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    backgroundColor: '#d6f0ff',
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1f2937',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
    maxWidth: 400,
  },
  heroImageContainer: {
    width: '100%',
    maxWidth: 400,
  },
  heroImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  missionSection: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  missionContent: {
    flex: 1,
    minWidth: 300,
    marginRight: 16,
    marginBottom: 16,
  },
  missionImageContainer: {
    flex: 1,
    minWidth: 300,
  },
  missionImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  sectionText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 24,
  },
  whoWeAreSection: {
    backgroundColor: '#fef3c7',
    padding: 24,
  },
  whoWeAreContent: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  teamSection: {
    backgroundColor: '#f97316',
    padding: 24,
    alignItems: 'center',
  },
  teamTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  teamList: {
    paddingHorizontal: 16,
  },
  teamMemberCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    margin: 8,
    alignItems: 'center',
    width: 120,
  },
  teamMemberImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  faqSection: {
    padding: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1f2937',
  },
  faqColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  faqItem: {
    flex: 1,
    minWidth: width > 768 ? '48%' : '100%',
    marginBottom: 16,
    marginHorizontal: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#d6f0ff',
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1f2937',
  },
  ctaText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
    maxWidth: 400,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerBold: {
    fontWeight: '600',
  },
});

export default Footer;