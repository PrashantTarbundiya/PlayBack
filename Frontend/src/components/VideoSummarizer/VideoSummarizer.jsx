import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import api, { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const VideoSummarizer = ({ videoId, videoTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSummarize = async () => {
    if (!videoId) {
      toast.remove();
      toast.error('Video ID not found');
      return;
    }

    toast.remove();
    setLoading(true);

    try {
      const response = await aiAPI.summarizeVideo(videoId);

      const data = response.data?.data;
      
      if (data) {
        setSummary(data);
        toast.remove();
        toast.success('Video analyzed successfully!');
      } else {
        throw new Error('No summary data received');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to analyze video';
      toast.remove();
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !videoId) return;

    toast.remove();
    const userQuestion = question.trim();
    setQuestion('');
    setAskingQuestion(true);

    setConversation(prev => [...prev, { type: 'user', content: userQuestion }]);

    try {
      const response = await aiAPI.askQuestion(videoId, userQuestion);
      const answer = response.data?.data;
      
      if (answer) {
        setConversation(prev => [...prev, { type: 'ai', content: String(answer) }]);
      } else {
        throw new Error('No answer received');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get answer';
      setConversation(prev => [...prev, { type: 'ai', content: `Sorry, I couldn't answer that question. ${errorMessage}` }]);
      toast.remove();
      toast.error(errorMessage);
    } finally {
      setAskingQuestion(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
    
    // Pause video if playing
    const video = document.querySelector('video');
    if (video && !video.paused) {
      video.pause();
    }
    
    if (!summary) {
      handleSummarize();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <>
      {/* Floating Circular Button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        title="AI Video Assistant"
      >
        <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl h-[81vh] sm:h-[85vh] md:h-[80vh] flex flex-col border border-gray-700 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">AI Video Assistant</h2>
                  <p className="text-xs sm:text-sm text-gray-400">Powered by Gemini AI</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Toggle Buttons */}
            <div className="lg:hidden flex border-b border-gray-700">
              <button
                onClick={() => setShowQA(false)}
                className={`flex-1 p-2 text-xs font-medium transition-colors ${
                  !showQA ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setShowQA(true)}
                className={`flex-1 p-2 text-xs font-medium transition-colors ${
                  showQA ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Ask Questions
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pt-4 sm:pt-0">
              {/* Summary Panel */}
              <div className={`${showQA ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/2 lg:border-r border-gray-700 flex-col`}>
                <div className="p-4 border-b border-gray-700 hidden lg:block">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Video Analysis
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 pt-4 sm:pt-2 space-y-4 max-h-[calc(90vh-200px)] sm:max-h-[calc(85vh-180px)] md:max-h-none">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Analyzing video content...</p>
                      </div>
                    </div>
                  ) : summary ? (
                    <>
                      {/* Summary */}
                      {(summary.comprehensiveSummary || summary.summary) && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            📝 Summary
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed bg-gray-800 p-2 sm:p-3 rounded-lg">
                            {summary.comprehensiveSummary || summary.summary}
                          </p>
                        </div>
                      )}

                      {/* Key Points */}
                      {(summary.detailedKeyPoints || summary.keyPoints) && (summary.detailedKeyPoints || summary.keyPoints).length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            🔑 Key Points
                          </h4>
                          <ul className="space-y-2">
                            {(summary.detailedKeyPoints || summary.keyPoints).map((point, index) => (
                              <li key={index} className="text-gray-300 text-xs sm:text-sm flex items-start gap-2 bg-gray-800 p-1.5 sm:p-2 rounded">
                                <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Insights */}
                      {(summary.researchInsights || summary.insights) && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            🔬 Insights
                          </h4>
                          <div className="space-y-3 bg-gray-800 p-2 sm:p-3 rounded-lg">
                            {(() => {
                              const insights = summary.researchInsights || summary.insights;
                              if (insights.topics) {
                                return insights.topics.map((topic, index) => (
                                  <div key={index} className="text-gray-300 text-xs flex items-start gap-2">
                                    <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                                    <span>{topic}</span>
                                  </div>
                                ));
                              }
                              if (insights.factualData) {
                                return insights.factualData.map((fact, index) => (
                                  <div key={index} className="text-gray-300 text-xs flex items-start gap-2">
                                    <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                                    <span>{fact}</span>
                                  </div>
                                ));
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Learning Outcomes */}
                      {(summary.educationalOutcomes || summary.learningOutcomes) && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            🎓 Learning Outcomes
                          </h4>
                          <ul className="space-y-2 bg-gray-800 p-2 sm:p-3 rounded-lg">
                            {(summary.educationalOutcomes?.learningObjectives || summary.learningOutcomes || []).map((outcome, index) => (
                              <li key={index} className="text-gray-300 text-xs flex items-start gap-2">
                                <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Applications */}
                      {(summary.educationalOutcomes?.practicalApplications || summary.applications) && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            ⚡ Applications
                          </h4>
                          <ul className="space-y-2 bg-gray-800 p-2 sm:p-3 rounded-lg">
                            {(summary.educationalOutcomes?.practicalApplications || summary.applications || []).map((app, index) => (
                              <li key={index} className="text-gray-300 text-xs flex items-start gap-2">
                                <span className="text-yellow-400 mt-1 flex-shrink-0">•</span>
                                <span>{app}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Target Audience */}
                      {(summary.contextualRelevance?.targetAudience || summary.audience) && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                            🎯 Target Audience
                          </h4>
                          <p className="text-gray-300 text-xs bg-gray-800 p-2 sm:p-3 rounded-lg">
                            {summary.contextualRelevance?.targetAudience || summary.audience}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click analyze to get AI insights about this video</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className={`${!showQA ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/2 flex-col border-t lg:border-t-0 border-gray-700`}>
                <div className="p-4 border-b border-gray-700 hidden sm:block">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    Ask Questions
                  </h3>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 pt-4 sm:pt-2 space-y-3 max-h-[calc(90vh-260px)] sm:max-h-[calc(85vh-240px)] md:max-h-[calc(80vh-200px)]">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">Ask me anything about this video!</p>
                      <p className="text-xs">I can answer questions about the content, explain concepts, or provide more details.</p>
                    </div>
                  ) : (
                    conversation.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          msg.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}>
                          <div className="leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {askingQuestion && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-sm text-gray-300 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Analyzing and formatting response...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Question Input */}
                <div className="p-2 sm:p-4 border-t border-gray-700 flex-shrink-0 bg-gray-900">
                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-1 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={askingQuestion}
                    />
                    <button
                      type="submit"
                      disabled={!question.trim() || askingQuestion}
                      className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoSummarizer;