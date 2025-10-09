import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Button, Divider, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ServiceFeature = {
  title?: string;
  items: string[];
};

type ServiceDetails = {
  title: string;
  description: string;
  features: ServiceFeature[];
  icon?: string;
};

interface ServiceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  serviceType: 'cook' | 'maid' | 'babycare' | null;
}

const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({
  open,
  onClose,
  serviceType,
}) => {
  const serviceData: Record<'cook' | 'maid' | 'babycare', ServiceDetails> = {
    maid: {
      title: 'ServEaso Maid Services',
      description: 'Professional cleaning and household services',
      icon: '🧹',
      features: [
        {
          title: 'Cleaning',
          items: [
            'Utensils cleaning',
            'Dusting',
            'Vacuuming',
            'Mopping',
            'Sweeping',
            'Cleaning bathrooms and kitchens',
          ],
        },
        {
          title: 'Laundry',
          items: [
            'Washing clothes',
            'Drying clothes',
            'Folding clothes',
            'Ironing clothes',
          ],
        },
        {
          title: 'Errands',
          items: [
            'Running errands for customers',
            'Picking up groceries',
            'Dry cleaning pickup/dropoff',
          ],
        },
        {
          items: [
            'Respectful of customer\'s property',
            'Punctual and reliable',
            'Professional and courteous',
            'Discreet and respectful of privacy',
          ],
        },
      ],
    },
    cook: {
      title: 'ServEaso Cook Services',
      description: 'Professional cooking services with strict standards',
      icon: '👩‍🍳',
      features: [
        {
          title: 'Hygiene',
          items: [
            'Adhere to strict hygiene standards',
            'Frequent handwashing',
            'Wear clean uniforms and hairnets',
            'Maintain spotless work environment',
          ],
        },
        {
          title: 'Temperature Control',
          items: [
            'Meticulously monitor food temperatures',
            'Prevent bacterial growth',
            'Ensure proper cooking, storage, and reheating',
          ],
        },
        {
          title: 'Allergen Awareness',
          items: [
            'Handle allergens carefully',
            'Prevent cross-contamination',
            'Provide accurate allergen information',
          ],
        },
        {
          title: 'Safe Food Handling',
          items: [
            'Follow proper procedures for raw and cooked foods',
            'Minimize contamination risk',
          ],
        },
        {
          title: 'Freshness',
          items: [
            'Use fresh, high-quality ingredients',
            'Select best produce, meats, and components',
          ],
        },
        {
          title: 'Proper Techniques',
          items: [
            'Employ proper cooking techniques',
            'Maximize flavor, texture, and nutritional value',
            'Ensure highest preparation standards',
          ],
        },
        {
          title: 'Attention to Detail',
          items: [
            'Pay close attention to every step',
            'From chopping vegetables to final plating',
            'Ensure consistency and visual appeal',
          ],
        },
        {
          title: 'Dietary Restrictions',
          items: [
            'Accommodate gluten-free needs',
            'Prepare vegetarian and vegan meals',
            'Tailor to specific allergies/intolerances',
          ],
        },
        {
          title: 'Customization',
          items: [
            'Adjust spice levels',
            'Modify ingredients',
            'Customize portion sizes',
          ],
        },
      ],
    },
    babycare: {
      title: 'ServEaso Caregiver Services',
      description: 'Professional care services',
      icon: '👶',
      features: [
        {
          title: 'Nurture and Safe Environment',
          items: [
            'Provide loving and supportive environment',
            'Children feel safe, secure, and understood',
            'Offer comfort and encouragement',
            'Build strong emotional connection',
          ],
        },
        {
          title: 'Physical Safety',
          items: [
            'Ensure hazard-free environment',
            'Supervise all activities',
            'Prepare for emergencies',
          ],
        },
        {
          title: 'Medical Safety',
          items: [
            'Trained in CPR',
            'First aid certified for medical emergencies',
          ],
        },
        {
          title: 'Cognitive Development',
          items: [
            'Engage in age-appropriate activities',
            'Reading and educational games',
            'Explore children\'s interests',
            'Help with homework',
            'Encourage learning',
          ],
        },
        {
          title: 'Social/Emotional Development',
          items: [
            'Teach sharing and empathy',
            'Conflict resolution skills',
            'Develop self-confidence',
            'Build emotional intelligence',
          ],
        },
        {
          title: 'Physical Development',
          items: [
            'Encourage physical activity',
            'Outdoor adventures',
            'Age-appropriate sports',
            'Prepare healthy meals and snacks',
          ],
        },
        {
          title: 'Communication',
          items: [
            'Maintain open communication with parents',
            'Share daily updates',
            'Discuss development progress',
            'Listen attentively to child',
            'Respond with empathy',
          ],
        },
        {
          title: 'Collaboration',
          items: [
            'Work in partnership with parents',
            'Ensure consistency in care',
            'Respect parents\' values',
            'Follow parenting styles',
          ],
        },
      ],
    },
  };

  if (!serviceType) return null;

  const { title, description, features, icon } = serviceData[serviceType];

  const renderFeatureItem = ({ item }: { item: string }) => (
    <List.Item
      title={item}
      left={() => <Icon name="check" size={20} color="#1976d2" />}
      titleStyle={styles.listItemText}
    />
  );

  const renderFeatureSection = (feature: ServiceFeature, index: number) => (
    <View key={index} style={styles.featureSection}>
      {feature.title && (
        <Text style={styles.featureTitle}>{feature.title}</Text>
      )}
      <FlatList
        data={feature.items}
        renderItem={renderFeatureItem}
        keyExtractor={(item, itemIndex) => itemIndex.toString()}
        scrollEnabled={false}
      />
      {index < features.length - 1 && (
        <Divider style={styles.divider} />
      )}
    </View>
  );

return (
    <Modal
      visible={open}
      onRequestClose={onClose}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Text style={styles.description}>{description}</Text>

            {features.map((feature, index) => (
              <View key={index} style={styles.featureSection}>
                {feature.title && (
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                )}
                {feature.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.featureItem}>
                    <Icon name="check" size={20} color="#1976d2" style={styles.checkIcon} />
                    <Text style={styles.featureText}>{item}</Text>
                  </View>
                ))}
                {index < features.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={onClose}
              style={styles.closeBtn}
              labelStyle={styles.closeBtnText}
            >
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  dialogContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '70%',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    color: '#333',
  },
  featureSection: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#e0e0e0',
    height: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    borderRadius: 6,
    backgroundColor: '#1976d2',
  },
  closeBtnText: {
    color: 'white',
    fontSize: 14,
  },
//    listItemText: {
//     fontSize: 14,
//   },
});

export default ServiceDetailsDialog;