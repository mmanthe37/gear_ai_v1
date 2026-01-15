/**
 * Gear AI CoPilot - Forgot Password Screen
 * 
 * Password reset email flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../../components/AnimatedBackground';
import GlassCard from '../../components/GlassCard';
import { validateForgotPasswordForm } from '../../lib/validation';
import { resetPassword } from '../../services/auth-service';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const router = useRouter();

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    const validation = validateForgotPasswordForm(email.trim());
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
      Alert.alert(
        'Email Sent!',
        'Check your email for password reset instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/login'),
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Unable to send password reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#1E90FF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={48} color="#1E90FF" />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              {emailSent 
                ? 'Check your email for reset instructions' 
                : "Enter your email and we'll send you reset instructions"
              }
            </Text>
          </View>

          {!emailSent && (
            <GlassCard style={styles.formCard}>
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="mail" size={20} color="#fff" />
                      <Text style={styles.resetButtonText}>Send Reset Email</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Back to Login Link */}
                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={handleBackToLogin}
                  disabled={isLoading}
                >
                  <Ionicons name="arrow-back" size={16} color="rgba(30, 144, 255, 0.9)" />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {emailSent && (
            <GlassCard style={styles.successCard} variant="success">
              <View style={styles.successContent}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  We've sent password reset instructions to:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.successSubtext}>
                  Please check your inbox and follow the instructions to reset your password.
                </Text>
                
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleBackToLogin}
                >
                  <Text style={styles.doneButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Info */}
          <Text style={styles.footer}>
            Didn't receive an email? Check your spam folder or try again.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(30, 144, 255, 0.4)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  formCard: {
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 48,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  inputError: {
    borderColor: 'rgba(255, 69, 0, 0.6)',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4500',
    marginLeft: 4,
    marginTop: -4,
  },
  resetButton: {
    backgroundColor: 'rgba(30, 144, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.5)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  backToLoginText: {
    color: 'rgba(30, 144, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  successCard: {
    marginBottom: 24,
  },
  successContent: {
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E90FF',
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: 'rgba(30, 144, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.5)',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 16,
    lineHeight: 18,
  },
});
