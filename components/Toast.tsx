import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000, 
  onDismiss 
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (visible) {
      // Show toast
      translateY.value = withSequence(
        withTiming(-100, { duration: 0 }),
        withTiming(Platform.OS === 'web' ? 20 : 50, { 
          duration: 300,
          easing: Easing.out(Easing.back(1.5))
        })
      );
      opacity.value = withTiming(1, { duration: 300 });
      
      // Auto hide after duration
      timeoutId = setTimeout(() => {
        hideToast();
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible]);
  
  const hideToast = () => {
    translateY.value = withTiming(-100, { 
      duration: 300,
      easing: Easing.in(Easing.cubic)
    });
    
    // Fix: Properly handle the callback with runOnJS
    opacity.value = withTiming(0, { 
      duration: 300 
    }, (finished) => {
      if (finished) {
        'worklet';
        runOnJS(onDismiss)();
      }
    });
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value
    };
  });
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return Colors.light.success;
      case 'error':
        return Colors.light.error;
      case 'info':
        return Colors.light.primary;
      case 'warning':
        return '#F59E0B'; // Amber color for warnings
      default:
        return Colors.light.success;
    }
  };
  
  if (!visible && opacity.value === 0) return null;
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <X size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 500,
    width: '100%',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
  }
});

export default Toast;