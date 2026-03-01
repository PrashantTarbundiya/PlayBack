export default async function handler(req, res) {
    try {
        const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://playback-backend.onrender.com/api/v1";
        const FRONTEND_URL = "https://playback.vercel.app";

        // 1. Fetch videos from your backend
        // Try to get as many as possible or default limit for sitemap
        const videosRes = await fetch(`${API_BASE_URL}/videos/?page=1&limit=5000`);
        const videosData = await videosRes.json();
        const videos = Array.isArray(videosData?.data) ? videosData.data : (videosData?.data?.docs || []);

        // 2. Fetch public playlists (Optional but good for SEO)
        const playlistsRes = await fetch(`${API_BASE_URL}/playlist/public?page=1&limit=500`);
        const playlistsData = await playlistsRes.json();
        const playlists = Array.isArray(playlistsData?.data) ? playlistsData.data : [];

        // Construct the XML string
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Static Core Pages -->
  <url>
    <loc>${FRONTEND_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${FRONTEND_URL}/trending</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${FRONTEND_URL}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Dynamic Video Pages -->
  ${videos
                .map((video) => {
                    // Safely check for date, default to current string if missing
                    const modDate = video.updatedAt ? new Date(video.updatedAt).toISOString() : new Date().toISOString();
                    return `
  <url>
    <loc>${FRONTEND_URL}/watch/${video._id}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
                })
                .join("")}

  <!-- Dynamic Playlist Pages -->
  ${playlists
                .map((playlist) => {
                    const modDate = playlist.updatedAt ? new Date(playlist.updatedAt).toISOString() : new Date().toISOString();
                    return `
  <url>
    <loc>${FRONTEND_URL}/playlist/${playlist._id}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
                })
                .join("")}

</urlset>`;

        res.setHeader("Content-Type", "text/xml");
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
        res.status(200).send(sitemap);
    } catch (error) {
        console.error("Sitemap generation error:", error);
        res.status(500).send("Error generating sitemap");
    }
}
