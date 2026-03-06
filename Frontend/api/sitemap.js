export default async function handler(req, res) {
  try {
    const API_BASE_URL = process.env.VITE_API_BASE_URL;
    const FRONTEND_URL = (
      process.env.FRONTEND_URL || "http://play-back-frontend.vercel.app"
    ).replace(/\/+$/, "");

    // Helper: safely format ISO date (YYYY-MM-DD for sitemaps)
    const toSitemapDate = (dateStr) => {
      try {
        return dateStr
          ? new Date(dateStr).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
      } catch (e) {
        return new Date().toISOString().split("T")[0];
      }
    };

    // Helper: escape XML special characters
    const escapeXml = (str) => {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };



    // --- Fetch data in parallel for speed ---
    const [videosRes, playlistsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/videos/?page=1&limit=5000`).catch(() => null),
      fetch(`${API_BASE_URL}/playlist/public?page=1&limit=500`).catch(
        () => null
      ),
    ]);

    let videos = [];
    let playlists = [];

    if (videosRes && videosRes.ok) {
      const videosData = await videosRes.json();
      videos = Array.isArray(videosData?.data)
        ? videosData.data
        : videosData?.data?.docs || [];
    }

    if (playlistsRes && playlistsRes.ok) {
      const playlistsData = await playlistsRes.json();
      playlists = Array.isArray(playlistsData?.data)
        ? playlistsData.data
        : [];
    }

    // Build today's date for static pages
    const today = new Date().toISOString().split("T")[0];

    // --- Static pages ---
    const staticPages = [
      { loc: "/", changefreq: "daily", priority: "1.0", lastmod: today },
      {
        loc: "/trending",
        changefreq: "daily",
        priority: "0.9",
        lastmod: today,
      },
      {
        loc: "/search",
        changefreq: "weekly",
        priority: "0.7",
        lastmod: today,
      },
      {
        loc: "/tweets",
        changefreq: "daily",
        priority: "0.8",
        lastmod: today,
      },
      {
        loc: "/login",
        changefreq: "monthly",
        priority: "0.3",
        lastmod: today,
      },
      {
        loc: "/register",
        changefreq: "monthly",
        priority: "0.3",
        lastmod: today,
      },
      {
        loc: "/browse-playlists",
        changefreq: "daily",
        priority: "0.8",
        lastmod: today,
      },
    ];

    const staticXml = staticPages
      .map(
        (page) => `
  <url>
    <loc>${FRONTEND_URL}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      )
      .join("");

    // --- Video pages with Google Video Sitemap extension ---
    const videoXml = videos
      .map((video) => {
        const lastmod = toSitemapDate(video.updatedAt);
        const title = escapeXml(video.title || "Untitled Video");
        const description = escapeXml(
          video.description || video.title || "Video on PlayBack"
        );
        const thumbnailUrl = video.thumbnail?.url || "";
        const videoFileUrl = video.videoFile?.url || "";
        const hasDuration = video.duration && !isNaN(video.duration);
        const publicationDate = video.createdAt
          ? new Date(video.createdAt).toISOString()
          : "";

        // Build <video:video> block only if we have a video URL
        let videoTag = "";
        if (videoFileUrl) {
          videoTag = `
    <video:video>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>${thumbnailUrl
              ? `
      <video:thumbnail_loc>${escapeXml(thumbnailUrl)}</video:thumbnail_loc>`
              : ""
            }
      <video:content_loc>${escapeXml(videoFileUrl)}</video:content_loc>${hasDuration
              ? `
      <video:duration>${Math.floor(video.duration)}</video:duration>`
              : ""
            }${publicationDate
              ? `
      <video:publication_date>${publicationDate}</video:publication_date>`
              : ""
            }
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
        }

        return `
  <url>
    <loc>${FRONTEND_URL}/watch/${video._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${videoTag}
  </url>`;
      })
      .join("");

    // --- Playlist pages ---
    const playlistXml = playlists
      .map((playlist) => {
        const lastmod = toSitemapDate(playlist.updatedAt);
        return `
  <url>
    <loc>${FRONTEND_URL}/playlist/${playlist._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join("");

    // --- Unique channel/profile pages from video owners ---
    const ownerUsernames = [
      ...new Set(
        videos
          .map((v) => v.owner?.username)
          .filter(Boolean)
      ),
    ];

    const profileXml = ownerUsernames
      .map(
        (username) => `
  <url>
    <loc>${FRONTEND_URL}/profile/${encodeURIComponent(username)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      )
      .join("");

    // --- Assemble final sitemap XML ---
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  <!-- Static Pages -->${staticXml}

  <!-- Video Pages -->${videoXml}

  <!-- Playlist Pages -->${playlistXml}

  <!-- Channel / Profile Pages -->${profileXml}

</urlset>`;

    // Set headers
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=600"
    );
    res.setHeader("X-Robots-Tag", "noindex"); // Don't index the sitemap page itself
    res.status(200).send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Return a minimal valid sitemap on error so crawlers don't see a 500
    const FRONTEND_URL = (
      process.env.FRONTEND_URL || "http://play-back-frontend.vercel.app"
    ).replace(/\/+$/, "");
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${FRONTEND_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(fallback);
  }
}
