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

const teamMembers = [
  {
    id: '1',
    name: "David Kivitz",
    role: "CEO",
    image: "https://via.placeholder.com/100",
    desc: "As head of the company, my job is to ensure everyone",
  },
  {
    id: '2',
    name: "Antony Radbod",
    role: "CFO",
    image: "https://via.placeholder.com/100",
    desc: "As head of the company, my job is to ensure everyone",
  },
  {
    id: '3',
    name: "Justin Vuong",
    role: "CIO",
    image: "https://via.placeholder.com/100",
    desc: "As head of the company, my job is to ensure everyone",
  },
  {
    id: '4',
    name: "Jim Bates",
    role: "Director of Credit & Risk",
    image: "https://via.placeholder.com/100",
    desc: "As head of the company, my job is to ensure everyone",
  },
];

const faqData = [
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

const AboutPage: React.FC<AboutPageProps> = ({ visible, onClose }) => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const renderTeamMember = ({ item }: { item: typeof teamMembers[0] }) => (
    <View style={aboutStyles.teamMemberCard}>
      <Image source={{ uri: item.image }} style={aboutStyles.teamMemberImage} />
      <Text style={aboutStyles.teamMemberName}>{item.name}</Text>
      <Text style={aboutStyles.teamMemberRole}>{item.role}</Text>
      <Text style={aboutStyles.teamMemberDesc}>{item.desc}</Text>
      <TouchableOpacity onPress={() => openLink('#!')}>
        <Text style={aboutStyles.readMore}>Read More</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openLink('#!')}>
        <Text style={aboutStyles.linkedIn}>LinkedIn</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFaqItem = ({ item }: { item: typeof faqData[0] }) => (
    <View style={aboutStyles.faqItem}>
      <Text style={aboutStyles.faqQuestion}>{item.question}</Text>
      <Text style={aboutStyles.faqAnswer}>{item.answer}</Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={aboutStyles.modalContainer}>
        <View style={aboutStyles.modalContent}>
          <TouchableOpacity 
            style={aboutStyles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#0a3d62" />
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

            {/* Mission Section */}
            <View style={aboutStyles.missionSection}>
              <View style={aboutStyles.missionContent}>
                <Text style={aboutStyles.sectionTitle}>Our Mission</Text>
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
            </View>

            {/* Team Section */}
            <View style={aboutStyles.teamSection}>
              <Text style={aboutStyles.sectionTitle}>Meet Our Team</Text>
              <FlatList
                data={teamMembers}
                renderItem={renderTeamMember}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={aboutStyles.teamGrid}
                scrollEnabled={false}
              />
            </View>

            {/* FAQ Section */}
            <View style={aboutStyles.faqSection}>
              <Text style={aboutStyles.sectionTitle}>Frequently Asked Questions</Text>
              <FlatList
                data={faqData}
                renderItem={renderFaqItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
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
  );
};

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
  missionSection: {
    padding: 24,
    backgroundColor: '#fef3c7',
  },
  missionContent: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  sectionText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 24,
  },
  teamSection: {
    padding: 24,
    backgroundColor: '#f97316',
  },
  teamGrid: {
    justifyContent: 'space-between',
  },
  teamMemberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: width > 768 ? '48%' : '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamMemberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1f2937',
  },
  teamMemberRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamMemberDesc: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  readMore: {
    color: '#2563eb',
    fontSize: 14,
    marginBottom: 4,
  },
  linkedIn: {
    color: '#2563eb',
    fontSize: 14,
  },
  faqSection: {
    padding: 24,
    backgroundColor: '#d6f0ff',
  },
  faqItem: {
    marginBottom: 16,
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerBold: {
    fontWeight: '600',
  },
});

export default AboutPage;