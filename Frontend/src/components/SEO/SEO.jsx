import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, image, url, type = 'website', jsonLd }) {
    const defaultTitle = "PlayBack - Video Sharing Platform";
    const defaultDescription = "Discover, watch, and share your favorite videos. Join the PlayBack community today!";
    const defaultKeywords = "video, sharing, PlayBack, Playback, play back, playback app, streaming, community, watch videos, video platform";
    const defaultImage = "https://playback.vercel.app/PlayBack.png";
    const defaultUrl = "https://playback.vercel.app";

    const seo = {
        title: title ? `${title} - PlayBack` : defaultTitle,
        description: description || defaultDescription,
        keywords: keywords || defaultKeywords,
        image: image || defaultImage,
        url: url ? `${defaultUrl}${url}` : defaultUrl,
    };

    // Default JSON-LD for WebSite schema
    const defaultJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "PlayBack",
        "url": defaultUrl,
        "description": defaultDescription,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${defaultUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const structuredData = jsonLd || defaultJsonLd;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="keywords" content={seo.keywords} />

            {/* Canonical URL */}
            <link rel="canonical" href={seo.url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={seo.url} />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            <meta property="og:image" content={seo.image} />
            <meta property="og:site_name" content="PlayBack" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={seo.url} />
            <meta name="twitter:title" content={seo.title} />
            <meta name="twitter:description" content={seo.description} />
            <meta name="twitter:image" content={seo.image} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}
