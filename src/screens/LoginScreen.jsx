import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Navigation is handled automatically by AppNavigator
    });
    return () => unsubscribe();
  }, []);

  const handleForgotPassword = async () => {
    setMessage({ type: '', text: '' });
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/i;
    if (!email || !emailRegex.test(email)) {
      setMessage({ 
        type: 'error', 
        text: 'Please enter your valid Cambridge email address first, then click "Forgot password?".' 
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: 'success', 
        text: `A password reset link has been successfully sent to ${email}!` 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMsg = 'Failed to send password reset email. Please verify the email is registered.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'This email address is not registered in our system. Please sign up first!';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'The email address is invalid. Please double check.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    setMessage({ type: '', text: '' });

    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/i;
    if (!emailRegex.test(email)) {
      setMessage({ 
        type: 'error', 
        text: 'Please use a valid Cambridge email (e.g., name@cambridge.edu.in)' 
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation handled automatically by AppNavigator
    } catch (error) {
      console.error(error);
      let errorMsg = 'Invalid email or password! Please make sure your credentials are correct.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'This email is not registered yet. Please sign up first!';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center p-8 bg-white mt-10">
          <View className="w-full max-w-md space-y-8">
            <View className="flex flex-col items-center text-center mb-10">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-4xl font-bold text-[#0a66c2]">CodersHub</Text>
              </View>
              <Text className="text-gray-600 mt-2 text-base">Connect. Build. Innovate.</Text>
            </View>

            <View className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <Text className="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign in</Text>

              {message.text ? (
                <View className={`p-4 mb-6 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <Text className={`text-xs font-semibold leading-5 ${
                    message.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {message.text}
                  </Text>
                </View>
              ) : null}

              <View className="space-y-5">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                  <TextInput
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                    placeholder="name@cambridge.edu.in"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                <View>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm font-medium text-gray-700">Password</Text>
                    <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading}>
                      <Text className="text-xs font-semibold text-[#0a66c2]">
                        {resetLoading ? 'Sending link...' : 'Forgot password?'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#0a66c2] py-3 rounded-full items-center justify-center shadow-sm mt-4"
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Sign in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-center mt-8">
              <Text className="text-sm text-gray-600">New to CodersHub? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateProfile')}>
                <Text className="text-sm font-semibold text-[#0a66c2]">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
