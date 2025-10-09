import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  TouchableOpacityProps 
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  style,
  ...props 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' ? styles.outline : styles.primary,
        props.disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          variant === 'outline' ? styles.outlineText : styles.primaryText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Styles remain the same as above

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryText: {
    color: 'white',
  },
  outlineText: {
    color: '#4B5563',
  },
});

export default Button;