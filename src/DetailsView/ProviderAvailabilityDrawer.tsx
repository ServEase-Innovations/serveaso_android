import React from 'react';
import {
  View,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import {
  Portal,
  Dialog,
  Card,
  Text,
  Chip,
  IconButton,
  Divider,
  List,
  PaperProvider,
  Button,
  Badge,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { ServiceProviderDTO } from '../types/ProviderDetailsType';

interface ProviderAvailabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  provider: ServiceProviderDTO | null;
}

const ProviderAvailabilityDrawer: React.FC<ProviderAvailabilityDrawerProps> = ({
  open,
  onClose,
  provider,
}) => {
  if (!provider) return null;

  const formatTime = (timeString: string) => {
    return moment(timeString, 'HH:mm').format('hh:mm A');
  };

  const getAvailabilityStatus = () => {
    const availability = provider.monthlyAvailability;
    if (!availability) return 'Unknown';
    
    if (availability.fullyAvailable) return 'Fully Available';
    return 'Partially Available';
  };

  const getAvailabilityColor = () => {
    const availability = provider.monthlyAvailability;
    if (!availability) return 'default';
    
    if (availability.fullyAvailable) return 'success';
    return 'warning';
  };

  const getBestMatchMessage = () => {
    if (provider.bestMatch) {
      return "This provider is our best match for your requirements!";
    } else {
      if (provider.monthlyAvailability?.fullyAvailable === false) {
        return "This provider has some schedule variations. Check availability details below.";
      }
      return "This provider matches most of your requirements.";
    }
  };

  const getColor = (colorName: string) => {
    const colors: Record<string, string> = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      primary: '#2196f3',
      info: '#2196f3',
      divider: '#e0e0e0',
      background: '#ffffff',
      textSecondary: '#757575',
      warningLight: '#fff3e0',
      warningDark: '#ff9800',
      successLight: '#e8f5e9',
      errorLight: '#ffebee',
      grey50: '#fafafa',
      grey200: '#eeeeee',
    };
    return colors[colorName] || '#000000';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Availability Details
        </Text>
        <View style={styles.headerSubtitle}>
          <Text variant="bodyLarge" style={styles.providerName}>
            {provider.firstname} {provider.lastname}
          </Text>
          {provider.bestMatch && (
            <Chip
              icon={() => <MaterialCommunityIcons name="fire" size={16} color="#fff" />}
              style={[styles.chip, styles.bestMatchChip]}
              textStyle={styles.chipText}
            >
              Best Match
            </Chip>
          )}
        </View>
      </View>
      <IconButton
        icon="close"
        size={24}
        onPress={onClose}
        style={styles.closeButton}
      />
    </View>
  );

  const renderBestMatchAlert = () => {
    if (provider.bestMatch) {
      return (
        <Surface style={[styles.alert, styles.successAlert]}>
          <View style={styles.alertContent}>
            <MaterialCommunityIcons 
              name="fire" 
              size={24} 
              color={getColor('success')}
            />
            <View style={styles.alertText}>
              <Text variant="titleSmall" style={styles.alertTitle}>
                Best Match Provider!
              </Text>
              <Text variant="bodyMedium">
                This provider perfectly matches all your requirements and preferences.
              </Text>
            </View>
          </View>
        </Surface>
      );
    } else {
      return (
        <Surface style={[styles.alert, styles.infoAlert]}>
          <View style={styles.alertContent}>
            <Icon name="info" size={24} color={getColor('primary')} />
            <View style={styles.alertText}>
              <Text variant="titleSmall" style={styles.alertTitle}>
                Good Match
              </Text>
              <Text variant="bodyMedium">
                {getBestMatchMessage()}
              </Text>
            </View>
          </View>
        </Surface>
      );
    }
  };

  const renderMonthlyAvailability = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Icon name="calendar-month" size={24} color={getColor('primary')} />
            <Text variant="titleLarge" style={styles.cardTitle}>
              Monthly Availability
            </Text>
          </View>
          <Chip
            style={[
              styles.availabilityBadge,
              provider.monthlyAvailability?.fullyAvailable 
                ? styles.fullyAvailableBadge 
                : styles.partiallyAvailableBadge
            ]}
            textStyle={styles.availabilityBadgeText}
          >
            {getAvailabilityStatus()}
          </Chip>
        </View>
        
        <Divider style={styles.divider} />

        {/* Preferred Working Time */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Preferred Working Time
          </Text>
          <Surface style={styles.timeSlot}>
            <View style={styles.timeSlotContent}>
              <Icon name="access-time" size={24} color={getColor('primary')} />
              <Text variant="titleMedium" style={styles.timeText}>
                {formatTime(provider.monthlyAvailability?.preferredTime || '08:00')}
              </Text>
              <Chip 
                mode="outlined"
                style={styles.dailyChip}
                textStyle={styles.dailyChipText}
              >
                Daily
              </Chip>
            </View>
          </Surface>
        </View>

        {/* Availability Stats */}
        {provider.monthlyAvailability?.summary && (
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              Availability Summary (Next 30 days)
            </Text>
            <Surface style={styles.statsCard}>
              <View style={styles.statRow}>
                <View style={styles.statLabel}>
                  <Icon name="event-available" size={20} color={getColor('success')} />
                  <Text variant="bodyMedium" style={styles.statText}>
                    Days at preferred time
                  </Text>
                </View>
                <Chip
                  mode="outlined"
                  style={[styles.statChip, styles.successChip]}
                  textStyle={styles.statChipText}
                >
                  {provider.monthlyAvailability.summary.daysAtPreferredTime} days
                </Chip>
              </View>

              {provider.monthlyAvailability.summary.daysWithDifferentTime > 0 && (
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Icon name="access-time" size={20} color={getColor('warning')} />
                    <Text variant="bodyMedium" style={styles.statText}>
                      Days with different time
                    </Text>
                  </View>
                  <Chip
                    mode="outlined"
                    style={[styles.statChip, styles.warningChip]}
                    textStyle={styles.statChipText}
                  >
                    {provider.monthlyAvailability.summary.daysWithDifferentTime} days
                  </Chip>
                </View>
              )}

              {provider.monthlyAvailability.summary.unavailableDays > 0 && (
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Icon name="event-busy" size={20} color={getColor('error')} />
                    <Text variant="bodyMedium" style={styles.statText}>
                      Unavailable days
                    </Text>
                  </View>
                  <Chip
                    mode="outlined"
                    style={[styles.statChip, styles.errorChip]}
                    textStyle={styles.statChipText}
                  >
                    {provider.monthlyAvailability.summary.unavailableDays} days
                  </Chip>
                </View>
              )}

              <Divider style={styles.divider} />

              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={styles.totalText}>
                  Total available days
                </Text>
                <Chip
                  style={[styles.statChip, styles.primaryChip]}
                  textStyle={styles.primaryChipText}
                >
                  {provider.monthlyAvailability.summary.totalDays} days
                </Chip>
              </View>
            </Surface>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderExceptions = () => {
    if (!provider.monthlyAvailability?.exceptions || 
        provider.monthlyAvailability.exceptions.length === 0) {
      return null;
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.exceptionsHeader}>
            <Icon name="warning" size={24} color={getColor('warning')} />
            <Text variant="titleLarge" style={styles.cardTitle}>
              Schedule Exceptions
            </Text>
            <Chip
              mode="outlined"
              style={[styles.chip, styles.warningChip]}
              textStyle={styles.warningChip}
            >
              {provider.monthlyAvailability.exceptions.length} exception(s)
            </Chip>
          </View>

          <List.Section>
            {provider.monthlyAvailability.exceptions.map((exception, index) => (
              <React.Fragment key={index}>
                <Surface style={styles.exceptionItem}>
                  <List.Item
                    title={() => (
                      <View style={styles.exceptionHeader}>
                        <Text variant="titleMedium" style={styles.exceptionDate}>
                          {moment(exception.date).format('ddd, MMM D, YYYY')}
                        </Text>
                        <Chip
                          style={[styles.chip, styles.exceptionReasonChip]}
                          textStyle={styles.exceptionReasonText}
                        >
                          {exception.reason.replace('_', ' ')}
                        </Chip>
                      </View>
                    )}
                    description={() => (
                      <View style={styles.exceptionContent}>
                        <Text variant="bodyMedium" style={styles.exceptionDescription}>
                          {exception.reason === 'ON_DEMAND' 
                            ? 'Available on demand at different time'
                            : 'Not available at preferred time'}
                        </Text>
                        {exception.suggestedTime && (
                          <View style={styles.suggestedTime}>
                            <Icon name="access-time" size={16} color={getColor('textSecondary')} />
                            <Text variant="bodyMedium" style={styles.suggestedTimeText}>
                              Suggested time: {formatTime(exception.suggestedTime)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    left={() => (
                      <List.Icon 
                        icon={() => <Icon name="info" size={24} color={getColor('warning')} />}
                      />
                    )}
                  />
                </Surface>
                {index < provider.monthlyAvailability.exceptions.length - 1 && (
                  <Divider style={styles.exceptionDivider} />
                )}
              </React.Fragment>
            ))}
          </List.Section>

          <Surface style={[styles.alert, styles.infoAlert, styles.exceptionAlert]}>
            <View style={styles.alertContent}>
              <Text variant="bodyMedium">
                These dates have different availability. You can still book for these dates,
                but the timing might vary.
              </Text>
            </View>
          </Surface>
        </Card.Content>
      </Card>
    );
  };

  const renderNotices = () => (
    <View style={styles.notices}>
      {provider.monthlyAvailability?.fullyAvailable && (
        <Surface style={[styles.alert, styles.successAlert]}>
          <View style={styles.alertContent}>
            <Icon name="check-circle" size={24} color={getColor('success')} />
            <View style={styles.alertText}>
              <Text variant="titleSmall" style={styles.alertTitle}>
                Perfect Availability!
              </Text>
              <Text variant="bodyMedium">
                This provider is fully available at their preferred time for the entire month.
                No schedule conflicts or exceptions.
              </Text>
            </View>
          </View>
        </Surface>
      )}

      {!provider.bestMatch && provider.monthlyAvailability?.fullyAvailable === false && (
        <Surface style={[styles.alert, styles.warningAlert]}>
          <View style={styles.alertContent}>
            <Icon name="info" size={24} color={getColor('warning')} />
            <View style={styles.alertText}>
              <Text variant="titleSmall" style={styles.alertTitle}>
                Why this isn't a Best Match?
              </Text>
              <Text variant="bodyMedium">
                This provider has some schedule variations during the month which prevents 
                them from being marked as a "Best Match". However, they're still highly 
                available and can accommodate your needs on most days.
              </Text>
            </View>
          </View>
        </Surface>
      )}
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={open}
        onRequestClose={onClose}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PaperProvider>
          <View style={styles.container}>
            {renderHeader()}
            <ScrollView style={styles.content}>
              {renderBestMatchAlert()}
              {renderMonthlyAvailability()}
              {renderExceptions()}
              {renderNotices()}
            </ScrollView>
          </View>
        </PaperProvider>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    color: '#757575',
    marginRight: 8,
  },
  closeButton: {
    marginLeft: 8,
  },
  chip: {
    marginRight: 4,
  },
  bestMatchChip: {
    backgroundColor: '#ff9800',
  },
  chipText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  alert: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  successAlert: {
    backgroundColor: '#e8f5e9',
  },
  infoAlert: {
    backgroundColor: '#e3f2fd',
  },
  warningAlert: {
    backgroundColor: '#fff3e0',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    marginLeft: 8,
  },
  availabilityBadge: {
    height: 32,
  },
  availabilityBadgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fullyAvailableBadge: {
    backgroundColor: '#4caf50',
  },
  partiallyAvailableBadge: {
    backgroundColor: '#ff9800',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#757575',
    marginBottom: 8,
  },
  timeSlot: {
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eeeeee',
    padding: 12,
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 'auto',
  },
  dailyChip: {
    height: 24,
  },
  dailyChipText: {
    fontSize: 12,
  },
  statsCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    marginLeft: 8,
  },
  statChip: {
    height: 28,
  },
  statChipText: {
    fontSize: 12,
  },
  successChip: {
    borderColor: '#4caf50',
  },
  warningChip: {
    borderColor: '#ff9800',
  },
  errorChip: {
    borderColor: '#f44336',
  },
  primaryChip: {
    backgroundColor: '#2196f3',
  },
  primaryChipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  totalText: {
    fontWeight: '600',
  },
  exceptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exceptionItem: {
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    marginBottom: 8,
    padding: 4,
  },
  exceptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exceptionDate: {
    fontWeight: '600',
    flex: 1,
  },
  exceptionReasonChip: {
    backgroundColor: '#ff9800',
    marginLeft: 8,
  },
  exceptionReasonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  exceptionContent: {
    marginTop: 4,
  },
  exceptionDescription: {
    color: '#757575',
    marginBottom: 8,
  },
  suggestedTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestedTimeText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  exceptionDivider: {
    marginVertical: 8,
  },
  exceptionAlert: {
    marginTop: 16,
  },
  notices: {
    marginTop: 16,
  },
});

export default ProviderAvailabilityDrawer;