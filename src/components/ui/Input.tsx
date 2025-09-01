import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, border } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderWidth: 2,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      fontSize: typography.sizes.base,
      color: colors.text.primary,
      backgroundColor: colors.background.primary,
      ...shadows.sm,
    };

    if (leftIcon) {
      baseStyle.paddingLeft = spacing[12];
    }

    if (rightIcon) {
      baseStyle.paddingRight = spacing[12];
    }

    if (multiline) {
      baseStyle.paddingTop = spacing[4];
      baseStyle.paddingBottom = spacing[4];
      baseStyle.textAlignVertical = 'top';
    }

    if (isFocused) {
      baseStyle.borderColor = colors.primary[500];
      baseStyle.shadowRadius = 8;
      baseStyle.elevation = 4;
    } else if (error) {
      baseStyle.borderColor = colors.error[500];
    } else {
      baseStyle.borderColor = border.light;
    }

    if (disabled) {
      baseStyle.backgroundColor = colors.background.tertiary;
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: spacing[4],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: spacing[4],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error[500],
    marginTop: spacing[2],
    marginLeft: spacing[1],
  },
});
