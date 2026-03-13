import { FileText } from 'lucide-react';

const TranscriptionButton = ({ onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ${className}`}
      title="View transcription"
    >
      <FileText size={18} />
      <span className="hidden sm:inline text-sm">Transcript</span>
    </button>
  );
};

export default TranscriptionButton;