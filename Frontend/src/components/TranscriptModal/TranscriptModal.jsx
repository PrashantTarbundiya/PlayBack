import { useState, useEffect } from 'react';
import { X, RefreshCw, Save, Edit3, Eye, Loader2 } from 'lucide-react';
import { transcriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TranscriptModal = ({ video, onClose }) => {
  const [transcription, setTranscription] = useState('');
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTranscription();
  }, [video._id]);

  const fetchTranscription = async () => {
    try {
      setLoading(true);
      const response = await transcriptionAPI.getTranscription(video._id, { noGenerate: true });
      const text = response.data.data?.transcription || response.data.transcription || '';
      const isError = text.startsWith('Transcription could not be generated');
      setTranscription(isError ? '' : text);
      setEditedText(isError ? '' : text);
    } catch (err) {
      setTranscription('');
      setEditedText('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const response = await transcriptionAPI.regenerateTranscription(video._id);
      const text = response.data.data?.transcription || response.data.transcription || '';
      setTranscription(text);
      setEditedText(text);
      setIsEditing(false);
      setHasChanges(false);
      toast.remove();
      toast.success('Transcript regenerated');
    } catch (err) {
      toast.remove();
      toast.error('Failed to regenerate transcript');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await transcriptionAPI.updateTranscription(video._id, editedText);
      setTranscription(editedText);
      setIsEditing(false);
      setHasChanges(false);
      toast.remove();
      toast.success('Transcript saved');
    } catch (err) {
      toast.remove();
      toast.error('Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (e) => {
    setEditedText(e.target.value);
    setHasChanges(e.target.value !== transcription);
  };

  const handleCancel = () => {
    setEditedText(transcription);
    setIsEditing(false);
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#1c1c1c] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">Transcript</h2>
            <p className="text-sm text-gray-400 truncate mt-0.5">{video.title}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* View/Edit toggle */}
            {!loading && transcription && (
              <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEditing
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                {isEditing ? <><Eye size={14} /> View</> : <><Edit3 size={14} /> Edit</>}
              </button>
            )}
            {/* Regenerate */}
            <button
              onClick={handleRegenerate}
              disabled={regenerating || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? 'Generating...' : transcription ? 'Regenerate' : 'Generate'}
            </button>
            {/* Save */}
            {isEditing && hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm">Loading transcript...</p>
            </div>
          ) : regenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw size={32} className="animate-spin mb-3" />
              <p className="text-sm">Generating transcript with AI...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a minute</p>
            </div>
          ) : isEditing ? (
            <textarea
              value={editedText}
              onChange={handleTextChange}
              className="w-full h-[50vh] bg-[#0f0f0f] text-white text-sm leading-relaxed p-4 rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none resize-none font-mono"
              placeholder="Enter transcript text here...&#10;&#10;Use this format for timestamps:&#10;[0:00] First line of speech&#10;[0:05] Next line of speech"
              spellCheck={false}
            />
          ) : transcription ? (
            <div className="space-y-0.5">
              {transcription.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const match = trimmed.match(/^\s*[\[\(]?(\d{1,2}:\d{2}(?::\d{2})?)[\]\)]?\s*[-–—:]?\s*(.*)$/);
                if (match) {
                  return (
                    <div key={idx} className="flex items-start gap-3 px-3 py-1.5 rounded-lg hover:bg-white/5">
                      <span className="flex-shrink-0 mt-[2px] text-xs font-medium text-[#3ea6ff] bg-[#263850] px-2 py-0.5 rounded min-w-[48px] text-center">
                        {match[1]}
                      </span>
                      <p className="text-sm text-[#d4d4d4] leading-relaxed">{match[2]}</p>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="px-3 py-1.5">
                    <p className="text-sm text-[#d4d4d4] leading-relaxed">{trimmed}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm mb-4">No transcript available for this video.</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Generate Transcript
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;
