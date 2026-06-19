import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, TextInput, 
  Modal, ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform
} from 'react-native';
import { Upload, Heart, MessageCircle, Share2, Download, UserPlus, Send, X, ChevronDown, Star } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';

const initialProjects = Array.from({ length: 6 }).map((_, i) => ({
  id: `static-${i}`,
  title: [
    'E-Commerce Dashboard',
    'AI Code Reviewer',
    'Crypto Portfolio Tracker',
    'Task Management App',
    'Real-time Chat',
    'Weather Predictor',
  ][i],
  desc: 'A comprehensive solution built with modern web technologies. Features include real-time updates, secure authentication, and a responsive design.',
  tech: ['React', 'Node.js', 'MongoDB', 'Tailwind'][i % 4]
    ? ['React', 'Node.js', 'MongoDB']
    : ['Python', 'TensorFlow', 'FastAPI'],
  image: `https://picsum.photos/seed/coderhub-project-${i}/800/400`,
  user: `Developer ${i + 1}`,
  userImg: `https://api.dicebear.com/7.x/avataaars/svg?seed=proj${i}`,
  repoLink: 'https://github.com',
  likedBy: [],
  comments: [],
  downloadsCount: Math.floor(Math.random() * 15) + 3,
}));

const ProjectsScreen = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [manualTech, setManualTech] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef(null);

  // Comments State
  const [commentProject, setCommentProject] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const firestoreProjects = [];
      querySnapshot.forEach((doc) => {
        firestoreProjects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setProjects([...firestoreProjects, ...initialProjects]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects(initialProjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setManualImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleAddProject = async () => {
    if (!repoUrl) {
      Alert.alert('Error', 'Please enter a GitHub repository URL');
      return;
    }
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/i);
    if (!match) {
      Alert.alert('Error', 'Please enter a valid GitHub repository URL');
      return;
    }
    let [, owner, repo] = match;
    repo = repo.replace(/\.git$/i, '');
    
    setSubmitting(true);

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!res.ok) throw new Error('GitHub repository not found.');
      const data = await res.json();
      
      const techArray = manualTech
        ? manualTech.split(',').map(t => t.trim()).filter(Boolean)
        : data.topics?.slice(0, 4) || ['GitHub', 'Web'];

      const user = auth.currentUser;
      let uName = 'Anonymous Coder';
      let uImg = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

      if (user) {
        const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          uName = profileData.fullName || uName;
          uImg = profileData.imageUrl || uImg;
        } else {
          uName = user.email ? user.email.split('@')[0] : uName;
        }
      }

      const newProject = {
        title: manualTitle || data.name || data.full_name,
        desc: manualDesc || data.description || 'No description provided.',
        tech: techArray,
        image: manualImage || data.owner?.avatar_url || '',
        user: uName,
        userImg: uImg,
        repoLink: data.html_url,
        uid: user ? user.uid : 'anonymous',
        createdAt: new Date().toISOString(),
        likedBy: [],
        comments: [],
        downloadsCount: 0,
      };

      await addDoc(collection(db, 'projects'), newProject);
      await fetchProjects();

      setRepoUrl('');
      setManualTitle('');
      setManualDesc('');
      setManualImage('');
      setManualTech('');
      setShowModal(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to fetch repository details or save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (project) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like projects!');
      return;
    }

    const isStatic = project.id.startsWith('static-');
    const hasLiked = (project.likedBy || []).includes(user.uid);
    const updatedLikes = hasLiked
      ? (project.likedBy || []).filter(uid => uid !== user.uid)
      : [...(project.likedBy || []), user.uid];

    if (isStatic) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, likedBy: updatedLikes } : p));
    } else {
      try {
        const docRef = doc(db, 'projects', project.id);
        await updateDoc(docRef, { likedBy: updatedLikes });
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, likedBy: updatedLikes } : p));
      } catch (error) {
        console.error('Error liking project:', error);
      }
    }
  };

  const handleDownload = async (project) => {
    if (!project.repoLink || project.repoLink === '#') {
      Alert.alert('Notice', 'No repository link available for this project.');
      return;
    }

    Linking.openURL(project.repoLink);

    const isStatic = project.id.startsWith('static-');
    const newCount = (project.downloadsCount || 0) + 1;

    if (isStatic) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, downloadsCount: newCount } : p));
    } else {
      try {
        const docRef = doc(db, 'projects', project.id);
        await updateDoc(docRef, { downloadsCount: newCount });
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, downloadsCount: newCount } : p));
      } catch (error) {
        console.error('Error incrementing download count:', error);
      }
    }
  };

  const handleShare = (project) => {
    Alert.alert('Share Project', `Repository Link: ${project.repoLink}`);
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login Required', 'Please log in to comment!');
      return;
    }

    setPostingComment(true);

    try {
      let commenterName = 'Anonymous Coder';
      let commenterImg = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

      const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        commenterName = profileData.fullName || commenterName;
        commenterImg = profileData.imageUrl || commenterImg;
      } else {
        commenterName = user.email ? user.email.split('@')[0] : commenterName;
      }

      const commentObj = {
        uid: user.uid,
        userName: commenterName,
        userImg: commenterImg,
        text: newCommentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const isStatic = commentProject.id.startsWith('static-');
      const updatedComments = [...(commentProject.comments || []), commentObj];

      if (isStatic) {
        setProjects(prev => prev.map(p => p.id === commentProject.id ? { ...p, comments: updatedComments } : p));
        setCommentProject(prev => ({ ...prev, comments: updatedComments }));
      } else {
        const docRef = doc(db, 'projects', commentProject.id);
        await updateDoc(docRef, { comments: updatedComments });
        setProjects(prev => prev.map(p => p.id === commentProject.id ? { ...p, comments: updatedComments } : p));
        setCommentProject(prev => ({ ...prev, comments: updatedComments }));
      }

      setNewCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again!');
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Build. Share.</Text>
              <Text className="text-gray-600 mt-1">Discover amazing projects</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="flex-row items-center bg-[#0a66c2] px-4 py-2 rounded-full shadow-sm"
            >
              <Upload size={16} color="white" />
              <Text className="text-white font-medium ml-2 text-sm">Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Projects Today */}
        <View className="bg-white rounded-2xl border border-blue-100 p-4 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center">
              <Star size={20} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 6 }} />
              <Text className="text-lg font-bold text-gray-900">Top Projects Today</Text>
            </View>
            <TouchableOpacity className="p-1 bg-blue-50 rounded-full">
              <ChevronDown size={16} color="#0a66c2" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-500 mb-4">Trending projects this week</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {projects.slice(0, 5).map((proj, idx) => {
              const rankColor = ['#facc15', '#9ca3af', '#d97706', '#6b7280', '#6b7280'][idx] || '#6b7280';
              return (
              <TouchableOpacity 
                key={proj.id} 
                className="w-36 mr-3 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                onPress={() => handleDownload(proj)}
              >
                <View className="relative">
                  <Image source={{ uri: proj.image || `https://picsum.photos/seed/${proj.id}/300/200` }} className="w-full h-24" resizeMode="cover" />
                  <View className="absolute top-2 left-2 w-5 h-5 rounded-full items-center justify-center border border-white" style={{ backgroundColor: rankColor }}>
                    <Text className="text-white text-[10px] font-bold">{idx + 1}</Text>
                  </View>
                </View>
                <View className="p-2.5">
                  <Text className="font-bold text-xs text-gray-900 mb-1.5 leading-tight" numberOfLines={2}>{proj.title}</Text>
                  <View className="flex-row items-center mb-2">
                    <Image source={{ uri: proj.userImg }} className="w-4 h-4 rounded-full mr-1.5 bg-gray-200" />
                    <Text className="text-[10px] text-gray-600" numberOfLines={1}>{proj.user}</Text>
                  </View>
                  <View className="flex-row items-center space-x-3">
                    <View className="flex-row items-center mr-2">
                      <Heart size={10} color="#ef4444" fill="#ef4444" />
                      <Text className="text-[9px] text-gray-500 ml-1">{(proj.likedBy || []).length}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <MessageCircle size={10} color="#6b7280" />
                      <Text className="text-[9px] text-gray-500 ml-1">{(proj.comments || []).length}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )})}
          </ScrollView>
          
          <TouchableOpacity 
            className="mt-4 bg-blue-50 py-2.5 rounded-lg items-center border border-blue-100 flex-row justify-center"
            onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            <Text className="text-[#0a66c2] font-semibold text-sm mr-1">View All Top Projects</Text>
            <Text className="text-[#0a66c2] text-sm">→</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#0a66c2" />
            <Text className="text-gray-500 mt-4">Loading projects...</Text>
          </View>
        ) : (
          <View className="flex-col">
            {projects.map((project, idx) => {
              const hasLiked = (project.likedBy || []).includes(auth.currentUser?.uid);
              return (
                <View key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                  <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
                    <View className="flex-row items-center gap-3">
                      <Image source={{ uri: project.userImg }} className="w-10 h-10 rounded-full bg-gray-100" />
                      <View>
                        <View className="flex-row items-center">
                          <Text className="font-semibold text-sm text-gray-900">{project.user}</Text>
                          <View className="ml-2 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">
                            <Text className="text-blue-700 text-[9px] font-bold uppercase tracking-wider">Cambridge</Text>
                          </View>
                          {idx < 3 && (
                            <View className="ml-2 px-2 py-0.5 bg-blue-50 rounded-full">
                              <Text className="text-[10px] font-semibold text-[#0a66c2]">Featured</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[10px] text-gray-400">Project Contributor</Text>
                      </View>
                    </View>
                    <TouchableOpacity className="p-1.5 bg-blue-50 rounded-full">
                      <UserPlus size={16} color="#0a66c2" />
                    </TouchableOpacity>
                  </View>

                  {project.image ? (
                    <Image source={{ uri: project.image }} className="w-full h-44 bg-gray-100" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-44 bg-blue-600 items-center justify-center">
                      <Text className="text-white font-bold text-lg">{project.title}</Text>
                    </View>
                  )}

                  <View className="p-5">
                    <Text className="font-bold text-base text-gray-900 mb-2" numberOfLines={1}>{project.title}</Text>
                    <Text className="text-gray-600 text-sm mb-4" numberOfLines={2}>{project.desc}</Text>
                    
                    <View className="flex-row flex-wrap mb-4">
                      {project.tech && project.tech.map((t, i) => (
                        <View key={i} className="px-2 py-1 bg-gray-100 rounded-md border border-gray-200 mr-2 mb-2">
                          <Text className="text-gray-600 text-[11px] font-medium">{t}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="pt-4 border-t border-gray-100 flex-row justify-between items-center">
                      <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => handleLike(project)} className="flex-row items-center">
                          <Heart size={16} color={hasLiked ? "#ef4444" : "#6b7280"} fill={hasLiked ? "#ef4444" : "transparent"} />
                          <Text className="ml-1 text-xs text-gray-600">{(project.likedBy || []).length}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCommentProject(project)} className="flex-row items-center">
                          <MessageCircle size={16} color="#6b7280" />
                          <Text className="ml-1 text-xs text-gray-600">{(project.comments || []).length}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleShare(project)} className="flex-row items-center">
                          <Share2 size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleDownload(project)}
                        className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200"
                      >
                        <Download size={14} color="#374151" />
                        <Text className="ml-1 text-xs font-semibold text-gray-700">Code</Text>
                        <Text className="ml-1 text-[10px] text-gray-400">({project.downloadsCount || 0})</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-5/6">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-bold">Add Project via GitHub URL</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
              <View className="space-y-4 mb-10">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">GitHub Repo URL *</Text>
                  <TextInput
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChangeText={setRepoUrl}
                    autoCapitalize="none"
                  />
                </View>
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Project Title</Text>
                  <TextInput
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Leave empty to fetch from GitHub"
                    value={manualTitle}
                    onChangeText={setManualTitle}
                  />
                </View>
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Project Description</Text>
                  <TextInput
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Leave empty to fetch from GitHub"
                    value={manualDesc}
                    onChangeText={setManualDesc}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Tech Stack (comma separated)</Text>
                  <TextInput
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="React, Node, Firebase"
                    value={manualTech}
                    onChangeText={setManualTech}
                  />
                </View>
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Upload Project Banner</Text>
                  <TouchableOpacity 
                    onPress={handleImagePick}
                    className="bg-blue-50 py-2 px-4 rounded-full border border-blue-100 items-center"
                  >
                    <Text className="text-[#0a66c2] font-semibold text-sm">Choose Image</Text>
                  </TouchableOpacity>
                  {manualImage ? (
                    <Image source={{ uri: manualImage }} className="w-full h-32 mt-3 rounded-lg border border-gray-200" resizeMode="cover" />
                  ) : null}
                </View>
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-200 flex-row justify-end space-x-3 bg-white">
              <TouchableOpacity
                className="px-4 py-2 bg-gray-100 rounded-full mr-2"
                onPress={() => setShowModal(false)}
                disabled={submitting}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-5 py-2 rounded-full items-center justify-center flex-row ${submitting ? 'bg-blue-300' : 'bg-[#0a66c2]'}`}
                onPress={handleAddProject}
                disabled={submitting}
              >
                {submitting && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
                <Text className="text-white font-semibold">Add Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={!!commentProject} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-2/3">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <View>
                <Text className="text-lg font-bold">Comments</Text>
                <Text className="text-xs text-gray-500">{commentProject?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setCommentProject(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-4 bg-gray-50" keyboardShouldPersistTaps="handled">
              {commentProject?.comments?.length > 0 ? (
                commentProject.comments.map((cmt, i) => (
                  <View key={i} className="flex-row bg-white p-3 mb-3 rounded-lg border border-gray-100 shadow-sm">
                    <Image source={{ uri: cmt.userImg || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" }} className="w-8 h-8 rounded-full mr-3" />
                    <View className="flex-1">
                      <View className="flex-row justify-between">
                        <Text className="font-semibold text-xs text-gray-900">{cmt.userName}</Text>
                        <Text className="text-[10px] text-gray-400">
                          {cmt.createdAt ? new Date(cmt.createdAt).toLocaleDateString() : 'Just now'}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-600 mt-1">{cmt.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-10">
                  <MessageCircle size={40} color="#d1d5db" />
                  <Text className="text-gray-500 font-medium mt-2">No comments yet</Text>
                  <Text className="text-gray-400 text-xs mt-1">Be the first to share your thoughts!</Text>
                </View>
              )}
            </ScrollView>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="p-3 border-t border-gray-200 bg-white flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm mr-2 bg-gray-50"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  onSubmitEditing={handlePostComment}
                />
                <TouchableOpacity
                  onPress={handlePostComment}
                  disabled={postingComment || !newCommentText.trim()}
                  className={`p-2 rounded-full items-center justify-center ${postingComment || !newCommentText.trim() ? 'bg-blue-200' : 'bg-[#0a66c2]'}`}
                >
                  {postingComment ? <ActivityIndicator size="small" color="white" /> : <Send size={16} color="white" />}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProjectsScreen;
