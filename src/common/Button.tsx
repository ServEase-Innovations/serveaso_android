import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';

interface ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  title: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  style,
  title,
  testID,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
      paddingVertical: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: size === 'small' ? 36 : size === 'medium' ? 44 : 52,
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'contained':
        return {
          ...baseStyle,
          backgroundColor: '#1976d2',
          borderWidth: 1,
          borderColor: '#1976d2',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#1976d2',
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18,
      fontWeight: '500',
      textAlign: 'center',
    };

    switch (variant) {
      case 'contained':
        return {
          ...baseStyle,
          color: '#ffffff',
        };
      case 'outlined':
        return {
          ...baseStyle,
          color: '#1976d2',
        };
      case 'text':
        return {
          ...baseStyle,
          color: '#1976d2',
        };
      default:
        return baseStyle;
    }
  };

  const getSpinnerColor = (): string => {
    switch (variant) {
      case 'contained':
        return '#ffffff';
      case 'outlined':
      case 'text':
        return '#1976d2';
      default:
        return '#ffffff';
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getSpinnerColor()}
          style={styles.spinner}
        />
      )}
      <Text style={[getTextStyle(), loading && styles.textWithSpinner]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  spinner: {
    marginRight: 8,
  },
  textWithSpinner: {
    marginLeft: 0,
  },
});

export default Button;