import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, Modal, ActivityIndicator, Linking } from 'react-native';
import { Edit2, Share2, Plus, ExternalLink, Heart, MessageCircle, Download, LogOut, Camera, Search, Check, Send, Link, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

const domainsList = [
  'Backend Development', 'Web Development', 'Mobile App Development', 
  'Data Science & ML', 'Cloud Computing & DevOps', 'Game Development', 
  'Cybersecurity', 'Embedded Systems & IoT', 'Blockchain Development', 
  'Artificial Intelligence', 'Database Development'
];

export default function ProfileDashboardScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProjects, setUserProjects] = useState([]);

  // Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDomains, setEditDomains] = useState([]);
  const [editImage, setEditImage] = useState('');
  const [editDomainSearch, setEditDomainSearch] = useState('');
  const [updating, setUpdating] = useState(false);

  // Comments State
  const [commentProject, setCommentProject] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const fetchProfileAndProjects = async (user) => {
    try {
      const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setProfile(querySnapshot.docs[0].data());
      }

      const projectsQ = query(collection(db, 'projects'), where('uid', '==', user.uid));
      const projectsSnapshot = await getDocs(projectsQ);
      const loadedProjects = [];
      projectsSnapshot.forEach(doc => {
        loadedProjects.push({ id: doc.id, ...doc.data() });
      });

      loadedProjects.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      });

      setUserProjects(loadedProjects);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchProfileAndProjects(user);
      } else {
        navigation.replace('Login');
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOpenEditModal = () => {
    setEditFullName(profile?.fullName || '');
    setEditCollege(profile?.college || '');
    setEditBio(profile?.bio || '');
    setEditDomains(profile?.domains || []);
    setEditImage(profile?.imageUrl || '');
    setEditDomainSearch('');
    setIsEditModalOpen(true);
  };

  const handleEditImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.1,
      base64: true,
    });
    if (!result.canceled) {
      setEditImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const toggleEditDomain = (domain) => {
    if (editDomains.includes(domain)) {
      setEditDomains(editDomains.filter(d => d !== domain));
    } else {
      setEditDomains([...editDomains, domain]);
    }
  };

  const filteredDomainsList = domainsList.filter(d => 
    d.toLowerCase().includes(editDomainSearch.toLowerCase())
  );

  const handleUpdateProfile = async () => {
    if (!editFullName.trim() || !editCollege.trim()) return;
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');

      const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          fullName: editFullName,
          college: editCollege,
          bio: editBio,
          domains: editDomains,
          imageUrl: editImage,
        });

        setProfile(prev => ({
          ...prev,
          fullName: editFullName,
          college: editCollege,
          bio: editBio,
          domains: editDomains,
          imageUrl: editImage,
        }));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleLike = async (project) => {
    const user = auth.currentUser;
    if (!user) return;
    const hasLiked = (project.likedBy || []).includes(user.uid);
    const updatedLikes = hasLiked
      ? (project.likedBy || []).filter(uid => uid !== user.uid)
      : [...(project.likedBy || []), user.uid];

    try {
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, { likedBy: updatedLikes });
      setUserProjects(prev => prev.map(p => p.id === project.id ? { ...p, likedBy: updatedLikes } : p));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0a66c2" />
        <Text className="mt-4 text-gray-500">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Top Profile Card */}
        <View className="bg-white">
          <View className="h-32 bg-[#0a66c2] relative">
            <TouchableOpacity 
              onPress={handleOpenEditModal}
              className="absolute top-4 right-4 bg-black/20 p-2 rounded-full mt-10"
            >
              <Edit2 size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="px-6 pb-6 mt-[-40px]">
            <View className="flex-row justify-between items-end mb-4">
              <View className="border-4 border-white rounded-full bg-white shadow-sm">
                <Image 
                  source={{ uri: profile?.imageUrl || "https://api.dicebear.com/7.x/avataaars/png?seed=Felix" }} 
                  className="w-24 h-24 rounded-full"
                />
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <Text className="text-2xl font-bold text-gray-900">{profile?.fullName || "Anonymous Developer"}</Text>
                <View className="ml-3 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                  <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">Cambridge</Text>
                </View>
              </View>
              <Text className="text-gray-700 font-medium">
                {profile?.domains?.length > 0 ? profile.domains.slice(0, 2).join(' & ') : 'Software Developer'}
              </Text>
              <Text className="text-sm text-gray-500 mb-2">{profile?.college || "Cambridge Institute of Technology"}</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">{profile?.bio}</Text>
            </View>

            <View className="flex-row gap-4 mb-6">
              <TouchableOpacity><Link size={20} color="#6b7280" /></TouchableOpacity>
              <TouchableOpacity><Link size={20} color="#6b7280" /></TouchableOpacity>
              <TouchableOpacity><Link size={20} color="#6b7280" /></TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-full flex-row items-center">
                <Share2 size={14} color="#374151" />
                <Text className="ml-2 font-medium text-gray-700">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenEditModal} className="px-4 py-2 bg-[#0a66c2] rounded-full flex-row items-center">
                <Edit2 size={14} color="white" />
                <Text className="ml-2 font-medium text-white">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} className="px-4 py-2 border border-red-200 bg-red-50 rounded-full flex-row items-center">
                <LogOut size={14} color="#dc2626" />
                <Text className="ml-2 font-medium text-red-600">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Skills */}
        <View className="bg-white mt-4 p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-900 text-lg">Skills</Text>
            <TouchableOpacity onPress={handleOpenEditModal}>
              <Plus size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {(profile?.domains || ['React.js', 'Node.js', 'TypeScript', 'MongoDB']).map((skill, i) => (
              <View key={i} className="px-3 py-1.5 bg-gray-100 rounded-md border border-gray-200 mr-2 mb-2">
                <Text className="text-gray-700 text-sm font-medium">{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Projects */}
        <View className="bg-white mt-4 p-6 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-bold text-gray-900 text-lg">Uploaded Projects ({userProjects.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')} className="flex-row items-center">
              <Text className="text-[#0a66c2] font-medium mr-1">View all</Text>
              <ExternalLink size={14} color="#0a66c2" />
            </TouchableOpacity>
          </View>

          {userProjects.length > 0 ? (
            userProjects.map((project) => {
              const hasLiked = (project.likedBy || []).includes(auth.currentUser?.uid);
              return (
                <View key={project.id} className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  {project.image ? (
                    <Image source={{ uri: project.image }} className="w-full h-32 bg-gray-100" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-32 bg-blue-600 justify-center items-center">
                      <Text className="text-white font-bold">{project.title}</Text>
                    </View>
                  )}
                  <View className="p-4">
                    <Text className="font-bold mb-1">{project.title}</Text>
                    <Text className="text-gray-500 text-xs mb-3" numberOfLines={2}>{project.desc}</Text>
                    <View className="flex-row border-t border-gray-100 pt-3 justify-between">
                      <View className="flex-row gap-3">
                        <TouchableOpacity onPress={() => handleLike(project)} className="flex-row items-center">
                          <Heart size={14} color={hasLiked ? "#ef4444" : "#6b7280"} fill={hasLiked ? "#ef4444" : "transparent"} />
                          <Text className="text-xs text-gray-500 ml-1">{(project.likedBy || []).length}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-8 items-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Text className="text-gray-500 mb-2">You haven't uploaded any projects yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Projects')} className="bg-[#0a66c2] px-4 py-2 rounded-full">
                <Text className="text-white font-semibold text-xs">Upload Project</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-5/6">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              <View className="items-center mb-6">
                <TouchableOpacity onPress={handleEditImagePick} className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#0a66c2]">
                  <Image source={{ uri: editImage || profile?.imageUrl || "https://api.dicebear.com/7.x/avataaars/png?seed=Felix" }} className="w-full h-full" />
                  <View className="absolute inset-0 bg-black/40 justify-center items-center">
                    <Camera color="white" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="space-y-4 mb-10">
                <View className="mb-4">
                  <Text className="mb-1 text-gray-700 font-medium">Full Name</Text>
                  <TextInput className="border border-gray-300 rounded-lg p-3" value={editFullName} onChangeText={setEditFullName} />
                </View>
                <View className="mb-4">
                  <Text className="mb-1 text-gray-700 font-medium">College</Text>
                  <TextInput className="border border-gray-300 rounded-lg p-3" value={editCollege} onChangeText={setEditCollege} />
                </View>
                <View className="mb-4">
                  <Text className="mb-1 text-gray-700 font-medium">Bio</Text>
                  <TextInput className="border border-gray-300 rounded-lg p-3" value={editBio} onChangeText={setEditBio} multiline numberOfLines={3} style={{textAlignVertical:'top'}} />
                </View>
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-200 flex-row justify-end">
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="px-4 py-2 mr-2">
                <Text className="font-semibold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateProfile} className="bg-[#0a66c2] px-6 py-2 rounded-full flex-row items-center" disabled={updating}>
                {updating && <ActivityIndicator size="small" color="white" style={{marginRight: 8}}/>}
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
