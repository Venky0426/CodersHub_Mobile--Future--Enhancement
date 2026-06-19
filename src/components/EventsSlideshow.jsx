import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, ExternalLink, X } from 'lucide-react';

const eventsData = [
  {
    id: 1,
    title: 'National Level Hackathon',
    organizer: 'CARE College of Engineering',
    date: 'Mar 14–15, 2025',
    location: 'CARE Campus, Trichy',
    image: '/events/hackathon_care.png',
    tag: 'Hackathon',
    tagColor: '#e040fb',
  },
  {
    id: 2,
    title: 'The Great Bengaluru Hackathon',
    organizer: 'PES University',
    date: 'Mar 15–16, 2025',
    location: 'PES University, Bengaluru',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    tag: 'Hackathon',
    tagColor: '#2979ff',
  },
  {
    id: 3,
    title: 'AI & ML Workshop 2025',
    organizer: 'IIT Madras',
    date: 'Apr 5–6, 2025',
    location: 'IIT Madras Campus',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    tag: 'Workshop',
    tagColor: '#00c853',
  },
  {
    id: 4,
    title: 'CodeFest',
    organizer: 'NIT Trichy',
    date: 'May 20, 2025',
    location: 'NIT Trichy',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    tag: 'Competition',
    tagColor: '#ff6d00',
  },
  {
    id: 5,
    title: 'Cloud Summit',
    organizer: 'VIT University',
    date: 'Jun 10–11, 2025',
    location: 'VIT Vellore',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    tag: 'Summit',
    tagColor: '#00bcd4',
  },
];

const SLIDE_DURATION = 4000;

const EventsSlideshow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const currentEvent = eventsData[currentIndex];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const intervalTime = 50;
    const step = (intervalTime / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < eventsData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [currentIndex]);

  return (
    <>
      {/* Floating Bubble */}
      {!isOpen && (
        <div 
          className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-40 cursor-pointer group hover:scale-105 transition-transform"
          onClick={() => {
            setIsOpen(true);
            setCurrentIndex(0);
            setProgress(0);
          }}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-white overflow-hidden shadow-2xl bg-white p-0.5">
               <img 
                 src={eventsData[0].image} 
                 className="w-full h-full rounded-full object-cover" 
                 alt="Events" 
                 onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80'; }}
               />
               <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                 <Calendar className="w-6 h-6 text-white drop-shadow-md" />
               </div>
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {eventsData.length}
            </div>
          </div>
        </div>
      )}

      {/* Event Viewer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-6 right-4 z-[110] p-2 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:aspect-[9/16] bg-gray-900 sm:rounded-2xl overflow-hidden shadow-2xl sm:ring-1 sm:ring-white/10 flex flex-col">
            
            {/* Story Progress Bars */}
            <div className="absolute top-0 left-0 right-0 px-2 pt-2 flex gap-1 z-20">
              {eventsData.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all ease-linear"
                    style={{ 
                      width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`,
                      transitionDuration: idx === currentIndex ? '50ms' : '0ms'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-8 sm:pt-6 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-3 z-10">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                 <Calendar className="w-5 h-5 text-gray-800" />
              </div>
              <div className="flex flex-col min-w-0 pr-12">
                <span className="text-white font-bold drop-shadow-md text-sm truncate">{currentEvent.organizer}</span>
                <span className="text-white/80 text-[11px] font-medium" style={{ color: currentEvent.tagColor }}>{currentEvent.tag}</span>
              </div>
            </div>

            {/* Navigation Click Areas */}
            <div className="absolute inset-0 z-[5] flex">
               <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev}></div>
               <div className="w-2/3 h-full cursor-pointer" onClick={handleNext}></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
              <img 
                src={currentEvent.image} 
                className="w-full h-full object-cover opacity-80" 
                alt="Event" 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'; }} 
              />
              
              {/* Event Details Overlay */}
              <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pointer-events-none">
                 <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg leading-tight">{currentEvent.title}</h2>
                 
                 <div className="space-y-2 mb-4">
                   <div className="flex items-center text-white/90 text-sm gap-2 font-medium">
                     <Calendar className="w-4 h-4 text-blue-400" />
                     <span className="drop-shadow-md">{currentEvent.date}</span>
                   </div>
                   <div className="flex items-center text-white/90 text-sm gap-2 font-medium">
                     <MapPin className="w-4 h-4 text-red-400" />
                     <span className="drop-shadow-md">{currentEvent.location}</span>
                   </div>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:pb-4 bg-black/60 backdrop-blur-md flex justify-center z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Registering for ${currentEvent.title}`);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-linkedin-blue text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 w-full justify-center"
              >
                <ExternalLink className="w-5 h-5" />
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventsSlideshow;
