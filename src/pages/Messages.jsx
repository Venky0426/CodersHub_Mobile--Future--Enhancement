import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, MoreVertical, Paperclip, Smile, Send, Code, Hash, Circle } from 'lucide-react';
import clsx from 'clsx';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, addDoc, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';

const COMMUNITIES_LIST = [
  { id: 'mca-community', name: 'MCA Community 2020-2026' },
  { id: 'web-dev-community', name: 'Web Dev Community' },
  { id: 'ai-ml-community', name: 'AI & ML Community' },
  { id: 'hackathon-team', name: 'Hackathon Team Finder' }
];

const Messages = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState(COMMUNITIES_LIST[1]); // Default to Web Dev Community
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dynamic profiles & presence states
  const [profiles, setProfiles] = useState([]);
  
  const chatEndRef = useRef(null);

  // Helper to determine if a user profile is currently online (active in last 5 minutes)
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

  // 1. Monitor Authentication State & fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch full profile info for avatar & real name
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setUserProfile(querySnapshot.docs[0].data());
          } else {
            setUserProfile({
              fullName: user.displayName || user.email.split('@')[0],
              imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
            });
          }
        } catch (err) {
          console.error("Error loading user profile: ", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time profiles listener for live presence & member count computations
  useEffect(() => {
    const q = collection(db, 'profiles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setProfiles(list);
    }, (error) => {
      console.error("Profiles subscription error: ", error);
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to Real-Time Messages in the active community
  useEffect(() => {
    setLoading(true);
    
    // Listen for messages belonging to activeCommunity
    const q = query(
      collection(db, 'messages'),
      where('communityId', '==', activeCommunity.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMsgs = [];
      snapshot.forEach((doc) => {
        loadedMsgs.push({ id: doc.id, ...doc.data() });
      });

      // Sort in-memory to keep index-free & robust
      loadedMsgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.localTime || 0);
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.localTime || 0);
        return timeA - timeB;
      });

      setMessages(loadedMsgs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Real-time error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCommunity]);

  // 4. Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !codeSnippet.trim()) return;

    if (!currentUser) {
      alert("You must be logged in to send messages!");
      return;
    }

    const senderName = userProfile?.fullName || currentUser?.email?.split('@')[0] || 'Student Coder';
    const senderAvatar = userProfile?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`;

    const newMessage = {
      communityId: activeCommunity.id,
      senderId: currentUser.uid,
      senderName,
      senderAvatar,
      text: inputText.trim(),
      codeSnippet: codeSnippet.trim() || null,
      timestamp: serverTimestamp(),
      localTime: Date.now() // local fallback until serverTimestamp processes on Firestore
    };

    setInputText('');
    setCodeSnippet('');
    setShowCodeInput(false);

    try {
      await addDoc(collection(db, 'messages'), newMessage);
    } catch (err) {
      console.error("Error writing message to Firestore: ", err);
      alert("Failed to send message. Please check your network connection.");
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

  // Helper to dynamically filter profiles based on active community relevance
  const getCommunityMembers = (communityId) => {
    if (communityId === 'mca-community' || communityId === 'hackathon-team') {
      return profiles;
    }
    if (communityId === 'web-dev-community') {
      return profiles.filter(p => p.domains && p.domains.includes('Web Development'));
    }
    if (communityId === 'ai-ml-community') {
      return profiles.filter(p => p.domains && (p.domains.includes('Artificial Intelligence') || p.domains.includes('Data Science & ML')));
    }
    return [];
  };

  // Compute dynamic stats for display
  const activeMembers = getCommunityMembers(activeCommunity.id);
  const onlineCount = activeMembers.filter(isUserOnline).length;
  const offlineCount = activeMembers.length - onlineCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-8rem)] flex mt-4">
      {/* Left Sidebar - Chats & Communities */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-linkedin-blue focus:ring-1 focus:ring-linkedin-blue outline-none text-sm transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Communities</h3>
            <div className="space-y-1">
              {COMMUNITIES_LIST.map((comm) => {
                const isActive = activeCommunity.id === comm.id;
                const membersList = getCommunityMembers(comm.id);
                const activeOn = membersList.filter(isUserOnline).length;

                return (
                  <div 
                    key={comm.id} 
                    onClick={() => setActiveCommunity(comm)}
                    className={clsx(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors", 
                      isActive ? "bg-blue-50 text-linkedin-blue font-semibold" : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      isActive ? "bg-blue-100 text-linkedin-blue" : "bg-gray-200"
                    )}>
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{comm.name}</p>
                      <p className="text-[10px] text-gray-400 font-normal">
                        {membersList.length} members • {activeOn} online
                      </p>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-linkedin-blue"></div>}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 pt-0">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Direct Messages</h3>
            <div className="space-y-1">
              {[1, 2].map((user) => (
                <div key={user} className="flex items-center gap-3 p-2 rounded-lg cursor-not-allowed hover:bg-gray-100/50 transition-colors opacity-70">
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=dm${user}`} alt="User" className="w-10 h-10 rounded-full bg-white" />
                    <Circle className={clsx("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white fill-current", user % 2 === 0 ? "text-green-500" : "text-gray-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">Developer {user}</p>
                      <span className="text-xs text-gray-500">2h</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">DM chats are coming soon...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-linkedin-blue">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{activeCommunity.name}</h2>
              <p className="text-xs text-gray-500">{activeMembers.length} members • {onlineCount} online</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <button className="hover:text-linkedin-blue transition-colors cursor-pointer"><Phone className="w-5 h-5" /></button>
            <button className="hover:text-linkedin-blue transition-colors cursor-pointer"><Video className="w-5 h-5" /></button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button className="hover:text-gray-900 transition-colors cursor-pointer"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 border-3 border-linkedin-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400 font-medium">Loading real-time chat...</p>
              </div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid;
              return (
                <div key={msg.id} className={clsx("flex gap-4", isMe && "flex-row-reverse")}>
                  <img 
                    src={msg.senderAvatar} 
                    alt={msg.senderName} 
                    className="w-10 h-10 rounded-full bg-white shadow-sm object-cover" 
                  />
                  <div className={clsx("flex flex-col max-w-lg", isMe && "items-end")}>
                    <div className="flex items-baseline gap-2 mb-1">
                      {!isMe && <span className="font-semibold text-gray-900 text-sm">{msg.senderName}</span>}
                      <span className="text-xs text-gray-400">{formatTime(msg)}</span>
                      {isMe && <span className="font-semibold text-gray-900 text-sm">You</span>}
                    </div>
                    
                    {msg.text && (
                      <div className={clsx(
                        "p-3 rounded-2xl shadow-sm text-sm border",
                        isMe 
                          ? "bg-linkedin-blue text-white rounded-tr-none border-blue-600" 
                          : "bg-white text-gray-800 rounded-tl-none border-gray-200"
                      )}>
                        {msg.text}
                      </div>
                    )}
                    
                    {msg.codeSnippet && (
                      <div className="bg-[#1e1e1e] text-gray-300 p-4 rounded-xl shadow-sm text-xs mt-2 font-mono w-full max-w-md overflow-x-auto text-left">
                        <pre><code>{msg.codeSnippet}</code></pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Hash className="w-12 h-12 text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">No messages in #{activeCommunity.name} yet</p>
              <p className="text-xs max-w-xs mt-1">Be the first to introduce yourself and start collaborating!</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {showCodeInput && (
              <div className="relative animate-fade-in">
                <textarea
                  rows="4"
                  placeholder="Paste your code snippet here..."
                  className="w-full bg-[#1e1e1e] text-green-400 p-3 rounded-lg font-mono text-xs outline-none focus:ring-1 focus:ring-linkedin-blue"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCodeInput(false)}
                  className="absolute top-2 right-2 text-xs bg-red-500 hover:bg-red-650 text-white px-2 py-1 rounded"
                >
                  Remove Code
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-linkedin-blue focus-within:ring-1 focus-within:ring-linkedin-blue transition-all">
              <button 
                type="button" 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-not-allowed" 
                title="Attachments coming soon"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => setShowCodeInput(!showCodeInput)}
                className={clsx("p-2 rounded-lg transition-colors cursor-pointer", showCodeInput ? "text-linkedin-blue bg-blue-50" : "text-gray-400 hover:text-gray-600")}
                title="Share Code Snippet"
              >
                <Code className="w-5 h-5" />
              </button>
              <textarea 
                rows="1" 
                placeholder={`Message #${activeCommunity.name}...`}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 outline-none text-sm max-h-32"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button 
                type="button" 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-not-allowed"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                type="submit" 
                className="p-2 bg-linkedin-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Real dynamic members */}
      <div className="hidden xl:flex w-64 border-l border-gray-200 flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-900">Members</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeMembers.length > 0 ? (
            <>
              {/* Online section */}
              {onlineCount > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Online - {onlineCount}</h4>
                  <div className="space-y-3">
                    {activeMembers.filter(isUserOnline).map((member, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={member.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                            alt={member.fullName} 
                            className="w-8 h-8 rounded-full bg-white shadow-sm object-cover" 
                          />
                          <Circle className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white fill-current text-green-500" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate">{member.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offline section */}
              {offlineCount > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Offline - {offlineCount}</h4>
                  <div className="space-y-3 opacity-60">
                    {activeMembers.filter(p => !isUserOnline(p)).map((member, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={member.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                            alt={member.fullName} 
                            className="w-8 h-8 rounded-full bg-white shadow-sm object-cover" 
                          />
                          <Circle className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white fill-current text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate">{member.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-gray-400">
              No members in this community yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
