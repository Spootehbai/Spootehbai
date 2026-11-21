
import React, { useRef } from "react";

import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import {
  colors,
  radius,
  spacing,
} from "../constants/theme";

export function AppButton({
  title,
  onPress,
  loading = false,
  variant = "primary",
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const backgroundColor =
    variant === "danger"
      ? colors.danger
      : variant === "secondary"
      ? colors.primaryLight
      : colors.primary;

  const textColor =
    variant === "secondary"
      ? colors.primaryDark
      : colors.white;

  const animateScale = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={() => {
          if (!loading) {
            animateScale(0.94);
          }
        }}
        onPressOut={() => {
          animateScale(1);
        }}
        android_ripple={{
          color: "rgba(255,255,255,0.20)",
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor,
          },
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: textColor,
              },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  button: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },

  text: {
    fontSize: 16,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.85,
  },
});
