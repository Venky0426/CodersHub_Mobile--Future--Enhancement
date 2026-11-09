import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

const CommunityScreen = ({ route, navigation }) => {
  const { communityName } = route.params || { communityName: 'Community' };

  return (
    <View className="flex-1 bg-white pt-10">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">{communityName}</Text>
      </View>
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500 text-center text-lg">Welcome to {communityName}!</Text>
        <Text className="text-gray-400 text-center mt-2">Posts and discussions for this community will appear here soon.</Text>
      </View>
    </View>
  );
};

export default CommunityScreen;
