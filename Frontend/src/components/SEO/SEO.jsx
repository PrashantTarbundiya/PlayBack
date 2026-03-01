import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, image, url, type = 'website' }) {
    const defaultTitle = "PlayBack - Video Sharing Platform";
    const defaultDescription = "Discover, watch, and share your favorite videos. Join the PlayBack community today!";
    const defaultKeywords = "video, sharing, PlayBack, Playback, play back, playback app, streaming, community, watch videos, video platform";
    const defaultImage = "https://playback.vercel.app/PlayBack.png"; // Replace with absolute default OG image url if possible
    const defaultUrl = "https://playback.vercel.app";

    const seo = {
        title: title ? `${title} - PlayBack` : defaultTitle,
        description: description || defaultDescription,
        keywords: keywords || defaultKeywords,
        image: image || defaultImage,
        url: url ? `${defaultUrl}${url}` : defaultUrl,
    };

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="keywords" content={seo.keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={seo.url} />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            <meta property="og:image" content={seo.image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={seo.url} />
            <meta property="twitter:title" content={seo.title} />
            <meta property="twitter:description" content={seo.description} />
            <meta property="twitter:image" content={seo.image} />
        </Helmet>
    );
}
