import { useState, useEffect } from 'react';
import { FileText, X, Copy, Download } from 'lucide-react';
import { transcriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TranscriptionPanel = ({ videoId, isOpen, onClose }) => {
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchTranscription();
    }
  }, [isOpen, videoId]);

  const fetchTranscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transcriptionAPI.getTranscription(videoId);
      setTranscription(response.data.data.transcription || response.data.transcription || '');
    } catch (error) {
      setError('Failed to load transcription');
      console.error('Transcription fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription)
      .then(() => toast.success('Transcription copied!'))
      .catch(() => toast.error('Failed to copy'));
  };

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${videoId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcription downloaded!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Video Transcription</h2>
          </div>
          <div className="flex items-center gap-2">
            {transcription && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy transcription"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Download transcription"
                >
                  <Download size={18} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading transcription...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={fetchTranscription}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : transcription ? (
            <div className="p-4 h-full overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                  {transcription}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No transcription available for this video</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPanel;