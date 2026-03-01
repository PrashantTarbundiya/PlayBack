import React, { useState, useEffect } from "react";
import { X, Upload, Video } from "lucide-react";
import toast from "react-hot-toast";
import { videoAPI } from "../../services/api";

const EditVideoModal = ({ video, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");
    const [videoPreviewName, setVideoPreviewName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const categories = [
        'Gaming', 'Entertainment', 'Education', 'Music', 'Sports',
        'News', 'Technology', 'Comedy', 'Film & Animation',
        'How-to & Style', 'Travel & Events', 'Science & Technology',
        'People & Blogs', 'Pets & Animals', 'Autos & Vehicles',
        'Non-profits & Activism', 'Other'
    ];

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title || "",
                description: video.description || "",
                category: video.category || "Other",
            });
            setThumbnailPreview(video.thumbnail?.url || "");
        }
    }, [video]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreviewName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error("Title and description are required.");
            return;
        }

        try {
            setIsLoading(true);
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("category", formData.category);

            if (thumbnailFile) {
                data.append("thumbnail", thumbnailFile);
            }
            if (videoFile) {
                data.append("videoFile", videoFile);
            }

            const res = await videoAPI.updateVideo(video._id, data);
            toast.success("Video updated successfully");
            if (onUpdate) {
                onUpdate(res.data?.data || res.data);
            }
            onClose();
        } catch (error) {
            console.error("Error updating video:", error);
            toast.error(error.response?.data?.message || "Failed to update video");
        } finally {
            setIsLoading(false);
        }
    };

    if (!video) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#1c1c1c] w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Edit Video</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <form id="edit-video-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Add a title that describes your video"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Tell viewers about your video"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Media Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Thumbnail */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Thumbnail (Optional)
                                </label>
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-700 rounded-lg overflow-hidden bg-[#121212] flex flex-col items-center justify-center p-4 min-h-[150px]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {thumbnailPreview ? (
                                        <img src={thumbnailPreview} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload size={32} className="text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-400">Upload new thumbnail</p>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">Change Image</span>
                                    </div>
                                </div>
                            </div>

                            {/* Video File */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Video File (Optional)
                                </label>
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-700 rounded-lg bg-[#121212] flex flex-col items-center justify-center p-4 min-h-[150px]">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <Video size={32} className="text-gray-500 mb-2" />
                                    <p className="text-sm text-gray-400 text-center px-2">
                                        {videoPreviewName ? `Selected: ${videoPreviewName}` : "Replace video file"}
                                    </p>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center pointer-events-none">
                                        <span className="text-white text-sm font-medium">Select Video</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 flex justify-end gap-4 bg-[#181818]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-video-form"
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : "Save Changes"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditVideoModal;
