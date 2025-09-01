import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  margin?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  margin = 'md',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius['2xl'],
      backgroundColor: colors.background.primary,
      overflow: 'hidden',
    };

    // Padding
    switch (padding) {
      case 'sm':
        baseStyle.padding = spacing[3];
        break;
      case 'md':
        baseStyle.padding = spacing[4];
        break;
      case 'lg':
        baseStyle.padding = spacing[6];
        break;
    }

    // Margin
    switch (margin) {
      case 'sm':
        baseStyle.margin = spacing[2];
        break;
      case 'md':
        baseStyle.margin = spacing[4];
        break;
      case 'lg':
        baseStyle.margin = spacing[6];
        break;
    }

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.border.light;
        Object.assign(baseStyle, shadows.sm);
        break;
      case 'elevated':
        Object.assign(baseStyle, shadows.lg);
        break;
      case 'outlined':
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = colors.border.medium;
        break;
    }

    return baseStyle;
  };

  const cardStyle = [getCardStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

// Card Header bileşeni
export const CardHeader: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.cardHeader, style]}>
    {children}
  </View>
);

// Card Content bileşeni
export const CardContent: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.cardContent, style]}>
    {children}
  </View>
);

// Card Footer bileşeni
export const CardFooter: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.cardFooter, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing[3],
    marginBottom: spacing[3],
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing[3],
    marginTop: spacing[3],
  },
});
