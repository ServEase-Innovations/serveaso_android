import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Linking,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface AboutPageProps {
  visible: boolean;
  onClose: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ visible, onClose }) => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={aboutStyles.modalContainer}>
        <View style={aboutStyles.modalContent}>
          {/* Back Button */}
          <TouchableOpacity 
            style={aboutStyles.backButton}
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
            <Text style={aboutStyles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
          
          <ScrollView style={aboutStyles.container}>
            {/* Hero Section */}
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?fit=crop&w=1600&q=80' }}
              style={aboutStyles.heroImage}
              resizeMode="cover"
            >
              <View style={aboutStyles.heroOverlay}>
                <Text style={aboutStyles.heroTitle}>About Us</Text>
                <Text style={aboutStyles.heroText}>
                  We are <Text style={aboutStyles.bold}>ServEaso</Text> – a house helps service provider.
                  "ServEaso" collectively means "Service Made Easy" or "Easy Services."
                  We simplify the process of connecting customers who need home
                  services with reliable and verified professionals.
                </Text>
              </View>
            </ImageBackground>

            {/* Our Story */}
            <View style={aboutStyles.storyContainer}>
              <Text style={aboutStyles.sectionTitle}>Our Story</Text>
              <View style={aboutStyles.storyContent}>
                <Text style={aboutStyles.paragraph}>
                  ServEaso provides trained and verified house helps to simplify the
                  lives of individuals and families who struggle to balance their
                  professional commitments with household responsibilities.
                </Text>
                <Text style={aboutStyles.paragraph}>
                  ServEaso offers a convenient and reliable solution for those in need
                  of house care services, ensuring peace of mind and quality care for
                  customers.
                </Text>
                <Text style={aboutStyles.subtitle}>Challenges We Solve</Text>
                {[
                  "High Turnover: Difficulty in retaining house helps due to factors like demanding work conditions, low wages, or lack of work-life balance.",
                  "Skills Gap: Lack of necessary skills or training for specific tasks, leading to subpar performance or safety concerns.",
                  "Communication Barriers: Language or cultural differences hindering effective communication.",
                  "Trust and Security: Concerns about theft, privacy violations, or family safety.",
                  "Dependence and Entitlement: Overreliance on employers, reducing household independence.",
                  "Lack of Legal Protection: Exploitation due to unclear legal frameworks or poor enforcement.",
                  "Social Isolation: Loneliness from living away from families and communities.",
                  "Employer-Maid Relationship Dynamics: Difficulty in building respectful, trust-based relationships.",
                  "Limited Access to Healthcare: Lack of affordable healthcare or insurance coverage.",
                  "Lack of Standardized Practices: No clear guidelines for hiring, training, and managing domestic workers."
                ].map((item, index) => (
                  <View key={index} style={aboutStyles.listItem}>
                    <Text style={aboutStyles.bullet}>•</Text>
                    <Text style={aboutStyles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const aboutStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContent: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroImage: {
    height: 300,
    justifyContent: 'center',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  heroText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
  },
  storyContainer: {
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2937',
  },
  storyContent: {
    width: '100%',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    color: '#1f2937',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    marginRight: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
  },
});

export default AboutPage;