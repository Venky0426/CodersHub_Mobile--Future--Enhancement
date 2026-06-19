import React, { useState } from 'react';
import { Search, Filter, UserPlus, Check } from 'lucide-react';

const studentsData = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  name: `Developer ${i + 1}`,
  college: ['MIT', 'Stanford', 'Harvard', 'IIT Bombay', 'Oxford'][i % 5],
  domain: ['Web Development', 'AI & ML', 'Blockchain', 'Cybersecurity', 'Mobile App'][i % 5],
  image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`,
}));

const ConnectStudents = () => {
  const [connected, setConnected] = useState({});

  const handleConnect = (id) => {
    setConnected(prev => ({ ...prev, [id]: true }));
    // In a real app, this would trigger a toast/popup and API call
  };

  return (
    <div className="py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Connect With Your Coding Community</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students by name..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-linkedin-blue outline-none"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 min-w-[140px]">
              <option>All Colleges</option>
              <option>Stanford</option>
              <option>MIT</option>
            </select>
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 min-w-[140px]">
              <option>All Domains</option>
              <option>Web Dev</option>
              <option>AI & ML</option>
            </select>
            <button className="flex items-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {studentsData.map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-200"></div>
            <div className="px-5 pb-5">
              <div className="relative flex justify-center -mt-10 mb-3">
                <img 
                  src={student.image} 
                  alt={student.name} 
                  className="w-20 h-20 rounded-full border-4 border-white bg-white"
                />
              </div>
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{student.college}</p>
                <span className="inline-block px-2.5 py-1 bg-blue-50 text-linkedin-blue text-xs rounded-full font-medium mt-1">
                  {student.domain}
                </span>
              </div>
              <button 
                onClick={() => handleConnect(student.id)}
                className={`w-full py-2 rounded-full font-medium flex items-center justify-center transition-colors ${
                  connected[student.id] 
                    ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                    : 'border border-linkedin-blue text-linkedin-blue hover:bg-blue-50'
                }`}
              >
                {connected[student.id] ? (
                  <><Check className="w-4 h-4 mr-2" /> Connected</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Connect</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectStudents;
