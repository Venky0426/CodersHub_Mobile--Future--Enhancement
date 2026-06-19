import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Send, Target, Users } from 'lucide-react-native';

const startups = Array.from({ length: 4 }).map((_, i) => ({
  id: i,
  founder: ['Elon M.', 'Mark Z.', 'Sam A.', 'Vitalik B.'][i],
  founderImg: `https://api.dicebear.com/7.x/avataaars/png?seed=founder${i}`,
  title: ['NextGen EV Platform', 'Virtual Reality Social', 'AI Content Generator', 'Decentralized Finance Protocol'][i],
  desc: 'Looking for passionate co-founders and early engineers to build the MVP. We have initial seed funding and are ready to scale.',
  vision: 'To democratize access to cutting-edge technology for everyone, everywhere.',
  roles: [['Backend Developer', 'AI Engineer'], ['Mobile Developer', 'UI/UX Designer'], ['Cloud Engineer', 'DevOps Engineer'], ['Blockchain Developer', 'Backend Developer']][i]
}));

const StartupHub = () => {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      <View className="mb-8 mt-4">
        <Text className="text-2xl font-bold text-gray-900">Connect & Build Your Startup</Text>
        <Text className="text-gray-600 mt-1">Find co-founders, join early-stage startups, or pitch your idea</Text>
      </View>

      <View className="flex-col">
        {startups.map((startup) => (
          <View key={startup.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-col relative overflow-hidden mb-6">
            <View className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full"></View>
            
            <View className="flex-row items-start justify-between mb-5">
              <View className="flex-row items-center">
                <Image source={{ uri: startup.founderImg }} className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-200" />
                <View className="ml-4">
                  <Text className="font-bold text-lg text-gray-900 leading-tight">{startup.title}</Text>
                  <Text className="text-sm text-gray-500 mt-1">Founded by <Text className="font-medium text-gray-700">{startup.founder}</Text></Text>
                </View>
              </View>
            </View>

            <View className="flex-col">
              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <Target size={16} color="#0a66c2" style={{ marginRight: 8 }} />
                  <Text className="text-sm font-semibold text-gray-900">The Vision</Text>
                </View>
                <Text className="text-sm text-gray-600 italic">"{startup.vision}"</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm text-gray-700">{startup.desc}</Text>
              </View>

              <View>
                <View className="flex-row items-center mb-2">
                  <Users size={16} color="#0a66c2" style={{ marginRight: 8 }} />
                  <Text className="text-sm font-semibold text-gray-900">Required Roles</Text>
                </View>
                <View className="flex-row flex-wrap">
                  {startup.roles.map((role, idx) => (
                    <View key={idx} className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100 mr-2 mb-2">
                      <Text className="text-[#0a66c2] text-xs font-medium">{role}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="mt-6 pt-5 border-t border-gray-100">
              <TouchableOpacity className="w-full flex-row items-center justify-center px-4 py-2.5 bg-gray-900 rounded-lg">
                <Send size={16} color="white" style={{ marginRight: 8 }} /> 
                <Text className="text-white font-medium">Send Request to Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default StartupHub;
