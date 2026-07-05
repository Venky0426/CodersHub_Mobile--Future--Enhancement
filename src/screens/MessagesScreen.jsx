import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Phone, Video, MoreVertical, Paperclip, Smile, Send, Code, Hash, ChevronDown, X, Gift, ArrowLeft, Bell } from 'lucide-react-native';
import clsx from 'clsx';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, addDoc, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

const COMMUNITIES_LIST = [
  { id: 'mca-community', name: 'MCA Community 2025-27', members: '116 Members', online: '10 Online', badge: 5, img: 'https://api.dicebear.com/7.x/shapes/png?seed=mca' },
  { id: 'web-dev-community', name: 'Web Dev Community', members: '176 Members', online: '30 Online', badge: 8, img: 'https://api.dicebear.com/7.x/shapes/png?seed=web' },
  { id: 'ui-ux-community', name: 'UI/UX Community', members: '76 Members', online: '20 Online', badge: null, img: 'https://api.dicebear.com/7.x/shapes/png?seed=uiux' },
  { id: 'ai-ml-community', name: 'AI &ML Community', members: '176 Members', online: '30 Online', badge: 10, img: 'https://api.dicebear.com/7.x/shapes/png?seed=aiml' },
  { id: 'data-science', name: 'Data Science Hub', members: '89 Members', online: '15 Online', badge: 2, img: 'https://api.dicebear.com/7.x/shapes/png?seed=data' },
  { id: 'competitive-prog', name: 'Competitive Programming', members: '245 Members', online: '50 Online', badge: 12, img: 'https://api.dicebear.com/7.x/shapes/png?seed=cp' },
  { id: 'open-source', name: 'Open Source Contributors', members: '432 Members', online: '120 Online', badge: null, img: 'https://api.dicebear.com/7.x/shapes/png?seed=os' }
];

// Direct messages are dynamically loaded from profiles now

export default function MessagesScreen() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState(COMMUNITIES_LIST[1]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'chat'
  const [showAllCommunities, setShowAllCommunities] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [profiles, setProfiles] = useState([]);
  
  const scrollViewRef = useRef();

  const isUserOnline = (profile) => {
    if (!profile.lastActive) return false;
    let timeMs = 0;
    if (profile.lastActive.toDate) {
      timeMs = profile.lastActive.toDate().getTime();
    } else if (profile.lastActive.seconds) {
      timeMs = profile.lastActive.seconds * 1000;
    } else {
      timeMs = new Date(profile.lastActive).getTime();
    }
    return Date.now() - timeMs < 5 * 60 * 1000;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setUserProfile(querySnapshot.docs[0].data());
          } else {
            setUserProfile({
              fullName: user.email.split('@')[0],
              imageUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user.email)}`
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, 'profiles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      const seenUids = new Set();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid && !seenUids.has(data.uid)) {
          seenUids.add(data.uid);
          list.push({ docId: doc.id, ...data });
        }
      });
      setProfiles(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'messages'), where('communityId', '==', activeCommunity.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMsgs = [];
      snapshot.forEach((doc) => {
        loadedMsgs.push({ id: doc.id, ...doc.data() });
      });

      loadedMsgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.localTime || 0);
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.localTime || 0);
        return timeA - timeB;
      });

      setMessages(loadedMsgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCommunity]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (viewMode === 'chat') {
          setViewMode('list');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [viewMode])
  );

  const handleSendMessage = async () => {
    if (!inputText.trim() && !codeSnippet.trim()) return;

    if (!currentUser) return;

    const senderName = userProfile?.fullName || currentUser?.email?.split('@')[0] || 'Student Coder';
    const senderAvatar = userProfile?.imageUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.uid}`;

    const newMessage = {
      communityId: activeCommunity.id,
      senderId: currentUser.uid,
      senderName,
      senderAvatar,
      text: inputText.trim(),
      codeSnippet: codeSnippet.trim() || null,
      timestamp: serverTimestamp(),
      localTime: Date.now()
    };

    setInputText('');
    setCodeSnippet('');
    setShowCodeInput(false);

    try {
      await addDoc(collection(db, 'messages'), newMessage);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (msg) => {
    let date = null;
    if (msg.timestamp?.toDate) {
      date = msg.timestamp.toDate();
    } else if (msg.localTime) {
      date = new Date(msg.localTime);
    }
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };

  if (viewMode === 'list') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 pt-4 pb-2 mt-4 flex-row justify-between items-center">
          <Text className="text-[28px] font-bold text-gray-900 tracking-tight">Messages</Text>
          <TouchableOpacity className="relative mr-2 mt-1">
            <View className="w-6 h-6 items-center justify-center">
              <Bell size={24} color="#111827" />
            </View>
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">3</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View className="px-4 mb-4 mt-2">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={20} color="#9ca3af" />
            <TextInput 
              placeholder="Search Messages" 
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 text-[15px] text-gray-900" 
            />
          </View>
        </View>
        
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <Text className="text-[12px] text-gray-600 mb-4 pl-1">COMMUNITIES</Text>
          {COMMUNITIES_LIST.slice(0, showAllCommunities ? undefined : 4).map((community, index) => {
            return (
              <TouchableOpacity 
                key={community.id}
                className="flex-row items-center py-2 px-1 mb-3"
                onPress={() => {
                  setActiveCommunity(community);
                  setViewMode('chat');
                }}
              >
                <Image 
                  source={{ uri: community.img }} 
                  className="w-[46px] h-[46px] rounded-xl bg-gray-100 mr-4"
                  resizeMode="cover"
                />
                <View className="flex-1 justify-center">
                  <Text className="text-[16px] font-semibold text-gray-900 mb-0.5">
                    {community.name}
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    {community.members} • {community.online}
                  </Text>
                </View>
                {community.badge && (
                  <View className="w-6 h-6 rounded-full bg-[#0a66c2] items-center justify-center">
                    <Text className="text-white text-xs font-bold">{community.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity 
            className="flex-row justify-center items-center py-2 mb-4"
            onPress={() => setShowAllCommunities(!showAllCommunities)}
          >
            <Text className="text-[13px] font-medium text-gray-900 mr-1">{showAllCommunities ? "Less" : "More"}</Text>
            <ChevronDown size={16} color="#111827" style={{ transform: [{ rotate: showAllCommunities ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
          
          <View className="h-[1px] bg-gray-200 mb-4" />
          
          <Text className="text-[12px] text-gray-600 mb-4 pl-1">
            DIRECT MESSAGES
          </Text>
          
          {profiles.filter(p => p.uid !== currentUser?.uid).map((profile, idx) => {
            const avatarUrl = profile.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'User')}&background=random&color=fff&size=128`;
            return (
              <TouchableOpacity 
                key={`${profile.uid}_${idx}`} 
                className="flex-row items-center py-2 px-1 mb-3"
                onPress={() => {
                  if (!currentUser) return;
                  const dmId = [currentUser.uid, profile.uid].sort().join('_');
                  setActiveCommunity({
                    id: `dm_${dmId}`,
                    name: profile.fullName || 'Anonymous',
                    members: 'Direct Message',
                    online: isUserOnline(profile) ? 'Online' : 'Offline',
                    img: avatarUrl,
                    isDM: true
                  });
                  setViewMode('chat');
                }}
              >
                <View className="relative mr-4">
                  <Image source={{uri: avatarUrl}} className="w-[48px] h-[48px] rounded-full bg-gray-100" />
                  {isUserOnline(profile) && (
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-white" />
                  )}
                </View>
                <View className="flex-1 justify-center">
                  <View className="flex-row justify-between items-center mb-0.5">
                    <Text className="text-[16px] font-semibold text-gray-900">{profile.fullName || 'Anonymous'}</Text>
                    <Text className="text-[12px] font-medium text-gray-500">
                      {profile.lastActive ? new Date(profile.lastActive.toDate ? profile.lastActive.toDate() : profile.lastActive).toLocaleDateString() : 'New'}
                    </Text>
                  </View>
                  <Text className="text-[14px] text-gray-500" numberOfLines={1}>Hey! Let's connect.</Text>
                </View>
              </TouchableOpacity>
            )
          })}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1 bg-white"
      >
      {/* Header */}
      <View className="pt-2 pb-3 px-4 border-b border-gray-100 bg-white flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setViewMode('list')} className="mr-3">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Image 
            source={{ uri: userProfile?.imageUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.uid}` }} 
            className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100" 
          />
        </View>
        <View className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-100 max-w-[65%]">
          <Hash size={16} color="#0a66c2" style={{ marginRight: 6 }} />
          <Text className="font-bold text-[#0a66c2] text-sm" numberOfLines={1}>{activeCommunity.name}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        className="flex-1 bg-gray-50 px-4 pt-4"
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0a66c2" />
          </View>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <View key={msg.id} className={clsx("flex-row mb-4", isMe && "justify-end")}>
                {!isMe && (
                  <Image source={{ uri: msg.senderAvatar }} className="w-8 h-8 rounded-full mr-2" />
                )}
                <View className={clsx("max-w-[80%]", isMe && "items-end")}>
                  {!isMe && (
                    <View className="flex-row items-baseline mb-1">
                      <Text className="font-semibold text-gray-900 text-xs mr-2">{msg.senderName}</Text>
                      <Text className="text-[10px] text-gray-400">{formatTime(msg)}</Text>
                    </View>
                  )}
                  {msg.text ? (
                    <View className={clsx(
                      "p-3 rounded-2xl shadow-sm border",
                      isMe 
                        ? "bg-[#0a66c2] border-blue-600 rounded-tr-none" 
                        : "bg-white border-gray-200 rounded-tl-none"
                    )}>
                      <Text className={clsx(isMe ? "text-white" : "text-gray-800")}>{msg.text}</Text>
                    </View>
                  ) : null}
                  {msg.codeSnippet ? (
                    <View className="bg-[#1e1e1e] p-3 rounded-xl mt-1">
                      <Text className="text-green-400 font-mono text-xs">{msg.codeSnippet}</Text>
                    </View>
                  ) : null}
                  {isMe && (
                    <Text className="text-[10px] text-gray-400 mt-1">{formatTime(msg)}</Text>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center py-20">
            <Hash size={40} color="#d1d5db" />
            <Text className="font-semibold text-gray-500 mt-2">No messages in #{activeCommunity.name}</Text>
          </View>
        )}
      </ScrollView>

      {/* Instagram-Style Composer */}
      <View className="border-t border-gray-200 bg-white pb-2 pt-3 px-4">
        {showCodeInput && (
          <View className="mb-2 relative">
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Paste code snippet..."
              className="bg-[#1e1e1e] text-green-400 p-3 rounded-lg font-mono text-xs"
              style={{ textAlignVertical: 'top' }}
              value={codeSnippet}
              onChangeText={setCodeSnippet}
            />
            <TouchableOpacity 
              className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded"
              onPress={() => setShowCodeInput(false)}
            >
              <Text className="text-white text-xs">Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Emojis */}
        <View className="flex-row justify-between px-2 mb-3">
          {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(emoji => (
            <TouchableOpacity key={emoji} onPress={() => setInputText(prev => prev + emoji)}>
              <Text className="text-2xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Input Row */}
        <View className="flex-row items-center">
          <Image source={{ uri: userProfile?.imageUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.uid}` }} className="w-10 h-10 rounded-full mr-3 bg-gray-100 border border-gray-200" />
          <View className="flex-1 flex-row items-center border border-gray-300 rounded-full pl-4 pr-1 py-1 bg-gray-50">
            <TextInput 
              className="flex-1 py-1 text-sm max-h-24 min-h-[32px]"
              placeholder={`Message #${activeCommunity.name}...`}
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity className="border border-gray-400 rounded px-1.5 py-0.5 mx-2 bg-white">
              <Text className="text-[10px] font-bold text-gray-600">GIF</Text>
            </TouchableOpacity>
            {inputText.trim() || codeSnippet.trim() ? (
              <TouchableOpacity onPress={handleSendMessage} className="p-1 mx-1">
                <Send size={18} color="#0a66c2" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setShowCodeInput(!showCodeInput)} className="ml-3 p-1">
            <Code size={24} color={showCodeInput ? "#0a66c2" : "#4b5563"} />
          </TouchableOpacity>
          <TouchableOpacity className="ml-2 p-1">
            <Gift size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
