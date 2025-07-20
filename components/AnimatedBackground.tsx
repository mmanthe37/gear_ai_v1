import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground() {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = () => {
      return Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(moveAnim, {
              toValue: 1,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(moveAnim, {
              toValue: 0,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 6000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 6000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = createAnimation();
    animation.start();

    return () => animation.stop();
  }, []);

  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.3, width * 0.3],
  });

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.2, height * 0.2],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          '#0a0a0a',
          '#1a1a1a',
          '#2a2a2a',
          '#1a1a1a',
          '#0a0a0a'
        ]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View
        style={[
          styles.orb1,
          {
            transform: [
              { translateX },
              { translateY },
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 69, 0, 0.4)', 'rgba(255, 140, 0, 0.2)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.orb2,
          {
            transform: [
              { translateX: translateX.interpolate({
                inputRange: [-width * 0.3, width * 0.3],
                outputRange: [width * 0.2, -width * 0.2],
              }) },
              { translateY: translateY.interpolate({
                inputRange: [-height * 0.2, height * 0.2],
                outputRange: [height * 0.1, -height * 0.1],
              }) },
              { scale: scaleAnim.interpolate({
                inputRange: [0.8, 1.2],
                outputRange: [1.1, 0.9],
              }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(30, 144, 255, 0.3)', 'rgba(0, 191, 255, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  background: {
    flex: 1,
  },
  orb1: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    overflow: 'hidden',
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.2,
    right: width * 0.1,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
    borderRadius: width * 0.3,
  },
});