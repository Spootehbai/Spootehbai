
import React, { useRef, useEffect } from "react";

import {
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";

export default function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  disabled = false,
  scaleTo = 0.96,
  duration = 120,
  rippleColor = "rgba(0, 255, 102, 0.15)",
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      scale.stopAnimation();
    };
  }, [scale]);

  const animateTo = (value) => {
    Animated.timing(scale, {
      toValue: value,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = (event) => {
    if (!disabled) {
      animateTo(scaleTo);
    }

    if (onPressIn) {
      onPressIn(event);
    }
  };

  const handlePressOut = (event) => {
    animateTo(1);

    if (onPressOut) {
      onPressOut(event);
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        {...rest}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: rippleColor,
        }}
        style={({ pressed }) => [
          styles.pressable,
          typeof style === "function"
            ? style({ pressed })
            : style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
  },

  pressable: {
    overflow: "hidden",
  },

  pressed: {
    opacity: 0.92,
  },
});
