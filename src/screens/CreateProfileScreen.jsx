import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, Search, Plus, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import clsx from 'clsx';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateProfileScreen() {
  const navigation = useNavigation();

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [domainSearch, setDomainSearch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const domains = [
    'Backend Development', 'Web Development', 'Mobile App Development', 
    'Data Science & ML', 'Cloud Computing & DevOps', 'Game Development', 
    'Cybersecurity', 'Embedded Systems & IoT', 'Blockchain Development', 
    'Artificial Intelligence', 'Database Development'
  ];

  const toggleDomain = (domain) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const filteredDomains = domains.filter(d => d.toLowerCase().includes(domainSearch.toLowerCase()));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/i;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please use a valid Cambridge email (e.g., name@cambridge.edu.in)');
      return;
    }
    
    if (!fullName || !college || !password) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      let uid;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } catch (signInError) {
            Alert.alert('Error', 'This email is already registered! Please enter the correct password for this account to complete profile setup, or use a different email.');
            setLoading(false);
            return;
          }
        } else {
          throw authError;
        }
      }

      let imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
      if (base64Image) {
        imageUrl = base64Image;
      }

      try {
        await addDoc(collection(db, 'profiles'), {
          uid,
          email,
          fullName,
          college,
          bio,
          domains: selectedDomains,
          imageUrl,
          createdAt: new Date(),
        });
      } catch (firestoreError) {
        console.error('Firestore write failed:', firestoreError);
        Alert.alert('Error', 'Could not save profile data. Please make sure your Firestore Rules allow writes!');
        setLoading(false);
        return;
      }

      // Navigation handled automatically by AppNavigator
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mb-8 mt-10">
          <Text className="text-3xl font-bold text-[#0a66c2] mb-2">CodersHub</Text>
          <Text className="text-gray-600 mb-6">Let's set up your developer profile</Text>
          
          <View className="flex-row items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-[#0a66c2] items-center justify-center">
              <Text className="text-white font-bold">1</Text>
            </View>
            <View className="h-1 w-12 bg-[#0a66c2]" />
            <View className="w-8 h-8 rounded-full bg-[#0a66c2] items-center justify-center">
              <Text className="text-white font-bold">2</Text>
            </View>
            <View className="h-1 w-12 bg-gray-300" />
            <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-gray-500 font-bold">3</Text>
            </View>
          </View>
        </View>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <View className="items-center mb-6">
            <TouchableOpacity 
              onPress={pickImage}
              className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden"
            >
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} className="w-full h-full" />
              ) : (
                <View className="items-center justify-center">
                  <Camera size={32} color="#9ca3af" />
                  <Text className="text-xs text-gray-500 mt-2 font-medium">Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">College / University</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="Cambridge Institute of Technology"
                value={college}
                onChangeText={setCollege}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="Passionate developer building things..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top' }}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="name@cambridge.edu.in"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="Enter a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 my-6" />

          <Text className="text-lg font-semibold text-gray-900 mb-4">Select Your Interested Domains</Text>
          
          <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-2 mb-4 bg-white">
            <Search size={16} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900 h-8"
              placeholder="Search domains..."
              value={domainSearch}
              onChangeText={setDomainSearch}
            />
          </View>

          <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
            {filteredDomains.map(domain => {
              const isSelected = selectedDomains.includes(domain);
              return (
                <TouchableOpacity
                  key={domain}
                  onPress={() => toggleDomain(domain)}
                  className={clsx(
                    "px-4 py-2 rounded-full flex-row items-center border",
                    isSelected 
                      ? "bg-[#0a66c2]/10 border-[#0a66c2]" 
                      : "bg-white border-gray-200"
                  )}
                >
                  {isSelected && <Check size={14} color="#0a66c2" style={{ marginRight: 4 }} />}
                  <Text className={clsx("text-sm font-medium", isSelected ? "text-[#0a66c2]" : "text-gray-600")}>
                    {domain}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0a66c2] py-4 rounded-full items-center justify-center mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Continue to Dashboard</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
