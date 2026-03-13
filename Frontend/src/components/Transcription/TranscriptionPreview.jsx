import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { transcriptionAPI } from '../../services/api';

const TranscriptionPreview = ({ videoId }) => {
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasTranscription, setHasTranscription] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchTranscription();
    }
  }, [videoId]);

  const fetchTranscription = async () => {
    try {
      setLoading(true);
      const response = await transcriptionAPI.getTranscription(videoId);
      const transcriptionText = response.data.data.transcription || response.data.transcription || '';
      setTranscription(transcriptionText);
      setHasTranscription(!!transcriptionText);
    } catch (error) {
      setHasTranscription(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">Transcription</span>
        </div>
        <div className="animate-pulse text-gray-400 text-sm">Loading transcription...</div>
      </div>
    );
  }

  if (!hasTranscription) {
    return null;
  }

  const previewText = transcription.substring(0, 200);
  const shouldShowExpand = transcription.length > 200;

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">Transcription</span>
        </div>
        {shouldShowExpand && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show more
              </>
            )}
          </button>
        )}
      </div>
      <div className="text-sm text-gray-300 leading-relaxed">
        <pre className="whitespace-pre-wrap font-sans">
          {expanded ? transcription : previewText}
          {!expanded && shouldShowExpand && '...'}
        </pre>
      </div>
    </div>
  );
};

export default TranscriptionPreview;