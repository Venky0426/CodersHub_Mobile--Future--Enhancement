import React, { useState, useEffect } from 'react';
import { Upload, Heart, MessageCircle, Share2, Download, UserPlus, Send, Search, Filter, X } from 'lucide-react';
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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [manualTech, setManualTech] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments State
  const [commentProject, setCommentProject] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const calculateMatchScore = (project, query) => {
    if (!query.trim()) return 0;
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length === 0) return 0;

    let matchedKeywords = [];
    keywords.forEach(kw => {
      const inTitle = project.title && project.title.toLowerCase().includes(kw);
      const inDesc = project.desc && project.desc.toLowerCase().includes(kw);
      const inTech = project.tech && project.tech.some(t => t.toLowerCase().includes(kw));
      if (inTitle || inDesc || inTech) {
        matchedKeywords.push(kw);
      }
    });

    if (matchedKeywords.length === 0) return 0;

    const ratio = matchedKeywords.length / keywords.length;
    let baseScore = 70 + (ratio * 15);

    let titleBonus = 0;
    let techBonus = 0;
    let descBonus = 0;
    
    keywords.forEach(kw => {
      if (project.title && project.title.toLowerCase().includes(kw)) titleBonus += 3;
      if (project.tech && project.tech.some(t => t.toLowerCase().includes(kw))) techBonus += 2;
      if (project.desc && project.desc.toLowerCase().includes(kw)) descBonus += 1;
    });

    return Math.min(Math.round(baseScore + titleBonus + techBonus + descBonus), 98);
  };

  const executeSearch = (queryText) => {
    setSearchQuery(queryText);
    setActiveSearchQuery(queryText.trim());
  };

  const getHighlightedText = (text, highlight) => {
    if (!highlight.trim() || !text) return <span>{text}</span>;
    const keywords = highlight.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length === 0) return <span>{text}</span>;
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          keywords.includes(part.toLowerCase()) ? (
            <span key={i} className="bg-yellow-100 font-semibold text-yellow-800">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const searchKeywords = activeSearchQuery.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0);
  const searchResults = activeSearchQuery.trim()
    ? projects
        .map(p => ({ ...p, matchScore: calculateMatchScore(p, activeSearchQuery) }))
        .filter(p => p.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
    : [];

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);
      setManualImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProject = async () => {
    if (!repoUrl) {
      alert('Please enter a GitHub repository URL');
      return;
    }
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/i);
    if (!match) {
      alert('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
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
        image: manualImage || data.owner.avatar_url,
        user: uName,
        userImg: uImg,
        repoLink: data.html_url,
        uid: user ? user.uid : 'anonymous',
        createdAt: new Date(),
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
      alert(e.message || 'Failed to fetch repository details or save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (project, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to like projects!');
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

  const handleDownload = async (project, e) => {
    e.stopPropagation();
    if (!project.repoLink || project.repoLink === '#') {
      alert('No repository link available for this project.');
      return;
    }

    window.open(project.repoLink, '_blank');

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

  const handleShare = (project, e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(project.repoLink || 'https://github.com');
      alert('Project repository link copied to clipboard!');
    } else {
      alert(`Project Link: ${project.repoLink}`);
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
    if (!user) {
      alert('Please log in to comment!');
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
      alert('Failed to post comment. Please try again!');
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="py-8 relative">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 mr-3 focus-within:ring-2 focus-within:ring-linkedin-blue focus-within:border-transparent transition-all">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              className="flex-1 ml-2 text-sm text-gray-900 bg-transparent outline-none border-none focus:ring-0"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executeSearch(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <button onClick={() => executeSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            className="bg-linkedin-blue px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors"
            onClick={() => executeSearch(searchQuery)}
          >
            Search
          </button>
        </div>
        {activeSearchQuery && (
          <div className="flex items-center mt-3 ml-1">
            <span className="text-linkedin-blue font-bold text-xs mr-1">💡 Tip:</span>
            <span className="text-gray-500 text-xs">Use specific keywords to get more relevant projects</span>
          </div>
        )}
      </div>

      {!activeSearchQuery ? (
        <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Build. Share. Collaborate.</h1>
          <p className="text-gray-600 mt-1">Discover amazing projects built by the community</p>
        </div>
        <button
          className="flex items-center px-5 py-2.5 bg-linkedin-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <Upload className="w-5 h-5 mr-2" /> Upload Project
        </button>
      </div>
      </>
      ) : (
        <div className="mb-6">
          <div className="flex flex-row justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Search Result</h2>
              <p className="text-sm text-gray-500 mt-0.5">We found {searchResults.length} projects related to your search</p>
            </div>
            <button className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-linkedin-blue mr-2" />
              <span className="text-gray-700 text-sm font-semibold">Filter</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap mb-6">
            <span className="text-sm font-bold text-gray-700 mr-3">Highlighted Keywords:</span>
            {searchKeywords.map((kw, i) => (
              <div key={i} className="bg-yellow-100 px-3 py-1 rounded-full mr-2 mb-2">
                <span className="text-yellow-800 text-xs font-bold capitalize">{kw}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for repo URL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100 transform transition-all max-h-[90vh] overflow-y-auto animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Project via GitHub URL</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repo URL *</label>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent transition-all"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="Leave empty to fetch from GitHub"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent transition-all"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                <textarea
                  placeholder="Leave empty to fetch from GitHub"
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent resize-none transition-all"
                  value={manualDesc}
                  onChange={e => setManualDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Node, Firebase"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent transition-all"
                  value={manualTech}
                  onChange={e => setManualTech(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Project Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-linkedin-blue hover:file:bg-blue-100 cursor-pointer"
                  onChange={handleImageChange}
                />
                {manualImage && (
                  <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={manualImage} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors cursor-pointer"
                onClick={() => { setShowModal(false); setRepoUrl(''); setManualImage(''); }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300 cursor-pointer flex items-center"
                onClick={handleAddProject}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Posting...
                  </>
                ) : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !activeSearchQuery ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-linkedin-blue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading projects...</p>
        </div>
      ) : (
        <div className={activeSearchQuery ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
          {(activeSearchQuery ? searchResults : projects).map((project, idx) => {
            const hasLiked = (project.likedBy || []).includes(auth.currentUser?.uid);
            const isSearchCard = !!activeSearchQuery;
            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl overflow-hidden flex border transition-all ${
                  isSearchCard 
                    ? "flex-row p-4 shadow-sm border-gray-200" 
                    : `flex-col h-full ${idx < 3 ? "shadow-md border-blue-200 transform hover:scale-[1.01]" : "shadow-sm border-gray-200 hover:shadow-md"}`
                }`}
              >
                {isSearchCard && (
                  <div className="w-48 h-full min-h-[140px] bg-gray-100 rounded-lg overflow-hidden mr-5 flex-shrink-0">
                    {project.image ? (
                      <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-linkedin-blue flex items-center justify-center">
                        <span className="text-white font-bold text-sm px-2 text-center">{project.title}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={isSearchCard ? 'flex-1 flex flex-col' : 'flex flex-col h-full'}>
                  {!isSearchCard && (
                    <div className="p-4 flex justify-between items-center border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img src={project.userImg} alt={project.user} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 flex items-center">
                            {project.user}
                            {idx < 3 && (
                              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-linkedin-blue rounded-full">Featured</span>
                            )}
                          </h4>
                          <p className="text-[10px] text-gray-400">Project Contributor</p>
                        </div>
                      </div>
                      <button className="text-linkedin-blue p-1.5 hover:bg-blue-50 rounded-full transition-colors cursor-pointer">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!isSearchCard && (
                    <div className="h-44 bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-100">
                      {project.image ? (
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-linkedin-blue to-blue-600 opacity-90 flex items-center justify-center">
                          <span className="text-white font-extrabold text-lg px-4 text-center truncate">{project.title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={isSearchCard ? 'flex-1 flex flex-col' : 'p-5 flex-1 flex flex-col'}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-gray-900 flex-1 mr-3 ${isSearchCard ? 'text-lg line-clamp-2' : 'text-base line-clamp-1'}`}>
                        {isSearchCard ? getHighlightedText(project.title, activeSearchQuery) : project.title}
                      </h3>
                      {isSearchCard && (
                        <div className="bg-green-50 px-3 py-1 rounded-full border border-green-200 whitespace-nowrap">
                          <span className="text-green-700 text-xs font-bold">{project.matchScore}% Match</span>
                        </div>
                      )}
                    </div>

                    {isSearchCard && (
                      <div className="flex items-center mb-3">
                        <img src={project.userImg} alt={project.user} className="w-5 h-5 rounded-full mr-2 bg-gray-100 object-cover" />
                        <span className="text-sm text-gray-600 font-medium mr-2">{project.user}</span>
                        <span className="bg-blue-50 px-2 py-0.5 rounded text-[10px] text-linkedin-blue font-semibold">Featured</span>
                      </div>
                    )}

                    <p className={`text-gray-600 text-sm leading-relaxed ${isSearchCard ? 'mb-3' : 'mb-4 line-clamp-2'}`}>
                      {isSearchCard ? getHighlightedText(project.desc, activeSearchQuery) : project.desc}
                    </p>
                    
                    <div className={`flex flex-wrap gap-1.5 mt-auto ${isSearchCard ? 'mb-2' : 'mb-4'}`}>
                      {project.tech && project.tech.map((t, i) => (
                        <span key={i} className={`px-2 py-1 rounded-md font-medium border ${isSearchCard ? 'bg-blue-50 text-linkedin-blue text-xs border-blue-100' : 'bg-gray-100 text-gray-600 text-[11px] border-gray-200'}`}>
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className={`flex justify-between items-center mt-2 ${isSearchCard ? 'pt-3 border-t border-gray-100' : 'pt-4 border-t border-gray-100'}`}>
                      <div className="flex gap-4">
                        {/* Heart (Like) button */}
                        <button 
                          onClick={(e) => handleLike(project, e)}
                          className={`flex items-center transition-colors cursor-pointer ${
                            hasLiked 
                              ? 'text-red-500 hover:text-red-600 font-bold' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} /> 
                          <span className="text-xs">{(project.likedBy || []).length}</span>
                        </button>

                        {/* Comment button */}
                        <button 
                          onClick={(e) => handleOpenComments(project, e)}
                          className="flex items-center text-gray-500 hover:text-linkedin-blue transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" /> 
                          <span className="text-xs">{(project.comments || []).length}</span>
                        </button>

                        {!isSearchCard && (
                          <button 
                            onClick={(e) => handleShare(project, e)}
                            className="flex items-center text-gray-500 hover:text-linkedin-blue transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {isSearchCard && (
                           <div className="flex items-center text-gray-500">
                             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             <span className="text-xs">{Math.floor(Math.random() * 300) + 50}</span>
                           </div>
                        )}
                      </div>

                      {isSearchCard ? (
                        <span className="text-xs text-gray-400">{(Math.floor(Math.random() * 10) + 1)} months ago</span>
                      ) : (
                        <button 
                          onClick={(e) => handleDownload(project, e)}
                          className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-gray-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> 
                          Code <span className="ml-1 text-[10px] text-gray-400 font-normal">({project.downloadsCount || 0})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSearchQuery && searchResults.length > 0 && (
          <div className="mt-6 mb-8">
            <button className="w-full bg-blue-50 hover:bg-blue-100 text-linkedin-blue py-3 rounded-lg font-semibold border border-blue-100 transition-colors flex justify-center items-center mb-8">
              View All {searchResults.length} Results <span className="ml-2">→</span>
            </button>

            <div>
              <p className="text-gray-600 text-sm font-semibold mb-3">Did you mean?</p>
              <div className="flex flex-wrap gap-2">
                {['Smart Farming', 'Smart Agriculture System', 'Farming Management System'].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => executeSearch(suggestion)}
                    className="bg-white hover:bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm text-gray-700 text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Comments Modal */}
      {commentProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 flex flex-col max-h-[85vh] transform transition-all overflow-hidden animate-scale-up">
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
                      <p className="text-xs text-gray-600 leading-relaxed break-words">{cmt.text}</p>
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
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent transition-all outline-none"
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

export default Projects;
