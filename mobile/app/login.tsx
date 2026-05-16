import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Package } from 'lucide-react-native';
import api from '../src/services/api';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  const handleSubmit = async () => {
    setError('');

    if (!isLogin) {
      if (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough) {
        setError('Please meet all password requirements.');
        return;
      }
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const { data } = await api.post(endpoint, { email, password });
      
      if (isLogin) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/');
      } else {
        setIsLogin(true);
        Alert.alert('Success', 'Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Make sure EXPO_PUBLIC_API_URL is correct.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Package size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Packing Pal</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter your email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
            />

            {!isLogin && (
              <View style={styles.requirementsContainer}>
                <Text style={[styles.requirementText, isLongEnough ? styles.reqMet : styles.reqUnmet]}>
                  • At least 8 characters
                </Text>
                <Text style={[styles.requirementText, hasUppercase ? styles.reqMet : styles.reqUnmet]}>
                  • One uppercase letter (A-Z)
                </Text>
                <Text style={[styles.requirementText, hasLowercase ? styles.reqMet : styles.reqUnmet]}>
                  • One lowercase letter (a-z)
                </Text>
                <Text style={[styles.requirementText, hasSymbol ? styles.reqMet : styles.reqUnmet]}>
                  • One symbol (!@#$%^&*)
                </Text>
              </View>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.button, (!isLogin && (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough)) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!isLogin && (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough)}
            >
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.linkText}>{isLogin ? 'Register' : 'Login'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#000',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: -8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requirementsContainer: {
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
  },
  reqMet: {
    color: '#16a34a',
  },
  reqUnmet: {
    color: '#9ca3af',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  linkText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
