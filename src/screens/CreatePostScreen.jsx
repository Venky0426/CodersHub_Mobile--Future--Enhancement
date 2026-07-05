import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TouchableOpacity, TextInput, ScrollView, 
  KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { X, Image as ImageIcon } from 'lucide-react-native';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

import { SafeAreaView } from 'react-native-safe-area-context';

const CreatePostScreen = ({ navigation }) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  
  const [currentUserAvatar, setCurrentUserAvatar] = useState('https://randomuser.me/api/portraits/men/46.jpg');
  const [currentUserFullName, setCurrentUserFullName] = useState('Current User');
  const [currentUserRole, setCurrentUserRole] = useState('Student');
  const [currentUserCollege, setCurrentUserCollege] = useState('Cambridge');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setCurrentUserAvatar(data.imageUrl || 'https://randomuser.me/api/portraits/men/46.jpg');
            setCurrentUserFullName(data.fullName || 'Anonymous Developer');
            setCurrentUserRole(data.role || (data.domains?.length > 0 ? data.domains[0] : 'Software Developer'));
            if (data.college) {
              setCurrentUserCollege(data.college.split(' ')[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPostImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to post.");
      return;
    }

    const newPost = {
      id: Date.now(),
      uid: user.uid,
      author: currentUserFullName,
      role: currentUserRole,
      college: currentUserCollege,
      avatar: currentUserAvatar,
      content: newPostContent.trim(),
      image: newPostImage,
      time: 'Just now',
      likes: 0,
      likedBy: [],
      comments: []
    };

    try {
      await addDoc(collection(db, 'posts'), newPost);
      navigation.goBack();
    } catch (err) {
      console.error('Error creating post', err);
      Alert.alert("Error", "Failed to create post: " + err.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold">Create a post</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="p-4 flex-1" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center mb-4">
          <Image source={{ uri: currentUserAvatar }} className="w-12 h-12 rounded-full mr-3" />
          <Text className="font-semibold text-base">{currentUserFullName}</Text>
        </View>
        
        <TextInput
          className="w-full text-lg mb-4"
          placeholder="What do you want to talk about?"
          multiline
          autoFocus
          style={{ textAlignVertical: 'top', minHeight: 150 }}
          value={newPostContent}
          onChangeText={setNewPostContent}
        />

        {newPostImage ? (
          <View className="relative mt-2 mb-4">
            <Image source={{ uri: newPostImage }} className="w-full h-64 rounded-lg bg-gray-50" resizeMode="contain" />
            <TouchableOpacity 
              className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
              onPress={() => setNewPostImage('')}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View className="p-3 border-t border-gray-200 bg-white flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handlePickImage} className="p-2 mr-2 bg-gray-50 rounded-full">
            <ImageIcon size={24} color="#0a66c2" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 px-3 border border-gray-300 bg-gray-50 rounded-full">
            <Text className="text-[10px] font-bold text-gray-600">GIF</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          disabled={!newPostContent.trim() && !newPostImage}
          onPress={handleCreatePost}
          className={`px-6 py-2 rounded-full ${newPostContent.trim() || newPostImage ? 'bg-[#0a66c2]' : 'bg-gray-300'}`}
        >
          <Text className={`font-semibold ${newPostContent.trim() || newPostImage ? 'text-white' : 'text-gray-500'}`}>Post</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
