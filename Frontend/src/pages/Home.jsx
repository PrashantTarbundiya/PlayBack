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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);


  useEffect(() => {
    fetchCategories();
    resetAndLoad();
  }, []);

  useEffect(() => {
    resetAndLoad();
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
      // console.error("Failed to fetch categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch paginated videos (supports category filter)
  const fetchRecommendedVideos = async (category = "All", pageNum = 1, limitNum = 10) => {
    try {
      if (category === "All") {
        const response = await videoAPI.getAllVideosWithOwnerDetails(pageNum, limitNum);
        const data = response.data?.data;
        return Array.isArray(data) ? data : [];
      }

      // Category-specific
      const response = await videoAPI.getVideosByCategory(category, pageNum, limitNum);
      const data = response.data?.data || response.data;
      const list = Array.isArray(data) ? data : [];
      return list;
    } catch (error) {
      return [];
    }
  };

  const LIMIT = 10;

  const resetAndLoad = useCallback(async () => {
    try {
      setLoading(true);
      setVideos([]);
      setPage(1);
      setHasMore(true);
      const firstBatch = await fetchRecommendedVideos(selectedCategory, 1, LIMIT);
      setVideos(firstBatch);
      setHasMore(firstBatch.length === LIMIT);
      setPage(2);
    } catch (_) {
      setVideos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, setLoading, setVideos]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || loading) return;
    setIsFetchingMore(true);
    try {
      const nextBatch = await fetchRecommendedVideos(selectedCategory, page, LIMIT);
      setVideos(prev => [...prev, ...nextBatch]);
      setHasMore(nextBatch.length === LIMIT);
      setPage(prev => prev + 1);
    } catch (_) {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, loading, selectedCategory, page, setVideos]);

  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMore();
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  const handleCategoryChange = useCallback((category) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [selectedCategory]);

  // Memoize the video grid to prevent unnecessary re-renders
  const videoGrid = useMemo(() => {
    if (videos.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 w-full">
        {videos.map((video) => <VideoCard key={video._id} video={video} />)}
      </div>
    );
  }, [videos]);

  // Memoize category buttons to prevent unnecessary re-renders
  const categoryButtons = useMemo(() => {
    if (categoriesLoading) {
          return (
      <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#404040] hover:scrollbar-thumb-[#555] pb-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="px-3 sm:px-4 py-2 rounded-full bg-[#1e1e1e] animate-pulse flex-shrink-0"
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
        className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
      <div className="sticky top-14 bg-[#0f0f0f] border-b border-[#222] z-40 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#404040] hover:scrollbar-thumb-[#555] pb-2 -mx-1 px-1">
            {categoryButtons}
          </div>
        </div>
      </div>

      {/* Videos Content */}
      <div className="p-4 sm:p-6 w-full">
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
