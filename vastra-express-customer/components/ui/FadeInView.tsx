import React, { useEffect } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay,
  withTiming,
  Easing
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
}

export const FadeInView = ({ 
  children, 
  delay = 0, 
  duration = 600, 
  direction = 'up',
  distance = 20,
  className
}: Props) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? distance : direction === 'right' ? -distance : 0);
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withSpring(0));
    translateY.value = withDelay(delay, withSpring(0));
  }, []);

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
};
