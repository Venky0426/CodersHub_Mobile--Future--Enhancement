import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Dimensions, Alert, Platform, Animated, PanResponder } from 'react-native';
import { Calendar, MapPin, ExternalLink, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const eventsData = [
  {
    id: 1,
    title: 'National Level Hackathon',
    organizer: 'CARE College of Engineering',
    date: 'Mar 14–15, 2025',
    location: 'CARE Campus, Trichy',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    tag: 'Hackathon',
    tagColor: '#e040fb',
  },
  {
    id: 2,
    title: 'The Great Bengaluru Hackathon',
    organizer: 'PES University',
    date: 'Mar 15–16, 2025',
    location: 'PES University, Bengaluru',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    tag: 'Hackathon',
    tagColor: '#2979ff',
  },
  {
    id: 3,
    title: 'AI & ML Workshop 2025',
    organizer: 'IIT Madras',
    date: 'Apr 5–6, 2025',
    location: 'IIT Madras Campus',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    tag: 'Workshop',
    tagColor: '#00c853',
  },
];

const SLIDE_DURATION = 4000;

const EventsSlideshowNative = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // PanResponder for dragging the floating bubble
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start dragging if the user moves a bit (to distinguish from a tap)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;
  
  const currentEvent = eventsData[currentIndex];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const intervalTime = 50;
    const step = (intervalTime / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < eventsData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [currentIndex]);

  return (
    <>
      {!isOpen && (
        <Animated.View
          style={[styles.floatingButton, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setIsOpen(true);
              setCurrentIndex(0);
              setProgress(0);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.bubbleContainer, { borderColor: '#e040fb' }]}>
              <Image 
                source={{ uri: eventsData[0].image }} 
                style={styles.bubbleImage}
              />
              <View style={styles.bubbleOverlay}>
                <Calendar size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eventsData.length}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal visible={isOpen} animationType="fade" transparent={true}>
        <View style={styles.modalBackground}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsOpen(false)}
          >
            <X size={32} color="white" />
          </TouchableOpacity>
          
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {eventsData.map((_, idx) => (
              <View key={idx} style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` }
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Calendar size={20} color="#333" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>{currentEvent.organizer}</Text>
              <Text style={[styles.headerTag, { color: currentEvent.tagColor }]}>{currentEvent.tag}</Text>
            </View>
          </View>

          {/* Nav areas */}
          <View style={styles.navContainer}>
            <TouchableOpacity style={styles.navLeft} onPress={handlePrev} />
            <TouchableOpacity style={styles.navRight} onPress={handleNext} />
          </View>

          {/* Content */}
          <Image 
            source={{ uri: currentEvent.image }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          
          <View style={styles.detailsOverlay}>
            <Text style={styles.eventTitle}>{currentEvent.title}</Text>
            
            <View style={styles.eventMeta}>
              <Calendar size={16} color="#60a5fa" />
              <Text style={styles.metaText}>{currentEvent.date}</Text>
            </View>
            <View style={styles.eventMeta}>
              <MapPin size={16} color="#f87171" />
              <Text style={styles.metaText}>{currentEvent.location}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => Alert.alert("Register", `Registering for ${currentEvent.title}`)}
            >
              <ExternalLink size={20} color="#fff" />
              <Text style={styles.registerText}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 999,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  bubbleContainer: {
    flex: 1,
    borderRadius: 35,
    borderWidth: 3,
    padding: 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  bubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 110,
    padding: 8,
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 20,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 40,
    left: 16,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  navContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  navLeft: {
    width: '35%',
    height: '100%',
  },
  navRight: {
    width: '65%',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  detailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 100,
    backgroundColor: 'transparent', 
  },
  eventTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  registerButton: {
    flexDirection: 'row',
    backgroundColor: '#0a66c2',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default EventsSlideshowNative;
