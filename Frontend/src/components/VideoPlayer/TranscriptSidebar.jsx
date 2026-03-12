import React, { useRef, useEffect, useState } from 'react';
import { X, Share2, Repeat, PlaySquare } from 'lucide-react';

const formatTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00"
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const TranscriptSidebar = ({ chapters, currentTime, onSeek, onClose, videoThumbnail, onShareChapter }) => {
  const scrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chapters');

  // Find active chapter index
  const activeIndex = [...chapters].reduce((acc, chapter, idx) => {
    if (currentTime >= chapter.time) {
      return idx;
    }
    return acc;
  }, 0);

  // Auto-scroll to active chapter
  useEffect(() => {
    if (scrollRef.current && activeIndex >= 0 && activeTab === 'chapters') {
      const activeElement = scrollRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeIndex, activeTab]);

  // Prevent body scroll on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    
    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, []);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="bg-[#1f1f1f] rounded-t-2xl lg:rounded-xl p-6 text-center text-[#aaaaaa]">
        No transcript or chapters available for this video.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Backdrop Overlay - only visible on mobile when mounted */}
      <div 
        className="lg:hidden fixed inset-0 z-[1999] bg-black/60 transition-opacity"
        onClick={onClose}
      />
      
      {/* Container - Fixed Bottom Sheet on Mobile, Normal Block on Desktop */}
      <div className={`
        fixed bottom-0 left-0 right-0 h-[75vh] z-[2000] bg-[#1f1f1f] flex flex-col rounded-t-2xl transform transition-transform duration-300 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]
        lg:relative lg:inset-auto lg:z-auto lg:h-[600px] lg:rounded-xl lg:border lg:border-[#303030] lg:shadow-none lg:transform-none lg:w-full
      `}>
        <div className="flex items-center justify-between p-4 pb-2 border-b border-[#303030] lg:border-none">
        <h3 className="text-[18px] font-bold text-white tracking-wide">In this video</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full text-white transition-colors hover:bg-white/10"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        <button 
          onClick={() => setActiveTab('chapters')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'chapters' 
              ? 'bg-[#f1f1f1] text-[#0f0f0f]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Chapters
        </button>
        <button 
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'transcript' 
              ? 'bg-[#f1f1f1] text-[#0f0f0f]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Transcript
        </button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'chapters' ? (
          <div className="space-y-[1px]">
            {chapters.map((chapter, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  onClick={() => onSeek(chapter.time)}
                  className={`w-full flex items-start gap-4 p-3 pr-4 cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-[#3e3e3e]' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  {/* Thumbnail Pseudo-Element */}
                  <div className="w-[100px] h-[56px] bg-gray-600 rounded-md overflow-hidden flex-shrink-0 relative">
                     {videoThumbnail ? (
                        <img src={videoThumbnail} alt={chapter.title} className="w-full h-full object-cover opacity-80" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#272727]">
                          <PlaySquare size={20} className="text-gray-400 opacity-50"/>
                        </div>
                     )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className={`text-sm tracking-tight truncate ${isActive ? 'font-bold text-white' : 'font-medium text-white'}`}>
                      {chapter.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] font-medium text-[#c0e0fa] bg-[#27486e] bg-opacity-80 px-1 rounded-sm">
                        {formatTime(chapter.time)}
                      </span>
                      {isActive && (
                        <div className="flex items-center gap-3 text-white">
                          <button 
                            className="hover:text-[#3ea6ff] transition-colors p-1"
                            title="Share Chapter"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onShareChapter && onShareChapter(chapter.time); 
                            }}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-[#aaaaaa] text-sm mt-10">
            <p>Transcript syncing automatically.</p>
            <p className="mt-2 text-xs">Scroll to see more lines as the video plays.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #717171;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0a0a0;
        `
      }} />
    </div>
    </>
  );
};

export default TranscriptSidebar;
