import React, { useState, useEffect } from 'react';
import { Image, Video, Calendar, FileText, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, UserPlus, X, Send, Smile, Check, Plus } from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import EventsSlideshow from '../components/EventsSlideshow';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  
  const [selectedStory, setSelectedStory] = useState(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryImage, setNewStoryImage] = useState('');

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');

  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const [currentUserAvatar, setCurrentUserAvatar] = useState('https://randomuser.me/api/portraits/men/46.jpg');
  const [currentUserFullName, setCurrentUserFullName] = useState('Current User');
  const [currentUserRole, setCurrentUserRole] = useState('Student');
  const [currentUserCollege, setCurrentUserCollege] = useState('Cambridge');

  const [mates, setMates] = useState([
    { id: 1, name: 'Alex Coder', role: 'Backend Dev', seed: 'men/1.jpg', connected: false },
    { id: 2, name: 'Emma Eng', role: 'Frontend Dev', seed: 'women/2.jpg', connected: false },
    { id: 3, name: 'Liam Logic', role: 'AI Researcher', seed: 'men/3.jpg', connected: false }
  ]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            if (data.imageUrl) setCurrentUserAvatar(data.imageUrl);
            if (data.fullName) setCurrentUserFullName(data.fullName);
            if (data.role) setCurrentUserRole(data.role);
            if (data.college) setCurrentUserCollege(data.college);
          }
        } catch (error) {
          console.error('Error fetching profile picture:', error);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

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

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('id', 'desc')); 
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      setPosts(fetchedPosts.length > 0 ? fetchedPosts : defaultPosts);
    }, (error) => {
      console.warn("Firestore access denied for posts.", error);
      alert("Firestore Error (Posts): " + error.message + "\nDid you publish the updated Security Rules in your Firebase Console?");
      setPosts(defaultPosts);
    });
    return () => unsubscribePosts();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('id', 'desc'));
    const unsubscribeStories = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      setStories(fetchedStories.length > 0 ? fetchedStories : defaultStories);
    }, (error) => {
      console.warn("Firestore access denied for stories.", error);
      alert("Firestore Error (Stories): " + error.message + "\nDid you publish the updated Security Rules in your Firebase Console?");
      setStories(defaultStories);
    });
    return () => unsubscribeStories();
  }, []);

  const handlePickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
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
      alert("You must be logged in to post.");
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
      alert("Failed to create post: " + err.message);
    }
  };

  const handleLike = async (post) => {
    const user = auth.currentUser;
    if (!user) return;

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(user.uid);
    let newLikedBy = [];
    let newLikes = post.likes || 0;

    if (isLiked) {
      newLikedBy = likedBy.filter(uid => uid !== user.uid);
      newLikes -= 1;
    } else {
      newLikedBy = [...likedBy, user.uid];
      newLikes += 1;
    }

    try {
      const postRef = doc(db, 'posts', post.fbId);
      await updateDoc(postRef, {
        likedBy: newLikedBy,
        likes: newLikes
      });
    } catch (err) {
      console.error('Error liking post', err);
    }
  };

  const handleCommentToggle = (id) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = async (post) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const text = commentInputs[post.id];
    if (!text || !text.trim()) return;

    const newComment = {
      id: Date.now(),
      uid: user.uid,
      author: currentUserFullName,
      avatar: currentUserAvatar,
      text: text.trim()
    };

    try {
      const postRef = doc(db, 'posts', post.fbId);
      const updatedComments = [...(post.comments || []), newComment];
      await updateDoc(postRef, { comments: updatedComments });
      
      setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
    } catch (err) {
      console.error('Error adding comment', err);
    }
  };

  const handleCreateStory = async () => {
    if (!newStoryName.trim() || (!newStoryText.trim() && !newStoryImage)) return;
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add a story.");
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
      alert("Failed to create story: " + err.message);
    }
  };

  const handleDeletePost = async (post) => {
    if (!post.fbId) return;
    const user = auth.currentUser;
    if (!user || user.uid !== post.uid) {
      alert("You can only delete your own posts.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'posts', post.fbId));
      } catch (err) {
        console.error('Error deleting post', err);
        alert("Failed to delete post");
      }
    }
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author}`,
        text: post.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert(`Post by ${post.author} copied!`);
    }
  };

  const handleConnect = (id) => {
    setMates(mates.map(mate => {
      if (mate.id === id) {
        return { ...mate, connected: true };
      }
      return mate;
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6 bg-white text-black min-h-screen">
      {/* Left Sidebar */}
      <div className="hidden lg:block w-1/4">
      </div>

      {/* Main Feed */}
      <div className="w-full lg:w-1/2 space-y-4">
        {/* Events Snaps Section */}
        <EventsSlideshow />

        {/* Stories Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
          <div className="flex space-x-4 min-w-max">
            {/* Add Story Button */}
            <div
              className="flex flex-col items-center space-y-1 w-16 cursor-pointer group"
              onClick={() => setIsStoryModalOpen(true)}
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-linkedin-blue group-hover:bg-blue-50 transition-all">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-linkedin-blue" />
              </div>
              <span className="text-xs font-medium text-gray-500 text-center">Add Story</span>
            </div>

            {stories.map((story) => (
              <div
                key={story.id}
                className="flex flex-col items-center space-y-1 w-16 cursor-pointer group"
                onClick={() => setSelectedStory(story)}
              >
                <div className="w-16 h-16 rounded-full border-[3px] border-linkedin-blue p-0.5 group-hover:scale-105 transition-transform">
                  <img src={story.seed?.startsWith('http') || story.seed?.startsWith('data:') ? story.seed : `https://randomuser.me/api/portraits/${story.seed || 'lego/1.jpg'}`} className="w-full h-full rounded-full bg-gray-100 object-cover" alt={story.name} />
                </div>
                <span className="text-xs font-medium text-gray-700 truncate w-full text-center">{story.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Create Post Button */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl shadow-md p-[2px] hover:shadow-lg transition-shadow duration-300">
          <div className="bg-white rounded-[14px] p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <img src={currentUserAvatar} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-indigo-50 object-cover shadow-sm" alt="Profile" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <button
              className="flex-1 w-full flex items-center justify-between px-5 py-3 sm:py-4 bg-gray-50 hover:bg-indigo-50 rounded-xl text-gray-600 hover:text-indigo-900 font-medium transition-all duration-300 group border border-gray-100 hover:border-indigo-100"
              onClick={() => setIsPostModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Send className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm sm:text-base">Share a snippet, project, or idea...</span>
              </div>
            </button>
          </div>
        </div>

        {/* Post List */}
        {posts.length === 0 ? (
          <div className="p-8 flex items-center justify-center">
            <span className="text-gray-500">No posts yet. Be the first to share!</span>
          </div>
        ) : posts.map((post) => {
          const isLiked = auth.currentUser ? (post.likedBy || []).includes(auth.currentUser.uid) : false;
          const isCommentOpen = openComments[post.id];
          const postComments = post.comments || [];

          return (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <img src={post.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} className="w-12 h-12 rounded-full bg-gray-100 object-cover" alt="User" />
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900 leading-none hover:text-linkedin-blue cursor-pointer">{post.author}</h3>
                      {post.college && (
                        <span className="ml-2 bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-100">
                          {post.college}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{post.role}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{post.time}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => handleDeletePost(post)}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              {post.content && (
                <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
              )}
            </div>

            {post.image && (
              <div className="bg-gray-100 w-full overflow-hidden">
                <img src={post.image} alt="Post content" className="w-full object-cover max-h-[500px]" />
              </div>
            )}

            <div className="px-4 py-2 border-b border-gray-50 flex justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-white fill-current" />
                </div>
                <span>{post.likes || 0}</span>
              </div>
              <span>{postComments.length} comments</span>
            </div>

            <div className="p-1">
              <div className="flex justify-between px-2 py-1">
                <button
                  onClick={() => handleLike(post)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors flex-1 justify-center ${isLiked ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-semibold">Like</span>
                </button>
                <button
                  onClick={() => handleCommentToggle(post.id)}
                  className={`flex items-center space-x-2 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors flex-1 justify-center ${isCommentOpen ? 'bg-gray-100' : ''}`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Comment</span>
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center space-x-2 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors flex-1 justify-center"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Share</span>
                </button>
              </div>
            </div>

            {isCommentOpen && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <div className="flex gap-2 mb-4">
                  <img src={currentUserAvatar} className="w-8 h-8 rounded-full object-cover" alt="Me" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="w-full bg-white border border-gray-200 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-linkedin-blue pr-12"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post);
                      }}
                    />
                    <button 
                      onClick={() => handleAddComment(post)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5"
                    >
                      <Send className={`w-4 h-4 ${(commentInputs[post.id]?.trim()) ? 'text-linkedin-blue' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {postComments.map((comment, idx) => (
                    <div key={comment.id || idx} className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <img src={comment.avatar || `https://randomuser.me/api/portraits/lego/${idx % 9}.jpg`} className="w-8 h-8 rounded-full object-cover bg-gray-200" alt="User" />
                      <div className="flex-1 bg-white p-2 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-900">{comment.author}</h4>
                        <p className="text-xs text-gray-700 mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-1/4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
          <h3 className="font-semibold text-gray-900 mb-4">CodeMates</h3>
          <div className="space-y-4">
            {mates.map((mate) => (
              <div key={mate.id} className="flex items-center gap-3">
                <img src={`https://randomuser.me/api/portraits/${mate.seed}`} className="w-10 h-10 rounded-full border border-gray-200 object-cover" alt="CodeMate" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{mate.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{mate.role}</p>
                </div>
                <button
                  onClick={() => handleConnect(mate.id)}
                  disabled={mate.connected}
                  className={`p-1.5 rounded-full transition-all duration-300 ${mate.connected ? 'text-green-600 bg-green-50 border border-green-600 scale-110' : 'text-linkedin-blue hover:bg-blue-50 border border-linkedin-blue'}`}
                >
                  {mate.connected ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm font-medium text-linkedin-blue hover:underline">View all recommendations</button>
        </div>
      </div>

      {/* Create Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Create a post</h2>
              <button onClick={() => setIsPostModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={currentUserAvatar} className="w-12 h-12 rounded-full border object-cover" alt="Me" />
                <div>
                  <h3 className="font-semibold">{currentUserFullName}</h3>
                  <button className="text-xs font-medium text-gray-500 flex items-center gap-1 px-2 py-1 border rounded-full hover:bg-gray-50">🌎 Anyone</button>
                </div>
              </div>
              <textarea
                autoFocus
                className="w-full min-h-[120px] text-lg outline-none resize-none placeholder-gray-400"
                placeholder="What do you want to talk about?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              {newPostImage && (
                <div className="mt-4 relative group">
                  <img src={newPostImage} className="w-full max-h-60 object-cover rounded-lg" alt="Preview" />
                  <button
                    onClick={() => setNewPostImage('')}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <div className="flex gap-2 text-gray-500">
                <button
                  onClick={() => handlePickImage(setNewPostImage)}
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 group"
                >
                  <Image className="w-6 h-6 group-hover:text-linkedin-blue" />
                  <span className="text-sm font-medium group-hover:text-linkedin-blue">Add Photo</span>
                </button>
              </div>
              <button
                disabled={!newPostContent.trim() && !newPostImage}
                onClick={handleCreatePost}
                className={`px-6 py-2 rounded-full font-bold transition-all ${newPostContent.trim() || newPostImage ? 'bg-linkedin-blue text-white hover:bg-blue-700 shadow-md active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Add to Story</h2>
              <button onClick={() => setIsStoryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Story Title</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 mt-1 focus:outline-none focus:border-linkedin-blue"
                  placeholder="e.g., My Coding Journey"
                  value={newStoryName}
                  onChange={(e) => setNewStoryName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Text Overlay</label>
                <textarea
                  className="w-full border rounded-lg p-2 mt-1 focus:outline-none focus:border-linkedin-blue h-24 resize-none"
                  placeholder="Write something cool... 🦄"
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Upload Full Image</label>
                <div className="mt-1">
                  {newStoryImage ? (
                    <div className="relative group rounded-lg overflow-hidden border bg-gray-100">
                      <img src={newStoryImage} className="w-full aspect-[9/16] object-contain max-h-64" alt="Preview" />
                      <button
                        onClick={() => setNewStoryImage('')}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePickImage(setNewStoryImage)}
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Image className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium">Click to upload photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsStoryModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-50 rounded-full"
              >
                Cancel
              </button>
              <button
                disabled={!newStoryName.trim() || (!newStoryText.trim() && !newStoryImage)}
                onClick={handleCreateStory}
                className="bg-linkedin-blue text-white px-8 py-2 rounded-full font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                Share Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <button onClick={() => setSelectedStory(null)} className="absolute top-4 right-4 z-[70] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90">
            <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-sm h-full max-h-[90vh] aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center gap-3 z-10">
              <img src={selectedStory.seed?.startsWith('http') || selectedStory.seed?.startsWith('data:') ? selectedStory.seed : `https://randomuser.me/api/portraits/${selectedStory.seed || 'lego/1.jpg'}`} className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover" alt="Story" />
              <div className="flex flex-col">
                <span className="text-white font-bold drop-shadow-md text-sm">{selectedStory.name}</span>
                <span className="text-white/70 text-[10px]">Just now</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative flex items-center justify-center">
              {selectedStory.type === 'image' ? (
                <div className="w-full h-full relative">
                  <img src={selectedStory.content} className="w-full h-full object-contain bg-black/50" alt="Story content" />
                  {selectedStory.textContent && (
                    <div className="absolute bottom-20 w-full bg-black/60 p-4">
                      <span className="text-white text-lg font-semibold text-center block">{selectedStory.textContent}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`w-full h-full flex items-center justify-center p-8 text-center text-white text-2xl sm:text-3xl font-bold bg-blue-500`}>
                  {selectedStory.content}
                </div>
              )}
            </div>

            {/* Footer / Reply */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex gap-2 z-10">
              <input
                type="text"
                placeholder="Reply to story..."
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-2.5 text-white text-sm placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:ring-1 focus:ring-white/30 transition-all"
              />
              <button className="p-2.5 bg-linkedin-blue text-white rounded-full hover:bg-blue-600 transition-all shadow-lg active:scale-90">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
