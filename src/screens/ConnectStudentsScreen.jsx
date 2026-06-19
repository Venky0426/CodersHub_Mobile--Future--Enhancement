import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Search, Filter, UserPlus, Check } from 'lucide-react-native';

const studentsData = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  name: `Developer ${i + 1}`,
  college: ['MIT', 'Stanford', 'Harvard', 'IIT Bombay', 'Oxford'][i % 5],
  domain: ['Web Development', 'AI & ML', 'Blockchain', 'Cybersecurity', 'Mobile App'][i % 5],
  image: `https://api.dicebear.com/7.x/avataaars/png?seed=${i + 10}`,
}));

export default function ConnectStudentsScreen() {
  const [connected, setConnected] = useState({});

  const handleConnect = (id) => {
    setConnected(prev => ({ ...prev, [id]: true }));
  };
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-200 shadow-sm z-10">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mb-3">
          <Search size={20} color="#6b7280" />
          <TextInput 
            placeholder="Search students by name..." 
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <TouchableOpacity className="px-4 py-1.5 bg-white border border-gray-300 rounded-full mr-2 justify-center shadow-sm">
            <Text className="text-gray-700 text-xs font-medium">All Colleges ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-1.5 bg-white border border-gray-300 rounded-full mr-2 justify-center shadow-sm">
            <Text className="text-gray-700 text-xs font-medium">All Domains ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-1.5 bg-[#0a66c2] rounded-full justify-center mr-4 shadow-sm">
            <Filter size={12} color="#ffffff" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-medium">Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>

        <View className="flex-row flex-wrap justify-between">
          {studentsData.map((student) => (
            <View key={student.id} className="bg-white w-[48%] rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
              <View className="h-16 bg-gray-200" />
              <View className="px-3 pb-4 items-center">
                <View className="mt-[-24px] mb-2 border-4 border-white rounded-full bg-white">
                  <Image 
                    source={{ uri: student.image }} 
                    className="w-12 h-12 rounded-full"
                  />
                </View>
                <Text className="font-semibold text-sm text-gray-900 text-center mb-1" numberOfLines={1}>{student.name}</Text>
                <Text className="text-[10px] text-gray-600 text-center mb-1" numberOfLines={1}>{student.college}</Text>
                <View className="px-2 py-0.5 bg-blue-50 rounded-full mb-3 mt-1">
                  <Text className="text-[#0a66c2] text-[9px] font-medium text-center">{student.domain}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => handleConnect(student.id)}
                  className={`w-full py-1.5 rounded-full flex-row items-center justify-center border ${
                    connected[student.id] 
                      ? 'bg-gray-100 border-gray-200' 
                      : 'border-[#0a66c2] bg-transparent'
                  }`}
                >
                  {connected[student.id] ? (
                    <>
                      <Check size={12} color="#4b5563" style={{ marginRight: 4 }} />
                      <Text className="text-gray-600 text-[10px] font-medium">Connected</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} color="#0a66c2" style={{ marginRight: 4 }} />
                      <Text className="text-[#0a66c2] text-[10px] font-medium">Connect</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
