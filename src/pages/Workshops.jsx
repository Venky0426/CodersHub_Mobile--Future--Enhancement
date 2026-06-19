import React, { useState, useEffect } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Workshops = () => {
  const [currentUserAvatar, setCurrentUserAvatar] = useState('https://randomuser.me/api/portraits/women/44.jpg');
  const [currentUserName, setCurrentUserName] = useState('Anonymous User');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            if (data.imageUrl) {
              setCurrentUserAvatar(data.imageUrl);
            }
            if (data.fullName) {
              setCurrentUserName(data.fullName);
            }
          }
        } catch (error) {
          console.error('Error fetching profile picture:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [workshops, setWorkshops] = useState([
    {
      id: 1,
      author: 'Sarah Developer',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
      category: 'AI/ML',
      date: '25 May',
      title: 'AIML Workshop',
      time: '10:00 AM',
      registeredCount: 142
    },
    {
      id: 2,
      author: 'John Coder',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
      category: 'DevOps',
      date: '27 May',
      title: 'DevOps Workshop',
      time: '11:00 AM',
      registeredCount: 89
    },
    {
      id: 3,
      author: 'Emma Eng',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      category: 'Web',
      date: '30 May',
      title: 'Full Stack Workshop',
      time: '2:00 PM',
      registeredCount: 215
    },
    {
      id: 4,
      author: 'Mike Chen',
      avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
      image: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=800&q=80',
      category: 'Frontend',
      date: '5 Jun',
      title: 'Advanced React Patterns',
      time: '1:00 PM',
      registeredCount: 305
    },
    {
      id: 5,
      author: 'Lisa Bitcoin',
      avatar: 'https://randomuser.me/api/portraits/women/24.jpg',
      image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
      category: 'Web3',
      date: '10 Jun',
      title: 'Blockchain Fundamentals',
      time: '11:00 AM',
      registeredCount: 150
    },
    {
      id: 6,
      author: 'DevOps Dan',
      avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
      image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=800&q=80',
      category: 'DevOps',
      date: '12 Jun',
      title: 'Mastering Docker',
      time: '4:00 PM',
      registeredCount: 420
    },
    {
      id: 7,
      author: 'Data Dave',
      avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      category: 'Data Science',
      date: '15 Jun',
      title: 'Intro to Python & Pandas',
      time: '9:00 AM',
      registeredCount: 275
    },
    {
      id: 8,
      author: 'Sarah Designer',
      avatar: 'https://randomuser.me/api/portraits/women/71.jpg',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
      category: 'Design',
      date: '18 Jun',
      title: 'UI/UX for Developers',
      time: '2:00 PM',
      registeredCount: 198
    },
    {
      id: 9,
      author: 'Hacker Bob',
      avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      category: 'Cybersecurity',
      date: '20 Jun',
      title: 'Securing Node.js Apps',
      time: '3:30 PM',
      registeredCount: 112
    }
  ]);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newWorkshopData, setNewWorkshopData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    image: ''
  });

  const handlePostWorkshop = () => {
    if (!newWorkshopData.title || !newWorkshopData.category) return;
    
    const newWorkshop = {
      id: Date.now(),
      author: currentUserName,
      avatar: currentUserAvatar,
      image: newWorkshopData.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      category: newWorkshopData.category,
      date: newWorkshopData.date || 'Soon',
      title: newWorkshopData.title,
      time: newWorkshopData.time || 'TBD',
      registeredCount: 0
    };

    setWorkshops([newWorkshop, ...workshops]);
    setNewWorkshopData({ title: '', category: '', date: '', time: '', image: '' });
    setIsPostModalOpen(false);
  };

  const handleRegister = (id) => {
    setWorkshops(workshops.map(ws => {
      if (ws.id === id) {
        return { ...ws, registeredCount: ws.registeredCount + 1 };
      }
      return ws;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workshops & Guidance</h1>
        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Post Workshop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
        {workshops.map((workshop) => (
          <div key={workshop.id} className="flex flex-col">
            {/* User Profile Info Above Card (matching the green outlines) */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <img src={workshop.avatar} alt={workshop.author} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
              <span className="font-semibold text-gray-800 text-sm">{workshop.author}</span>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex-1 flex flex-col">
              {/* Workshop Image */}
              <div className="h-48 w-full overflow-hidden bg-gray-100">
                <img src={workshop.image} alt={workshop.title} className="w-full h-full object-cover" />
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-500 text-xs font-semibold rounded-full">
                    {workshop.category}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {workshop.date}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{workshop.title}</h3>
                
                <div className="text-gray-500 text-sm mb-6 flex-1 flex justify-between items-center">
                  <span>{workshop.time}</span>
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{workshop.registeredCount}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleRegister(workshop.id)}
                  className="w-full py-2.5 bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mt-auto"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Workshop Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Post a Workshop</h2>
              <button onClick={() => setIsPostModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workshop Title</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Intro to React"
                  value={newWorkshopData.title}
                  onChange={(e) => setNewWorkshopData({ ...newWorkshopData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Web"
                    value={newWorkshopData.category}
                    onChange={(e) => setNewWorkshopData({ ...newWorkshopData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="https://..."
                    value={newWorkshopData.image}
                    onChange={(e) => setNewWorkshopData({ ...newWorkshopData, image: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., 15 Jun"
                    value={newWorkshopData.date}
                    onChange={(e) => setNewWorkshopData({ ...newWorkshopData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., 2:00 PM"
                    value={newWorkshopData.time}
                    onChange={(e) => setNewWorkshopData({ ...newWorkshopData, time: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsPostModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!newWorkshopData.title || !newWorkshopData.category}
                onClick={handlePostWorkshop}
                className="bg-[#1d4ed8] text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Post Workshop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workshops;
