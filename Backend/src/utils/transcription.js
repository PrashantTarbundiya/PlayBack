import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from 'node-fetch';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fetch with retry logic for transient Cloudinary errors (503, 429, etc.)
const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                },
                timeout: 120000, // 2 min timeout for large videos
            });

            if (response.ok) return response;

            // Retry on server errors (503, 429, 500, 502, 504)
            if ([500, 502, 503, 504, 429].includes(response.status) && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Video fetch attempt ${attempt} failed (${response.status}), retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
        } catch (error) {
            if (error.type === 'request-timeout' && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Video fetch attempt ${attempt} timed out, retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
};

export const generateTranscription = async (videoUrl) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.log("Gemini API key not found");
            return null;
        }

        if (!videoUrl) {
            console.log("No video URL provided for transcription");
            return null;
        }

        console.log(`Starting transcription for: ${videoUrl.substring(0, 80)}...`);

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Download video file as buffer with retry
        const response = await fetchWithRetry(videoUrl);
        
        const videoBuffer = await response.arrayBuffer();
        const videoBase64 = Buffer.from(videoBuffer).toString('base64');

        // Detect mime type from URL
        const mimeType = videoUrl.includes('.webm') ? 'video/webm' 
            : videoUrl.includes('.mov') ? 'video/quicktime'
            : 'video/mp4';

        console.log(`Video downloaded (${(videoBuffer.byteLength / 1024 / 1024).toFixed(1)}MB), sending to Gemini...`);

        const prompt = `You are a professional video transcription AI. Analyze this video and provide ACCURATE, SYNCHRONIZED transcription of all spoken content.

CRITICAL TIMING RULES:
1. Timestamps MUST match EXACTLY when words are spoken - NO lag, NO delay
2. Add timestamp every 3-5 seconds of speech or at natural sentence breaks
3. Each line should be 5-12 words (short subtitle-style phrases)
4. Format: [MM:SS] or [HH:MM:SS] at the start of each line
5. Timestamps should mark the PRECISE moment the speaker begins that phrase
6. Listen carefully to audio timing - synchronize perfectly with voice

FORMAT REQUIREMENTS:
- Plain text only (NO markdown, NO bold, NO headers, NO bullet points)
- One timestamp per line at the beginning
- Short phrases that match natural speech rhythm
- Accurate to the exact second when words are spoken

EXAMPLE OUTPUT:
[0:00] Hello everyone, welcome to
[0:03] today's video. I'm really excited
[0:06] to share this with you all.
[0:09] Let's start with the first topic.
[0:12] So basically what we need to do is

IF NO SPEECH:
[0:00] (No speech detected in this video)

IMPORTANT: Ensure timestamps are SYNCHRONIZED with actual voice timing. Do NOT add delays or anticipate speech.`;

        const result = await model.generateContent([
            {
                text: prompt
            },
            {
                inlineData: {
                    mimeType,
                    data: videoBase64
                }
            }
        ]);

        const transcription = await result.response.text();
        console.log("Transcription generated successfully");
        return transcription;
    } catch (error) {
        console.error("Transcription generation error:", error.message);
        return null;
    }
};
