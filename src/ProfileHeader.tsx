/* eslint-disable */
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Badge, Avatar } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "./store/userStore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type UserState = {
  value?: {
    role?: string;
    serviceProviderDetails?: any;
  } | null;
};

interface ProfileHeaderProps {
  selectedTab: number;
  handleTabChange: (newValue: number) => void;
  bookingsCount: number;
  confirmedCount: number;
  pendingCount: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  selectedTab,
  handleTabChange,
  bookingsCount,
  confirmedCount,
  pendingCount
}) => { 
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 600;
  const user = useSelector((state: RootState) => state.user as UserState);
  const firstName = user?.value?.serviceProviderDetails?.firstName;
  const lastName = user?.value?.serviceProviderDetails?.lastName;

  const renderIconWithBadge = (iconName: string, count: number, color: string) => {
    return (
      <View style={styles.iconContainer}>
        {count > 0 && (
          <Badge style={[styles.badge, { backgroundColor: color }]}>
            {count}
          </Badge>
        )}
        <MaterialCommunityIcons 
          name={iconName} 
          size={20} 
          color={color} 
          style={styles.icon}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.profileInfo}>
          <Avatar.Icon 
            size={isMobile ? 40 : 48}
            icon={() => (
              <MaterialCommunityIcons 
                name="account-circle" 
                size={24} 
                color="white"
              />
            )}
            style={styles.avatar}
          />
          
          <View style={styles.nameAndIcons}>
            <Text style={styles.nameText}>
              {`${firstName} ${lastName}`}
            </Text>
            
            <View style={styles.iconsContainer}>
              <TouchableOpacity>
                {renderIconWithBadge('calendar', bookingsCount, '#1976d2')}
              </TouchableOpacity>

              <TouchableOpacity>
                {renderIconWithBadge('check-circle', confirmedCount, '#388e3c')}
              </TouchableOpacity>

              <TouchableOpacity>
                {renderIconWithBadge('alert-circle', pendingCount, '#f57c00')}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {['Profile', 'Service Recap', 'Attendance', 'Earnings'].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === index && styles.selectedTab
              ]}
              onPress={() => handleTabChange(index)}
            >
              <Text style={styles.tabText}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 20,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'column',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#0056b3',
    marginRight: 8,
  },
  nameAndIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 12,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 4,
  },
  selectedTab: {
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#0056b3',
  },
  tabText: {
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 14,
    color: '#333',
  },
});

export default ProfileHeader;