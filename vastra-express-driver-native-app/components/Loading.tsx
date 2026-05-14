import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { G, Path, Circle, Rect, Defs, ClipPath, Ellipse } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

interface LoadingProps {
  fullPage?: boolean;
  label?: string;
}

export function Loading({ fullPage = false, label }: LoadingProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View style={styles.container}>
      <Svg width="180" height="186" viewBox="0 0 260 268">
        <Defs>
          <ClipPath id="dc">
            <Circle cx="130" cy="140" r="58"/>
          </ClipPath>
        </Defs>
        <Rect x="22" y="28" width="216" height="216" rx="18" fill="#daeeff" stroke="#2e9fd8" strokeWidth="3.5"/>
        <Rect x="22" y="28" width="216" height="46" rx="18" fill="#1565a8"/>
        <Rect x="22" y="54"  width="216" height="20"  fill="#1565a8"/>
        <Rect x="40" y="42" width="38" height="11" rx="5.5" fill="#90c8f0"/>
        <Circle cx="156" cy="47.5" r="6" fill="#2e9fd8"/>
        <Circle cx="174" cy="47.5" r="6" fill="#4ecba8"/>
        <Circle cx="192" cy="47.5" r="6" fill="#f0a030"/>
        <Circle cx="210" cy="47.5" r="6" fill="#e05050"/>
        <Circle cx="130" cy="140" r="72" fill="#0d4a80"/>
        <Circle cx="130" cy="140" r="64" fill="#1a6fb5"/>
        <Circle cx="130" cy="140" r="60" fill="#0d4a80"/>
        <Circle cx="130" cy="140" r="58" fill="#c8e8fa"/>
        
        <AnimatedG 
          clipPath="url(#dc)"
          style={{
            transform: [
              { translateX: 130 },
              { translateY: 140 },
              { rotate: spin },
              { translateX: -130 },
              { translateY: -140 },
            ]
          }}
        >
          <Path d="M 130 82 C 164 82, 188 108, 188 140 C 188 172, 164 198, 130 198 C 130 198, 130 170, 130 140 C 130 110, 130 82, 130 82 Z" fill="#1a6fb5"/>
          <Path d="M 130 82 C 96 82, 72 108, 72 140 C 72 172, 96 198, 130 198 C 130 198, 130 170, 130 140 C 130 110, 130 82, 130 82 Z" fill="#90c8f0"/>
          <Circle cx="130" cy="104" r="14" fill="#1a6fb5"/>
          <Circle cx="130" cy="176" r="14" fill="#90c8f0"/>
          <Circle cx="108" cy="122" r="5"   fill="white" opacity={0.55}/>
          <Circle cx="118" cy="145" r="3.5" fill="white" opacity={0.45}/>
          <Circle cx="100" cy="155" r="4"   fill="white" opacity={0.4}/>
          <Circle cx="152" cy="130" r="4"   fill="white" opacity={0.4}/>
          <Circle cx="148" cy="158" r="3"   fill="white" opacity={0.35}/>
          <Circle cx="122" cy="168" r="3"   fill="white" opacity={0.4}/>
          <Circle cx="140" cy="108" r="3"   fill="white" opacity={0.35}/>
        </AnimatedG>
        
        <Circle cx="130" cy="140" r="58" fill="none" stroke="#90c8f0" strokeWidth="2.5"/>
        <Circle cx="130" cy="140" r="52" fill="none" stroke="#0d4a80" strokeWidth="1" opacity={0.4}/>
        <Ellipse cx="110" cy="114" rx="15" ry="9" fill="white" opacity={0.16} />
        <Rect x="112" y="216" width="36" height="8" rx="4" fill="#0d4a80"/>
      </Svg>
      <Text style={styles.text}>
        {label || 'Please wait while we spin things up...'}
      </Text>
    </View>
  );

  if (fullPage) {
    return <View style={styles.fullPage}>{content}</View>;
  }
  return content;
}

const styles = StyleSheet.create({
  fullPage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 300,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: '#1565a8',
    opacity: 0.85,
    textAlign: 'center',
    fontWeight: '500',
  }
});

