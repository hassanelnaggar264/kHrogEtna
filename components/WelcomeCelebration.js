import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const ConfettiPiece = ({ startX, delay }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const colors = [Colors.primary, '#FFA500', '#FFD700', '#FF4500']; // Orange variants
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height + 50,
                    duration: 3000 + Math.random() * 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 360 * (Math.random() > 0.5 ? 1 : -1) + 'deg',
                    duration: 3000,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    left: startX,
                    backgroundColor: randomColor,
                    transform: [{ translateY }, { rotate: rotate.getInterpolation(val => val + 'deg') }] // Fix interpolation types
                }
            ]}
        />
    );
};

// Fix generic rotation interpolation for string output
const ConfettiPieceSafe = ({ startX, delay }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const colors = [Colors.primary, '#FFA500', '#FF8C00', '#FF6347'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height + 50,
                    duration: 2500 + Math.random() * 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: 2500,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    left: startX,
                    backgroundColor: randomColor,
                    transform: [{ translateY }, { rotate: spin }]
                }
            ]}
        />
    );
};


export default function WelcomeCelebration({ visible, onClose, userName }) {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        } else {
            scale.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    // Generate random confetti pieces
    const confettiCount = 30;
    const confetti = Array.from({ length: confettiCount }).map((_, i) => (
        <ConfettiPieceSafe key={i} startX={Math.random() * width} delay={Math.random() * 2000} />
    ));

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                {confetti}
                <Animated.View style={[
                    styles.content,
                    {
                        backgroundColor: colors.card,
                        transform: [{ scale }]
                    }
                ]}>
                    <Text style={[styles.emoji]}>🎉</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Welcome to 2Where?!</Text>
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Hi {userName}! You're all set to discover amazing places.
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: Colors.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Let's Go!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '80%',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    emoji: {
        fontSize: 50,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.8,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confetti: {
        position: 'absolute',
        top: -50,
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
