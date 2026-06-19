import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import clsx from 'clsx';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Navbar = () => {
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'profiles'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            if (data.imageUrl) {
              setAvatarUrl(data.imageUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching navbar profile picture:', error);
        }
      } else {
        setAvatarUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
      }
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Home', path: '/home' },
    { name: 'Projects', path: '/projects' },
    { name: 'Startup Hub', path: '/startup-hub' },
    { name: 'Network', path: '/connect' },
    { name: 'Messages', path: '/messages' },
    { name: 'Workshops', path: '/workshops' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-14">

          {/* Left */}
          <div className="flex items-center gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-linkedin-blue">
              <img src="/events/CodersHubLogo.png" className="w-9 h-9 object-contain" alt="Logo" />
              <span className="text-xl font-bold tracking-tight">CodersHub</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 h-10 w-72 focus-within:bg-white focus-within:border-gray-300 transition-colors">

              <Search className="w-4 h-4 text-gray-400 mr-2" />

              <input
                type="text"
                placeholder="Search developers, startups, projects..."
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400 text-gray-700"
              />
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-6">

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={clsx(
                    "text-sm font-medium h-14 flex items-center border-b-2 transition-all",
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="border-l border-gray-300 h-7"></div>

            {/* Notifications */}
            <button className="flex flex-col items-center justify-center text-gray-500 hover:text-black transition-colors">
              <Bell className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] hidden md:block">
                Notifications
              </span>
            </button>

            {/* Profile */}
            <Link
              to="/profile"
              className="flex flex-col items-center justify-center text-gray-500 hover:text-black transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-gray-200 overflow-hidden mb-0.5 flex items-center justify-center">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="text-[10px] hidden md:block">
                Me ▼
              </span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;