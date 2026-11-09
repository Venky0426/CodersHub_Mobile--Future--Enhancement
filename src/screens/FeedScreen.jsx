import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TouchableOpacity, TextInput, ScrollView, Modal, 
  KeyboardAvoidingView, Platform, Alert, Dimensions, Share, RefreshControl 
} from 'react-native';
import { Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, X, Send, Plus, Image as ImageIcon, Gift, Rocket, GraduationCap, Trophy, Briefcase } from 'lucide-react-native';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import EventsSlideshowNative from '../components/EventsSlideshowNative';

const { width } = Dimensions.get('window');

const FeedScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  
  const [selectedStory, setSelectedStory] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryImage, setNewStoryImage] = useState('');
  
  const [currentUserAvatar, setCurrentUserAvatar] = useState('https://randomuser.me/api/portraits/men/46.jpg');
  const [currentUserFullName, setCurrentUserFullName] = useState('Current User');
  const [currentUserRole, setCurrentUserRole] = useState('Student');
  const [currentUserCollege, setCurrentUserCollege] = useState('Cambridge'); // Extracted college tag
  
  // Track open comment sections
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Since Firebase onSnapshot is already real-time, this provides a visual refresh feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

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
            
            // Extract the first word of the college as a quick badge tag
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

  // Default static data fallback if Firestore rules deny access
  const defaultPosts = [
    {
      id: 1,
      author: 'Sarah Developer',
      role: "Full Stack Dev | MIT '24",
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: 'Just completed our latest hackathon project! 🚀 Built a decentralized voting application using React, Node.js, and Solidity. Learned a lot about smart contract security. Check it out! #Web3 #Hackathon #ReactJS',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      time: '2h ago',
      likes: 42,
      likedBy: [],
      comments: [
        { id: 1, author: 'Alex Coder', text: 'Great work! The UI looks amazing.' }
      ],
    }
  ];

  const defaultStories = [
    { id: 1, name: 'Stanford Hack', seed: 'women/21.jpg', type: 'image', content: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80' }
  ];

  // Fetch real-time posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('id', 'desc')); 
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      setPosts(fetchedPosts.length > 0 ? fetchedPosts : defaultPosts);
    }, (error) => {
      console.warn("Firestore access denied for posts. Falling back to static data. Please update Firebase rules.", error);
      Alert.alert("Firestore Error (Posts)", error.message + "\n\nDid you publish the updated Security Rules in your Firebase Console?");
      setPosts(defaultPosts);
    });
    return () => unsubscribePosts();
  }, []);

  // Fetch real-time stories
  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('id', 'desc'));
    const unsubscribeStories = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      setStories(fetchedStories.length > 0 ? fetchedStories : defaultStories);
    }, (error) => {
      console.warn("Firestore access denied for stories. Falling back to static data. Please update Firebase rules.", error);
      Alert.alert("Firestore Error (Stories)", error.message + "\n\nDid you publish the updated Security Rules in your Firebase Console?");
      setStories(defaultStories);
    });
    return () => unsubscribeStories();
  }, []);

  const handleLike = async (post) => {
    if (!post.fbId) return;
    const user = auth.currentUser;
    if (!user) return;

    // We implement likes as an array of user IDs
    const currentLikes = post.likedBy || [];
    const hasLiked = currentLikes.includes(user.uid);
    let updatedLikes = [];
    
    if (hasLiked) {
      updatedLikes = currentLikes.filter(id => id !== user.uid);
    } else {
      updatedLikes = [...currentLikes, user.uid];
    }

    try {
      const postRef = doc(db, 'posts', post.fbId);
      await updateDoc(postRef, {
        likedBy: updatedLikes,
        likes: updatedLikes.length
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentToggle = (postId) => {
    setOpenComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    setActiveCommentPostId(prev => prev === postId ? null : postId);
  };

  const handleAddComment = async (post) => {
    if (!post.fbId) return;
    const text = commentInputs[post.id];
    if (!text || !text.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    const newComment = {
      id: Date.now(),
      author: currentUserFullName,
      text: text.trim(),
      avatar: currentUserAvatar,
      uid: user.uid
    };

    const updatedComments = [...(post.comments || []), newComment];

    try {
      const postRef = doc(db, 'posts', post.fbId);
      await updateDoc(postRef, { comments: updatedComments });
      // Clear input
      setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // NO CROPPING
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
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
      setNewPostContent('');
      setNewPostImage('');
      setIsPostModalOpen(false);
    } catch (err) {
      console.error('Error creating post', err);
      Alert.alert("Error", "Failed to create post: " + err.message);
    }
  };

  const handleCreateStory = async () => {
    if (!newStoryName.trim() || (!newStoryText.trim() && !newStoryImage)) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to add a story.");
      return;
    }

    const newStory = {
      id: Date.now(),
      uid: user.uid,
      name: newStoryName.trim(),
      seed: currentUserAvatar,
      type: newStoryImage ? 'image' : 'text',
      content: newStoryImage || newStoryText.trim(),
      textContent: newStoryImage ? newStoryText.trim() : null
    };

    try {
      await addDoc(collection(db, 'stories'), newStory);
      setNewStoryName('');
      setNewStoryText('');
      setNewStoryImage('');
      setIsStoryModalOpen(false);
    } catch (err) {
      console.error('Error creating story', err);
      Alert.alert("Error", "Failed to create story: " + err.message);
    }
  };

  const handleDeletePost = (post) => {
    if (!post.fbId) return;
    const user = auth.currentUser;
    if (!user || user.uid !== post.uid) {
      Alert.alert("Unauthorized", "You can only delete your own posts.");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', post.fbId));
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete post");
            }
          }
        }
      ]
    );
  };

  const handleShare = async (post) => {
    try {
      await Share.share({
        message: post.content ? `${post.author} shared: ${post.content}` : `Check out this post by ${post.author}`,
        url: post.image || undefined,
        title: `Post by ${post.author}`
      });
    } catch (error) {
      console.error('Error sharing', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-100"
    >
      <ScrollView 
        className="flex-1" 
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a66c2']} />
        }
      >

        {/* Quick Links Header */}
        <View className="bg-white py-4 border-b border-gray-100 mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {[
              { id: 1, title: 'Startup Hub', subtitle: 'Build & Launch Startups', icon: Rocket, color: '#10b981', bg: '#d1fae5', screen: 'StartupHub' },
              { id: 2, title: 'Workshops', subtitle: 'Learn & Grow Together', icon: GraduationCap, color: '#8b5cf6', bg: '#ede9fe' },
              { id: 3, title: 'Hackathons', subtitle: 'Compete & Win Prizes', icon: Trophy, color: '#f59e0b', bg: '#fef3c7' },
              { id: 4, title: 'Jobs', subtitle: 'Find Opportunities Near You', icon: Briefcase, color: '#3b82f6', bg: '#dbeafe' },
            ].map(item => (
              <TouchableOpacity 
                key={item.id} 
                className="bg-white rounded-2xl border border-gray-100 p-3 mr-3 shadow-sm w-36 items-center"
                onPress={() => item.screen ? navigation.navigate(item.screen) : null}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: item.bg }}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text className="font-bold text-gray-900 text-[13px] text-center">{item.title}</Text>
                <Text className="text-[10px] text-gray-500 text-center mt-1" numberOfLines={2}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Post List */}
        {posts.length === 0 ? (
          <View className="p-8 items-center justify-center">
             <Text className="text-gray-500">No posts yet. Be the first to share!</Text>
          </View>
        ) : posts.map((post, index) => {
          const isLiked = auth.currentUser ? (post.likedBy || []).includes(auth.currentUser.uid) : false;
          const isCommentOpen = openComments[post.id];
          const postComments = post.comments || [];
          
          return (
          <React.Fragment key={post.id}>
          <View className="bg-white mb-4 border-t border-b border-gray-200">
            <View className="p-4 flex-row justify-between items-start">
              <View className="flex-row">
                <Image source={{ uri: post.avatar || 'https://randomuser.me/api/portraits/men/46.jpg' }} className="w-12 h-12 rounded-full mr-3 bg-gray-200" />
                <View>
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-gray-900">{post.author}</Text>
                    <View className="bg-blue-100 px-1.5 py-0.5 rounded-full ml-2 border border-blue-200">
                      <Text className="text-blue-700 text-[9px] font-bold uppercase tracking-wider">Cambridge</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500 mt-0.5">{post.role}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{post.time}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeletePost(post)}>
                <MoreHorizontal size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {post.content ? (
              <Text className="px-4 text-gray-800 text-sm mb-3">{post.content}</Text>
            ) : null}

            {post.image ? (
              <Image source={{ uri: post.image }} className="w-full h-96 bg-gray-50" resizeMode="contain" />
            ) : null}

            <View className="px-4 py-2 border-b border-gray-100 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Heart size={14} color="#0a66c2" fill="#0a66c2" />
                <Text className="text-xs text-gray-500 ml-1">{post.likes || 0}</Text>
              </View>
              <Text className="text-xs text-gray-500">{postComments.length} comments</Text>
            </View>

            <View className="flex-row justify-around py-2">
              <TouchableOpacity 
                onPress={() => handleLike(post)}
                className="flex-row items-center"
              >
                <Heart size={20} color={isLiked ? "#0a66c2" : "#6b7280"} fill={isLiked ? "#0a66c2" : "transparent"} />
                <Text className={`ml-2 text-sm font-semibold ${isLiked ? 'text-[#0a66c2]' : 'text-gray-500'}`}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleCommentToggle(post.id)}
                className="flex-row items-center"
              >
                <MessageCircle size={20} color={isCommentOpen ? "#0a66c2" : "#6b7280"} />
                <Text className={`ml-2 text-sm font-semibold ${isCommentOpen ? 'text-[#0a66c2]' : 'text-gray-500'}`}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleShare(post)} className="flex-row items-center">
                <Share2 size={20} color="#6b7280" />
                <Text className="ml-2 text-sm font-semibold text-gray-500">Share</Text>
              </TouchableOpacity>
            </View>

            {isCommentOpen && (
              <View className="p-4 bg-gray-50 border-t border-gray-100">

                {postComments.map((comment, idx) => (
                  <View key={comment.id || idx} className="flex-row mb-3">
                    <Image source={{ uri: comment.avatar || `https://randomuser.me/api/portraits/lego/${idx % 9}.jpg` }} className="w-8 h-8 rounded-full mr-2 bg-gray-200" />
                    <View className="flex-1 bg-white p-2 rounded-lg border border-gray-200">
                      <Text className="font-semibold text-xs">{comment.author}</Text>
                      <Text className="text-xs text-gray-700 mt-1">{comment.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {index === 0 && (
            <View className="mb-4 pt-2">
              <Text className="text-[14px] font-bold text-gray-900 px-4 mb-3">Recommended Communities</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {[
                  { name: 'AIML Community', members: '1.2K members', img: 'https://api.dicebear.com/7.x/shapes/png?seed=aiml' },
                  { name: 'Web Dev Community', members: '2.5K members', img: 'https://api.dicebear.com/7.x/shapes/png?seed=web' },
                  { name: 'UI/UX Community', members: '800 members', img: 'https://api.dicebear.com/7.x/shapes/png?seed=uiux' }
                ].map((comm, idx) => (
                  <View key={idx} className="bg-white border border-gray-200 rounded-xl p-3 mr-3 w-[140px] items-center shadow-sm">
                    <Image source={{ uri: comm.img }} className="w-12 h-12 rounded-lg bg-gray-100 mb-2" />
                    <Text className="text-gray-900 font-bold text-[13px] text-center mb-0.5" numberOfLines={1}>{comm.name}</Text>
                    <Text className="text-gray-500 text-[11px] text-center mb-3">{comm.members}</Text>
                    <TouchableOpacity 
                      className="bg-[#0a66c2] px-6 py-1.5 rounded-full w-full items-center"
                      onPress={() => navigation.navigate('Community', { communityName: comm.name })}
                    >
                      <Text className="text-white text-[11px] font-bold">Join</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          </React.Fragment>
          );
        })}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Sheet Comment Modal */}
      {activeCommentPostId && (
        <Modal visible={!!activeCommentPostId} animationType="slide" transparent={true}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
            <TouchableOpacity 
              className="flex-1 bg-black/50" 
              activeOpacity={1} 
              onPress={() => setActiveCommentPostId(null)} 
            />
            <View className="bg-white rounded-t-3xl h-[75%] w-full flex-col">
              
              {/* Drag Handle & Title */}
              <View className="items-center py-3 border-b border-gray-200">
                <View className="w-12 h-1 bg-gray-300 rounded-full mb-3" />
                <Text className="font-bold text-gray-900 text-base">Comments</Text>
              </View>

              {/* Comments List */}
              <ScrollView className="flex-1 p-4">
                {(() => {
                  const activePost = posts.find(p => p.id === activeCommentPostId);
                  const comments = activePost?.comments || [];
                  if (comments.length === 0) {
                    return <Text className="text-gray-500 text-center mt-4">No comments yet. Be the first to comment!</Text>;
                  }
                  return comments.map((comment, idx) => (
                    <View key={comment.id || idx} className="flex-row mb-4">
                      <Image source={{ uri: comment.avatar || `https://randomuser.me/api/portraits/lego/${idx % 9}.jpg` }} className="w-8 h-8 rounded-full mr-3 bg-gray-200" />
                      <View className="flex-1">
                        <Text className="font-semibold text-xs text-gray-900 mb-0.5">{comment.author}</Text>
                        <Text className="text-sm text-gray-800">{comment.text}</Text>
                        <Text className="text-[10px] text-gray-500 mt-1">Reply</Text>
                      </View>
                      <TouchableOpacity>
                        <Heart size={14} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  ));
                })()}
              </ScrollView>

              {/* Instagram-Style Composer */}
              <View className="border-t border-gray-200 bg-white pb-6 pt-3 px-4">
                {/* Emojis */}
                <View className="flex-row justify-between px-2 mb-3">
                  {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(emoji => (
                    <TouchableOpacity key={emoji} onPress={() => setCommentInputs(prev => ({ ...prev, [activeCommentPostId]: (prev[activeCommentPostId] || '') + emoji }))}>
                      <Text className="text-2xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Input Row */}
                <View className="flex-row items-center">
                  <Image source={{ uri: currentUserAvatar }} className="w-10 h-10 rounded-full mr-3" />
                  <View className="flex-1 flex-row items-center border border-gray-300 rounded-full pl-4 pr-1 py-1 bg-gray-50">
                    <TextInput 
                      className="flex-1 py-1 text-sm max-h-24"
                      placeholder="Add a comment..."
                      multiline
                      value={commentInputs[activeCommentPostId] || ''}
                      onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [activeCommentPostId]: text }))}
                    />
                    <TouchableOpacity className="border border-gray-400 rounded px-1.5 py-0.5 mx-2 bg-white">
                      <Text className="text-[10px] font-bold text-gray-600">GIF</Text>
                    </TouchableOpacity>
                    {commentInputs[activeCommentPostId]?.trim() ? (
                      <TouchableOpacity 
                        onPress={() => {
                          const activePost = posts.find(p => p.id === activeCommentPostId);
                          if (activePost) handleAddComment(activePost);
                        }} 
                        className="p-1 mx-1"
                      >
                        <Send size={18} color="#0a66c2" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity className="ml-3 p-1">
                    <Gift size={24} color="#4b5563" />
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}


      {/* Floating Events Bubble (Native Version) */}
      <EventsSlideshowNative />



      {/* Add Story Modal */}
      <Modal visible={isStoryModalOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl h-[80%]">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Add to Story</Text>
              <TouchableOpacity onPress={() => setIsStoryModalOpen(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4 mb-20">
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-500 uppercase mb-1">Story Title</Text>
                <TextInput
                  className="w-full border border-gray-300 rounded-lg p-2 focus:border-linkedin-blue"
                  placeholder="e.g., My Coding Journey"
                  value={newStoryName}
                  onChangeText={setNewStoryName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-500 uppercase mb-1">Text Overlay</Text>
                <TextInput
                  className="w-full border border-gray-300 rounded-lg p-2 h-24"
                  placeholder="Write something cool... 🦄"
                  multiline
                  style={{ textAlignVertical: 'top' }}
                  value={newStoryText}
                  onChangeText={setNewStoryText}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-1">Upload Full Image</Text>
                <View className="mt-1">
                  {newStoryImage ? (
                    <View className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                      <Image source={{ uri: newStoryImage }} className="w-full h-64" resizeMode="contain" />
                      <TouchableOpacity
                        onPress={() => setNewStoryImage('')}
                        className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
                      >
                        <X size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handlePickImage(setNewStoryImage)}
                      className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                    >
                      <ImageIcon size={32} color="#9ca3af" className="mb-2" />
                      <Text className="text-xs text-gray-500 font-medium">Tap to pick a full photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            <View className="p-4 border-t border-gray-200 absolute bottom-0 w-full bg-white flex-row justify-between items-center pb-8">
              <View></View>
              <TouchableOpacity 
                disabled={!newStoryName.trim() || (!newStoryText.trim() && !newStoryImage)}
                onPress={handleCreateStory}
                className={`px-8 py-3 rounded-full ${newStoryName.trim() && (newStoryText.trim() || newStoryImage) ? 'bg-[#0a66c2]' : 'bg-gray-300'}`}
              >
                <Text className={`font-bold ${newStoryName.trim() && newStoryContent ? 'text-white' : 'text-gray-500'}`}>Add to Story</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <Modal visible={!!selectedStory} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/95">
            <TouchableOpacity 
              className="absolute top-12 right-6 z-50 p-2"
              onPress={() => setSelectedStory(null)}
            >
              <X size={32} color="white" />
            </TouchableOpacity>
            <View className="flex-1 items-center justify-center p-4 w-full">
              {selectedStory.type === 'image' ? (
                <View className="w-full h-3/4 rounded-2xl overflow-hidden relative bg-black/50">
                  <Image source={{ uri: selectedStory.content }} className="w-full h-full" resizeMode="contain" />
                  {selectedStory.textContent ? (
                    <View className="absolute bottom-0 w-full bg-black/60 p-4">
                      <Text className="text-white text-lg font-semibold text-center">{selectedStory.textContent}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="w-full h-3/4 rounded-2xl bg-blue-500 items-center justify-center p-8">
                  <Text className="text-white text-3xl font-bold text-center">{selectedStory.content}</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

export default FeedScreen;
