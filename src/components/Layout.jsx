import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import Navbar from './Navbar';

const Layout = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      } else {
        setCurrentUser(user);
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Periodic Presence Tracker
  useEffect(() => {
    if (!currentUser) return;

    const updatePresence = async () => {
      try {
        const q = query(collection(db, 'profiles'), where('uid', '==', currentUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          await updateDoc(docRef, {
            lastActive: new Date()
          });
        }
      } catch (err) {
        console.error("Error updating presence: ", err);
      }
    };

    // Update presence immediately and then every 2 minutes
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 2 * 60 * 1000);

    return () => clearInterval(presenceInterval);
  }, [currentUser]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-linkedin-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linkedin-light font-sans text-linkedin-dark">
      <Navbar />
      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
