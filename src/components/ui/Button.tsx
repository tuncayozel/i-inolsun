import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...shadows.base,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing[2];
        baseStyle.paddingHorizontal = spacing[4];
        break;
      case 'md':
        baseStyle.paddingVertical = spacing[3];
        baseStyle.paddingHorizontal = spacing[5];
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing[4];
        baseStyle.paddingHorizontal = spacing[6];
        break;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: typography.weights.semibold,
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        baseTextStyle.fontSize = typography.sizes.sm;
        break;
      case 'md':
        baseTextStyle.fontSize = typography.sizes.base;
        break;
      case 'lg':
        baseTextStyle.fontSize = typography.sizes.lg;
        break;
    }

    return baseTextStyle;
  };

  const renderButton = () => {
    const buttonStyle = [getButtonStyle(), style];

    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={disabled ? [colors.neutral[300], colors.neutral[400]] : colors.primary}
          style={buttonStyle}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    if (variant === 'secondary') {
      return (
        <LinearGradient
          colors={disabled ? [colors.neutral[300], colors.neutral[400]] : colors.secondary}
          style={buttonStyle}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    if (variant === 'outline') {
      return (
        <TouchableOpacity
          style={[
            buttonStyle,
            {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: disabled ? colors.neutral[300] : colors.primary[500],
            },
          ]}
          onPress={onPress}
          disabled={disabled || loading}
        >
          {renderContent()}
        </TouchableOpacity>
      );
    }

    if (variant === 'ghost') {
      return (
        <TouchableOpacity
          style={[
            buttonStyle,
            {
              backgroundColor: 'transparent',
              ...shadows.none,
            },
          ]}
          onPress={onPress}
          disabled={disabled || loading}
        >
          {renderContent()}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderContent = () => {
    const textStyle = [
      getTextStyle(),
      {
        color: variant === 'outline' || variant === 'ghost' 
          ? (disabled ? colors.neutral[400] : colors.primary[500])
          : colors.text.inverse,
      },
      textStyle,
    ];

    return (
      <>
        {icon && !loading && (
          <Text style={{ marginRight: spacing[2] }}>{icon}</Text>
        )}
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary[500] : colors.text.inverse} 
          />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </>
    );
  };

  if (variant === 'primary' || variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {renderButton()}
      </TouchableOpacity>
    );
  }

  return renderButton();
};
