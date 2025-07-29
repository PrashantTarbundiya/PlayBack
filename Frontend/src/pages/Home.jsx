"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useVideo } from "../contexts/VideoContext";
import { videoAPI } from "../services/api";
import VideoCard from "../components/VideoCard/VideoCard";
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton";

const Home = () => {
  const { videos, setVideos, loading, setLoading } = useVideo();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoriesLoading, setCategoriesLoading] = useState(true);


  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await videoAPI.getVideoCategories();
      const categoriesData = response.data?.data || [];
      const processedCategories = [
        { name: "All", count: categoriesData.reduce((sum, cat) => sum + cat.count, 0) },
        ...categoriesData
      ];
      
      setCategories(processedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Function to get recommended videos from backend based on watch history
  const fetchRecommendedVideos = async (category = "All") => {
    try {
      if (category === "All") {
        // Try to use backend recommendation system for logged-in users
        try {
          const response = await videoAPI.getRecommendedVideos(1, 20);
          return response.data?.data?.videos || response.data?.videos || [];
        } catch (authError) {
          // If authentication fails or no recommendations, fallback to all videos
          console.log("Recommendation API failed, falling back to all videos:", authError.message);
          const response = await videoAPI.getAllVideosWithOwnerDetails();
          const data = response.data.data;
          const allVideos = Array.isArray(data) ? data : Array.isArray(data?.docs) ? data.docs : [];
          return allVideos.filter(video => video.isPublished === true);
        }
      } else {
        // For specific categories, use category-based fetching
        console.log("Fetching videos for category:", category);
        const response = await videoAPI.getVideosByCategory(category);
        console.log("Category response:", response.data);
        
        // Handle the response structure - getAllVideosWithOwnerDetails returns videos directly in data
        const videos = response.data?.data || response.data || [];
        const allVideos = Array.isArray(videos) ? videos : [];
        const publishedVideos = allVideos.filter(video => video.isPublished === true);
        console.log(`Found ${publishedVideos.length} published videos for category:`, category);
        return publishedVideos;
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      // Final fallback - return empty array
      return [];
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use backend recommendation system for better video suggestions
      const recommendedVideos = await fetchRecommendedVideos(selectedCategory);
      
      setVideos(recommendedVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, setVideos, setLoading]);

  const handleCategoryChange = useCallback((category) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [selectedCategory]);

  // Memoize the video grid to prevent unnecessary re-renders
  const videoGrid = useMemo(() => {
    if (videos.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full">
        {videos.map((video) => <VideoCard key={video._id} video={video} />)}
      </div>
    );
  }, [videos]);

  // Memoize category buttons to prevent unnecessary re-renders
  const categoryButtons = useMemo(() => {
    if (categoriesLoading) {
      return (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#404040] hover:scrollbar-thumb-[#555] pb-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="px-4 py-2 rounded-full bg-[#1e1e1e] animate-pulse flex-shrink-0"
              style={{ width: `${Math.random() * 40 + 60}px`, height: '32px' }}
            />
          ))}
        </div>
      );
    }

    return categories.map((category) => (
      <button
        key={category.name}
        onClick={() => handleCategoryChange(category.name)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
          selectedCategory === category.name
            ? 'bg-white text-black'
            : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]'
        }`}
      >
        {category.name}
      </button>
    ));
  }, [categories, categoriesLoading, selectedCategory, handleCategoryChange]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Category Filter Bar */}
      <div className="sticky top-14 bg-[#0f0f0f] border-b border-[#222] z-40 px-6 py-3">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#404040] hover:scrollbar-thumb-[#555] pb-2">
            {categoryButtons}
          </div>
        </div>
      </div>

      {/* Videos Content */}
      <div className="p-6 w-full">
        {loading ? (
          <VideoGridSkeleton count={12} />
        ) : videos.length > 0 ? (
          videoGrid
        ) : (
          <div className="text-center py-12 col-span-full flex flex-col items-center gap-4">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-semibold mb-2 text-white">
              No videos found{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
            </h3>
            <p className="text-gray-400 text-base leading-6">
              {selectedCategory !== "All"
                ? `Try browsing other categories or check back later`
                : 'Check back later for new content'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
