
import React, { useRef } from "react";

import {
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";

export default function AnimatedTabButton({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  accessibilityState,
  disabled,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const isSelected = Boolean(accessibilityState?.selected);

  const animateScale = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 28,
      bounciness: 7,
    }).start();
  };

  const handlePressIn = (event) => {
    if (!disabled) {
      animateScale(0.88);
    }

    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    animateScale(1);
    onPressOut?.(event);
  };

  return (
    <Pressable
      {...rest}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{
        color: "rgba(0,255,102,0.15)",
        borderless: false,
      }}
      style={[
        styles.container,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale }],
            opacity: isSelected ? 1 : 0.85,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  content: {
    justifyContent: "center",
    alignItems: "center",
  },
});
