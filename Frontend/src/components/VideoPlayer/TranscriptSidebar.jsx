import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { X, Share2, PlaySquare } from 'lucide-react';
import { transcriptionAPI } from '../../services/api';

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

// Parse a timestamp string like "0:00", "1:23", "1:23:45" into seconds
const parseTimestamp = (ts) => {
  const parts = ts.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
};

// Strip markdown formatting from text
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/__(.+?)__/g, '$1')       // bold alt
    .replace(/_(.+?)_/g, '$1')         // italic alt
    .replace(/^#+\s*/gm, '')           // headers
    .replace(/^[-*]\s+/gm, '')         // bullet points
    .trim();
};

// Parse transcription text into segments with timestamps
// Handles: [0:00] text, **[0:00]** text, (0:00) text, 0:00 - text, * [0:00] text, etc.
const parseTranscription = (text) => {
  if (!text) return [];

  // Split by lines for easier processing
  const lines = text.split('\n');
  const segments = [];
  
  // Regex to find timestamps in various formats at start of line (after optional markdown)
  const lineTimestampRegex = /^\s*(?:[-*]\s*)?(?:\*\*)?[\[\(]?(\d{1,2}:\d{2}(?::\d{2})?)[\]\)]?(?:\*\*)?[\s\-–—:]*(.*)$/;
  
  let currentSegment = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const match = trimmedLine.match(lineTimestampRegex);
    
    if (match) {
      const timeStr = match[1];
      const timeInSeconds = parseTimestamp(timeStr);
      
      if (timeInSeconds !== null) {
        // Save previous segment
        if (currentSegment) {
          currentSegment.text = stripMarkdown(currentSegment.text);
          segments.push(currentSegment);
        }
        
        currentSegment = {
          time: timeInSeconds,
          timeStr: timeStr,
          text: match[2] || ''
        };
        continue;
      }
    }
    
    // No timestamp found — append to current segment or create intro
    if (currentSegment) {
      currentSegment.text += (currentSegment.text ? '\n' : '') + trimmedLine;
    } else {
      // Text before any timestamp
      if (segments.length === 0) {
        currentSegment = { time: null, timeStr: null, text: trimmedLine };
      }
    }
  }

  // Push the last segment
  if (currentSegment) {
    currentSegment.text = stripMarkdown(currentSegment.text);
    segments.push(currentSegment);
  }

  // If no segments at all, return full text as one segment
  if (segments.length === 0) {
    return [{ time: null, timeStr: null, text: stripMarkdown(text) }];
  }

  return segments;
};

const TranscriptSidebar = ({ chapters, currentTime, onSeek, onClose, videoThumbnail, onShareChapter, videoId, isOwner }) => {
  const scrollRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const activeTranscriptRef = useRef(null);
  const hasChapters = chapters && chapters.length > 0;
  const [activeTab, setActiveTab] = useState(hasChapters ? 'chapters' : 'transcript');
  const [transcription, setTranscription] = useState('');
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);

  // Find active chapter index
  const activeIndex = hasChapters ? [...chapters].reduce((acc, chapter, idx) => {
    if (currentTime >= chapter.time) {
      return idx;
    }
    return acc;
  }, 0) : -1;

  // Parse transcription into segments with timestamps
  const transcriptSegments = useMemo(() => parseTranscription(transcription), [transcription]);

  // Find active transcript segment based on currentTime
  const activeTranscriptIndex = useMemo(() => {
    if (!transcriptSegments.length) return -1;
    let active = -1;
    for (let i = 0; i < transcriptSegments.length; i++) {
      if (transcriptSegments[i].time !== null && currentTime >= transcriptSegments[i].time) {
        active = i;
      }
    }
    return active;
  }, [transcriptSegments, Math.floor(currentTime)]);

  // Auto-scroll to active transcript segment
  useEffect(() => {
    if (activeTab === 'transcript' && activeTranscriptRef.current) {
      activeTranscriptRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTranscriptIndex, activeTab]);

  // Fetch transcription when transcript tab is selected
  useEffect(() => {
    if (activeTab === 'transcript' && videoId && !transcription && !transcriptionLoading) {
      fetchTranscription();
    }
  }, [activeTab, videoId]);

  const fetchTranscription = async () => {
    try {
      setTranscriptionLoading(true);
      setTranscriptionError(null);
      const response = await transcriptionAPI.getTranscription(videoId);
      const transcriptionText = response.data.data?.transcription || response.data.transcription || '';
      
      // Check if the transcription is actually an error message from a failed generation
      if (transcriptionText.startsWith('Transcription could not be generated')) {
        setTranscription('');
        setTranscriptionError(transcriptionText);
      } else {
        setTranscription(transcriptionText);
      }
    } catch (error) {
      setTranscriptionError('Failed to load transcription');
      console.error('Transcription fetch error:', error);
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const handleRegenerateTranscript = async () => {
    try {
      setTranscriptionLoading(true);
      setTranscriptionError(null);
      setTranscription('');
      const response = await transcriptionAPI.regenerateTranscription(videoId);
      const transcriptionText = response.data.data?.transcription || response.data.transcription || '';
      
      if (transcriptionText.startsWith('Transcription could not be generated')) {
        setTranscription('');
        setTranscriptionError(transcriptionText);
      } else {
        setTranscription(transcriptionText);
      }
    } catch (error) {
      setTranscriptionError('Failed to generate transcription. Please try again later.');
      console.error('Transcription regeneration error:', error);
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const handleTimestampClick = useCallback((timeInSeconds) => {
    if (onSeek) {
      onSeek(timeInSeconds);
    }
  }, [onSeek]);

  // Auto-scroll to active chapter
  useEffect(() => {
    if (scrollRef.current && activeIndex >= 0 && activeTab === 'chapters') {
      const activeElement = scrollRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeIndex, activeTab]);



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
        {hasChapters && (
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
        )}
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
      
      <div ref={activeTab === 'chapters' ? scrollRef : transcriptScrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
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
          <div className="p-4">
            {transcriptionLoading ? (
              <div className="text-center text-[#aaaaaa] text-sm mt-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-4"></div>
                <p>Transcript syncing automatically.</p>
                <p className="mt-2 text-xs">Loading transcription...</p>
              </div>
            ) : transcriptionError ? (
              <div className="text-center text-[#aaaaaa] text-sm mt-10">
                <p className="text-red-400">{transcriptionError}</p>
                <button 
                  onClick={fetchTranscription}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  Retry
                </button>
              </div>
            ) : transcription ? (
              <div className="space-y-1">
                <div className="text-xs text-[#aaaaaa] mb-4 text-center">
                  <p>Click on a timestamp to jump to that point in the video.</p>
                </div>
                <div className="space-y-[2px]">
                  {transcriptSegments.map((segment, idx) => {
                    const isActive = idx === activeTranscriptIndex;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeTranscriptRef : null}
                        className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-[#3e3e3e]'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {segment.time !== null ? (
                          <button
                            onClick={() => handleTimestampClick(segment.time)}
                            className="flex-shrink-0 mt-[2px] text-[12px] font-medium text-[#3ea6ff] bg-[#263850] hover:bg-[#2d4a6a] px-2 py-0.5 rounded transition-colors cursor-pointer min-w-[48px] text-center"
                            title={`Jump to ${segment.timeStr}`}
                          >
                            {segment.timeStr}
                          </button>
                        ) : (
                          <span className="flex-shrink-0 mt-[2px] min-w-[48px]" />
                        )}
                        <p className={`text-sm leading-relaxed ${isActive ? 'text-white' : 'text-[#d4d4d4]'}`}>
                          {segment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-[#aaaaaa] text-sm mt-10">
                <p>No transcript available for this video.</p>
                {isOwner && (
                  <button 
                    onClick={handleRegenerateTranscript}
                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Generate Transcript
                  </button>
                )}
              </div>
            )}
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
