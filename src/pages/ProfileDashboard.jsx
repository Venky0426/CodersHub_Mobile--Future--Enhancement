import React, { useState, useEffect } from 'react';
import { Edit2, Share2, Plus, ExternalLink, Heart, MessageCircle, Download, LogOut, Camera, Search, Check, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const compressImage = (base64Str) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const domainsList = [
  'Backend Development', 'Web Development', 'Mobile App Development', 
  'Data Science & ML', 'Cloud Computing & DevOps', 'Game Development', 
  'Cybersecurity', 'Embedded Systems & IoT', 'Blockchain Development', 
  'Artificial Intelligence', 'Database Development'
];

const ProfileDashboard = () => {
  const navigate = useNavigate();
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
      // 1. Fetch Profile Info
      const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setProfile(querySnapshot.docs[0].data());
      }

      // 2. Fetch User's Uploaded Projects
      const projectsQ = query(collection(db, 'projects'), where('uid', '==', user.uid));
      const projectsSnapshot = await getDocs(projectsQ);
      const loadedProjects = [];
      projectsSnapshot.forEach(doc => {
        loadedProjects.push({ id: doc.id, ...doc.data() });
      });

      // Sort locally to prevent index crash
      loadedProjects.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setUserProjects(loadedProjects);
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchProfileAndProjects(user);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
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

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);
      setEditImage(compressed);
    };
    reader.readAsDataURL(file);
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
    if (!editFullName.trim() || !editCollege.trim()) {
      alert('Name and College fields are required!');
      return;
    }

    setUpdating(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found.');

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

        // Update local state instantly
        setProfile(prev => ({
          ...prev,
          fullName: editFullName,
          college: editCollege,
          bio: editBio,
          domains: editDomains,
          imageUrl: editImage,
        }));

        setIsEditModalOpen(false);
        alert('Profile updated successfully!');
      } else {
        alert('Profile document not found in database.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save profile updates. Please try again!');
    } finally {
      setUpdating(false);
    }
  };

  const handleLike = async (project, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to like projects!');
      return;
    }

    const hasLiked = (project.likedBy || []).includes(user.uid);
    const updatedLikes = hasLiked
      ? (project.likedBy || []).filter(uid => uid !== user.uid)
      : [...(project.likedBy || []), user.uid];

    try {
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, { likedBy: updatedLikes });
      setUserProjects(prev => prev.map(p => p.id === project.id ? { ...p, likedBy: updatedLikes } : p));
    } catch (error) {
      console.error('Error liking project on dashboard:', error);
    }
  };

  const handleDownload = async (project, e) => {
    e.stopPropagation();
    if (!project.repoLink || project.repoLink === '#') {
      alert('No repository link available for this project.');
      return;
    }

    window.open(project.repoLink, '_blank');

    const newCount = (project.downloadsCount || 0) + 1;

    try {
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, { downloadsCount: newCount });
      setUserProjects(prev => prev.map(p => p.id === project.id ? { ...p, downloadsCount: newCount } : p));
    } catch (error) {
      console.error('Error incrementing download count on dashboard:', error);
    }
  };

  const handleOpenComments = (project, e) => {
    e.stopPropagation();
    setCommentProject(project);
    setNewCommentText('');
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    setPostingComment(true);

    try {
      const commenterName = profile?.fullName || 'Anonymous Coder';
      const commenterImg = profile?.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

      const commentObj = {
        uid: user.uid,
        userName: commenterName,
        userImg: commenterImg,
        text: newCommentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'projects', commentProject.id);
      const updatedComments = [...(commentProject.comments || []), commentObj];

      await updateDoc(docRef, { comments: updatedComments });
      
      setUserProjects(prev => prev.map(p => p.id === commentProject.id ? { ...p, comments: updatedComments } : p));
      setCommentProject(prev => ({ ...prev, comments: updatedComments }));
      setNewCommentText('');
    } catch (error) {
      console.error('Error posting comment on dashboard:', error);
      alert('Failed to post comment. Please try again!');
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-linkedin-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 relative">
      {/* Top Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-linkedin-blue to-blue-400 relative">
          <button 
            onClick={handleOpenEditModal}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-start">
            <div className="relative -mt-16 mb-4">
              <img 
                src={profile?.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Profile" 
                className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-sm object-cover" 
              />
            </div>
            <div className="mt-4 flex gap-3 flex-wrap">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full transition-colors flex items-center shadow-sm cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </button>
              <button 
                onClick={handleOpenEditModal}
                className="px-4 py-2 bg-linkedin-blue hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center shadow-sm cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium rounded-full transition-colors flex items-center shadow-sm active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </button>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName || "Anonymous Developer"}</h1>
            <p className="text-lg text-gray-700 mb-1">
              {profile?.domains && profile.domains.length > 0 
                ? profile.domains.slice(0, 2).join(' & ') 
                : 'Software Developer'}
            </p>
            <p className="text-sm text-gray-500 mb-4">{profile?.college || "Cambridge Institute of Technology"}</p>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {profile?.bio || "Passionate developer building things. Ready to collaborate on awesome open source projects!"}
            </p>

            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><GithubIcon /></a>
              <a href="#" className="text-gray-500 hover:text-linkedin-blue transition-colors"><LinkedinIcon /></a>
              <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors"><TwitterIcon /></a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><ExternalLink className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Skills & Domains */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Skills</h3>
              <button 
                onClick={handleOpenEditModal}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile?.domains || ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker']).map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md border border-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Interested Domains</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.domains && profile.domains.length > 0 ? (
                profile.domains.map((domain, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-linkedin-blue text-sm font-medium rounded-full border border-blue-100">
                    {domain}
                  </span>
                ))
              ) : (
                ['Web Development', 'Cloud Computing & DevOps', 'Artificial Intelligence'].map((domain, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-linkedin-blue text-sm font-medium rounded-full border border-blue-100">
                    {domain}
                  </span>
                ))
              )}
            </div>
          </div>


        </div>

        {/* Right Column - Projects & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Uploaded Projects ({userProjects.length})</h3>
              <button 
                onClick={() => navigate('/projects')}
                className="text-linkedin-blue hover:underline text-sm font-medium flex items-center cursor-pointer"
              >
                View all <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {userProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userProjects.map((project) => {
                  const hasLiked = (project.likedBy || []).includes(auth.currentUser?.uid);
                  return (
                    <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full bg-white">
                      <div className="h-32 bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-100 relative">
                        {project.image ? (
                          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-linkedin-blue to-blue-600 opacity-90 flex items-center justify-center">
                            <span className="text-white font-extrabold text-sm px-4 text-center truncate">{project.title}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-gray-950 mb-1 truncate text-sm">{project.title}</h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed flex-1">{project.desc}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.tech && project.tech.slice(0, 3).map((t, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-150 text-gray-600 text-[9px] rounded font-medium border border-gray-250">{t}</span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-auto">
                          <div className="flex gap-3 text-gray-500 text-xs">
                            <button 
                              onClick={(e) => handleLike(project, e)}
                              className={`flex items-center transition-colors cursor-pointer ${
                                hasLiked ? 'text-red-500 hover:text-red-650 font-bold' : 'hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 mr-1 ${hasLiked ? 'fill-current' : ''}`} /> 
                              <span>{(project.likedBy || []).length}</span>
                            </button>
                            <button 
                              onClick={(e) => handleOpenComments(project, e)}
                              className="flex items-center hover:text-linkedin-blue transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" /> 
                              <span>{(project.comments || []).length}</span>
                            </button>
                          </div>
                          
                          <button 
                            onClick={(e) => handleDownload(project, e)}
                            className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md text-[9px] font-semibold transition-colors border border-gray-200 cursor-pointer"
                          >
                            <Download className="w-3 h-3 mr-1" /> 
                            Code ({project.downloadsCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-4">
                <p className="text-gray-500 font-medium text-sm mb-2">You haven't uploaded any projects yet</p>
                <button 
                  onClick={() => navigate('/projects')}
                  className="px-4 py-2 bg-linkedin-blue text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  Upload Your First Project
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Startup Collaborations</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 font-bold text-linkedin-blue">NG</div>
                <div>
                  <h4 className="font-bold text-gray-900">NextGen EV Platform</h4>
                  <p className="text-sm text-gray-600 mb-2">Role: Backend Developer • Joined March 2024</p>
                  <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium border border-green-100">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg border border-gray-200 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 font-semibold">Edit Profile</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Image Preview & Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-linkedin-blue bg-gray-50 flex items-center justify-center">
                  <img 
                    src={editImage || profile?.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleEditImageChange} 
                    />
                  </label>
                </div>
                <span className="text-xs text-gray-500 font-medium">Click avatar to change image</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent outline-none transition-all"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College / University</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent outline-none transition-all"
                  value={editCollege}
                  onChange={e => setEditCollege(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent resize-none outline-none transition-all"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                />
              </div>

              {/* Domains Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills & Domains</label>
                <div className="flex bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 items-center focus-within:ring-2 focus-within:ring-linkedin-blue focus-within:border-transparent mb-2">
                  <Search className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search domains..."
                    className="bg-transparent text-sm w-full outline-none text-gray-700"
                    value={editDomainSearch}
                    onChange={e => setEditDomainSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {filteredDomainsList.map((domain) => {
                    const isSelected = editDomains.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleEditDomain(domain)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex justify-between items-center cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-linkedin-blue' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {domain}
                        {isSelected && <Check className="w-3.5 h-3.5 text-linkedin-blue" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300 cursor-pointer flex items-center"
                onClick={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 flex flex-col max-h-[85vh] transform transition-all overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Comments</h3>
                <p className="text-xs text-gray-400 truncate max-w-xs">{commentProject.title}</p>
              </div>
              <button 
                onClick={() => setCommentProject(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[220px]">
              {(commentProject.comments || []).length > 0 ? (
                (commentProject.comments || []).map((cmt, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <img 
                      src={cmt.userImg || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                      alt={cmt.userName} 
                      className="w-8 h-8 rounded-full object-cover bg-gray-100" 
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-xs text-gray-900">{cmt.userName}</span>
                        <span className="text-[9px] text-gray-400">
                          {cmt.createdAt ? new Date(cmt.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-605 leading-relaxed break-words">{cmt.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 mt-4">
                  <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm font-medium">No comments yet</p>
                  <p className="text-gray-400 text-xs">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handlePostComment} className="p-3 border-t border-gray-200 bg-white flex gap-2 items-center">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 border border-gray-350 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent transition-all outline-none"
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={postingComment || !newCommentText.trim()}
                className="bg-linkedin-blue hover:bg-blue-700 text-white p-2 rounded-full transition-colors disabled:bg-blue-200 cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDashboard;
