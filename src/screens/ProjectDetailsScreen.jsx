import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { ArrowLeft, ExternalLink, Heart, MessageCircle, Code, CheckCircle } from 'lucide-react-native';

const ProjectDetailsScreen = ({ route, navigation }) => {
  const { project } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-white pt-10">
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>{project.title}</Text>
      </View>

      <ScrollView className="flex-1 bg-gray-50">
        <Image 
          source={{ uri: project.image || `https://picsum.photos/seed/${project.id}/800/400` }} 
          className="w-full h-64 bg-gray-200" 
          resizeMode="cover" 
        />
        
        <View className="p-5 bg-white mb-2 shadow-sm">
          <Text className="text-2xl font-bold text-gray-900 mb-3">{project.title}</Text>
          
          <View className="flex-row items-center mb-5">
            <Image source={{ uri: project.userImg }} className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
            <View>
              <Text className="text-sm text-gray-900 font-bold">{project.user}</Text>
              <Text className="text-xs text-gray-500">Project Contributor</Text>
            </View>
          </View>

          <Text className="text-base text-gray-700 leading-relaxed mb-5">
            {project.desc}
          </Text>

          <View className="flex-row flex-wrap mb-2">
            {project.tech && project.tech.map((t, i) => (
              <View key={i} className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100 mr-2 mb-2">
                <Text className="text-xs font-bold text-[#0a66c2] uppercase tracking-wider">{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="p-5 bg-white mb-2 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Code size={20} color="#0a66c2" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Implementation</Text>
          </View>
          <View className="pl-1">
            <View className="flex-row items-start mb-4">
              <View className="w-1.5 h-1.5 rounded-full bg-[#0a66c2] mt-1.5 mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">Why</Text>
                <Text className="text-sm text-gray-600 leading-relaxed">Built to provide a scalable and efficient solution to real-world workflow bottlenecks.</Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <View className="w-1.5 h-1.5 rounded-full bg-[#0a66c2] mt-1.5 mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">How</Text>
                <Text className="text-sm text-gray-600 leading-relaxed">By designing a decoupled architecture, ensuring clean state management, and following modern UI principles.</Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <View className="w-1.5 h-1.5 rounded-full bg-[#0a66c2] mt-1.5 mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">Tech Stack</Text>
                <Text className="text-sm text-gray-600 leading-relaxed">{project.tech ? project.tech.join(', ') : 'React Native, Firebase, Node.js, Tailwind CSS'}</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-[#0a66c2] mt-1.5 mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">Integration</Text>
                <Text className="text-sm text-gray-600 leading-relaxed">Can be integrated using RESTful APIs or by dropping the standalone module directly into your existing ecosystem.</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="p-5 bg-white mb-8 shadow-sm">
          <View className="flex-row items-center mb-4">
            <CheckCircle size={20} color="#10b981" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Outcomes</Text>
          </View>
          <View className="pl-1">
            <View className="flex-row items-start mb-3">
              <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-3" />
              <Text className="text-sm text-gray-700 flex-1 leading-relaxed">Achieved a highly responsive user interface with consistent 60fps scrolling performance.</Text>
            </View>
            <View className="flex-row items-start mb-3">
              <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-3" />
              <Text className="text-sm text-gray-700 flex-1 leading-relaxed">Successfully structured the codebase allowing for rapid addition of new features.</Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-3" />
              <Text className="text-sm text-gray-700 flex-1 leading-relaxed">Implemented a secure and scalable data storage model that handles offline scenarios effectively.</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200 flex-row justify-between items-center">
        <View className="flex-row space-x-6">
          <View className="flex-row items-center mr-6">
            <Heart size={22} color="#6b7280" />
            <Text className="ml-2 font-semibold text-gray-600 text-sm">{(project.likedBy || []).length}</Text>
          </View>
          <View className="flex-row items-center">
            <MessageCircle size={22} color="#6b7280" />
            <Text className="ml-2 font-semibold text-gray-600 text-sm">{(project.comments || []).length}</Text>
          </View>
        </View>
        {project.repoLink && (
          <TouchableOpacity 
            className="bg-[#0a66c2] flex-row items-center px-5 py-2.5 rounded-full shadow-sm"
            onPress={() => Linking.openURL(project.repoLink)}
          >
            <ExternalLink size={16} color="white" />
            <Text className="text-white font-bold ml-2">View Source</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProjectDetailsScreen;
