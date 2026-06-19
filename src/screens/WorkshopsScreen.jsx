import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, X, Users } from 'lucide-react-native';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function WorkshopsScreen() {
  const [currentUserAvatar, setCurrentUserAvatar] = useState('https://randomuser.me/api/portraits/women/44.jpg');
  const [currentUserName, setCurrentUserName] = useState('Anonymous User');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            if (data.imageUrl) {
              setCurrentUserAvatar(data.imageUrl);
            }
            if (data.fullName) {
              setCurrentUserName(data.fullName);
            }
          }
        } catch (error) {
          console.error('Error fetching profile picture:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [workshops, setWorkshops] = useState([
    {
      id: 1,
      author: 'Sarah Developer',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
      category: 'AI/ML',
      date: '25 May',
      title: 'AIML Workshop',
      time: '10:00 AM',
      registeredCount: 142
    },
    {
      id: 2,
      author: 'John Coder',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
      category: 'DevOps',
      date: '27 May',
      title: 'DevOps Workshop',
      time: '11:00 AM',
      registeredCount: 89
    },
    {
      id: 3,
      author: 'Emma Eng',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      category: 'Web',
      date: '30 May',
      title: 'Full Stack Workshop',
      time: '2:00 PM',
      registeredCount: 215
    }
  ]);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newWorkshopData, setNewWorkshopData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    image: ''
  });

  const handlePostWorkshop = () => {
    if (!newWorkshopData.title || !newWorkshopData.category) return;
    
    const newWorkshop = {
      id: Date.now(),
      author: currentUserName,
      avatar: currentUserAvatar,
      image: newWorkshopData.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      category: newWorkshopData.category,
      date: newWorkshopData.date || 'Soon',
      title: newWorkshopData.title,
      time: newWorkshopData.time || 'TBD',
      registeredCount: 0
    };

    setWorkshops([newWorkshop, ...workshops]);
    setNewWorkshopData({ title: '', category: '', date: '', time: '', image: '' });
    setIsPostModalOpen(false);
  };

  const handleRegister = (id) => {
    setWorkshops(workshops.map(ws => {
      if (ws.id === id) {
        return { ...ws, registeredCount: ws.registeredCount + 1 };
      }
      return ws;
    }));
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900">Workshops</Text>
          <TouchableOpacity 
            onPress={() => setIsPostModalOpen(true)}
            className="flex-row items-center bg-[#0a66c2] px-4 py-2 rounded-xl"
          >
            <Plus size={16} color="white" style={{ marginRight: 4 }} />
            <Text className="text-white font-medium">Post</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-col">
          {workshops.map((workshop) => (
            <View key={workshop.id} className="mb-6">
              <View className="flex-row items-center mb-2 px-1">
                <Image source={{ uri: workshop.avatar }} className="w-8 h-8 rounded-full border border-gray-200" />
                <Text className="font-semibold text-gray-800 text-sm ml-2">{workshop.author}</Text>
              </View>

              <View className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-col">
                <Image source={{ uri: workshop.image }} className="w-full h-48 bg-gray-100" resizeMode="cover" />

                <View className="p-5">
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="px-3 py-1 bg-blue-50 rounded-full">
                      <Text className="text-blue-500 text-xs font-semibold">{workshop.category}</Text>
                    </View>
                    <Text className="text-sm text-gray-600 font-medium">{workshop.date}</Text>
                  </View>

                  <Text className="text-xl font-bold text-gray-900 mb-2">{workshop.title}</Text>
                  
                  <View className="flex-row justify-between items-center mb-6 mt-2">
                    <Text className="text-gray-500 text-sm">{workshop.time}</Text>
                    <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-lg">
                      <Users size={14} color="#2563eb" />
                      <Text className="font-semibold text-blue-600 ml-1">{workshop.registeredCount}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={() => handleRegister(workshop.id)}
                    className="w-full py-3 bg-[#0a66c2] rounded-xl items-center mt-auto"
                  >
                    <Text className="text-white font-semibold">Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create Workshop Modal */}
      <Modal visible={isPostModalOpen} animationType="fade" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white w-full rounded-xl shadow-2xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-semibold">Post a Workshop</Text>
              <TouchableOpacity onPress={() => setIsPostModalOpen(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="p-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Workshop Title</Text>
              <TextInput 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                placeholder="e.g., Intro to React"
                value={newWorkshopData.title}
                onChangeText={(t) => setNewWorkshopData({ ...newWorkshopData, title: t })}
              />
              
              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
                  <TextInput 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="e.g., Web"
                    value={newWorkshopData.category}
                    onChangeText={(t) => setNewWorkshopData({ ...newWorkshopData, category: t })}
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Date</Text>
                  <TextInput 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="e.g., 15 Jun"
                    value={newWorkshopData.date}
                    onChangeText={(t) => setNewWorkshopData({ ...newWorkshopData, date: t })}
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Time</Text>
                  <TextInput 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="e.g., 2:00 PM"
                    value={newWorkshopData.time}
                    onChangeText={(t) => setNewWorkshopData({ ...newWorkshopData, time: t })}
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Image URL</Text>
                  <TextInput 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="https://..."
                    value={newWorkshopData.image}
                    onChangeText={(t) => setNewWorkshopData({ ...newWorkshopData, image: t })}
                  />
                </View>
              </View>
            </View>
            <View className="p-4 border-t border-gray-200 flex-row justify-end">
              <TouchableOpacity 
                onPress={() => setIsPostModalOpen(false)}
                className="px-4 py-2 rounded-lg mr-2 justify-center"
              >
                <Text className="text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!newWorkshopData.title || !newWorkshopData.category}
                onPress={handlePostWorkshop}
                className={`px-6 py-2 rounded-lg justify-center ${!newWorkshopData.title || !newWorkshopData.category ? 'bg-gray-300' : 'bg-[#0a66c2]'}`}
              >
                <Text className="text-white font-semibold">Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
