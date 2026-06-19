import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Search, Plus, Check } from 'lucide-react';
import clsx from 'clsx';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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

const CreateProfile = () => {
  const navigate = useNavigate();

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [domainSearch, setDomainSearch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [bio, setBio] = useState('');

  const domains = [
    'Backend Development', 'Web Development', 'Mobile App Development', 
    'Data Science & ML', 'Cloud Computing & DevOps', 'Game Development', 
    'Cybersecurity', 'Embedded Systems & IoT', 'Blockchain Development', 
    'Artificial Intelligence', 'Database Development'
  ];

  const toggleDomain = (domain) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const filteredDomains = domains.filter(d => d.toLowerCase().includes(domainSearch.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/;
    if (!emailRegex.test(email)) {
      alert('Please use a valid Cambridge email (e.g., name@cambridge.edu.in)');
      return;
    }
    try {
      let uid;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } catch (signInError) {
            alert('This email is already registered! Please enter the correct password for this account to complete profile setup, or use a different email.');
            return;
          }
        } else {
          throw authError;
        }
      }

      let imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
      if (selectedFile) {
        try {
          const rawBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          imageUrl = await compressImage(rawBase64);
        } catch (base64Error) {
          console.error('Image processing failed:', base64Error);
        }
      }

      try {
        await addDoc(collection(db, 'profiles'), {
          uid,
          email,
          fullName,
          college,
          bio,
          domains: selectedDomains,
          imageUrl,
          createdAt: new Date(),
        });
      } catch (firestoreError) {
        console.error('Firestore write failed:', firestoreError);
        alert('Could not save profile data to Firestore. Please make sure your Firestore Rules allow writes!');
        return;
      }

      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header & Progress */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 text-3xl font-bold text-linkedin-blue mb-2">
            <img src="/events/CodersHubLogo.png" className="w-10 h-10 object-contain" alt="Logo" />
            <h1>CodersHub</h1>
          </div>
          <p className="text-gray-600 mb-8">Let's set up your developer profile</p>
          
          <div className="flex items-center justify-center max-w-md mx-auto">
            <div className="w-8 h-8 rounded-full bg-linkedin-blue text-white flex items-center justify-center font-bold text-sm">1</div>
            <div className="h-1 w-16 bg-linkedin-blue"></div>
            <div className="w-8 h-8 rounded-full bg-linkedin-blue text-white flex items-center justify-center font-bold text-sm">2</div>
            <div className="h-1 w-16 bg-gray-200"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">3</div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* Basic Info */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group cursor-pointer">
  <input type="file" accept="image/*" className="hidden" id="profileImageInput" onChange={(e) => setSelectedFile(e.target.files[0])} />
  <label htmlFor="profileImageInput" className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-linkedin-blue cursor-pointer">
    {selectedFile ? (
      <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
    ) : (
      <>
        <Camera className="w-8 h-8 text-gray-400 group-hover:text-linkedin-blue" />
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">Upload</span>
        </div>
      </>
    )}
  </label>
</div>
              </div>
              
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College / University</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none" placeholder="Stanford University" value={college} onChange={e => setCollege(e.target.value)} required />
                </div>
                <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
  <textarea rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none resize-none" placeholder="Passionate developer building things..." value={bio} onChange={e => setBio(e.target.value)} />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none" placeholder="name@cambridge.edu.in" value={email} onChange={e => setEmail(e.target.value)} required />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
  <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none" placeholder="Enter a password" value={password} onChange={e => setPassword(e.target.value)} required />
</div>
</div>
</div>

            <hr className="border-gray-100" />

            {/* Domains */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Interested Domains</h3>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-linkedin-blue outline-none text-sm"
                  placeholder="Search domains..."
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {filteredDomains.map(domain => {
                  const isSelected = selectedDomains.includes(domain);
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleDomain(domain)}
                      className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center border",
                        isSelected 
                          ? "bg-linkedin-blue/10 border-linkedin-blue text-linkedin-blue" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 mr-1.5" />}
                      {domain}
                    </button>
                  );
                })}
                <button type="button" className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:text-linkedin-blue hover:border-linkedin-blue flex items-center transition-colors">
                  <Plus className="w-4 h-4 mr-1" /> Custom Domain
                </button>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button type="submit" className="px-8 py-3 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Continue to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
