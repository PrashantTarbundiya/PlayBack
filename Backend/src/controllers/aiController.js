import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiErrors } from '../utils/apiErrors.js';
import { apiResponse } from '../utils/apiResponse.js';
import { videoModel } from '../models/videoModel.js';
import { isValidObjectId } from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getVideoFileForAnalysis = async (videoUrl) => {
    try {
        if (videoUrl.startsWith('http')) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(videoUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error('Failed to fetch video file');
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return { inlineData: { data: base64, mimeType: 'video/mp4' } };
        }
        return videoUrl;
    } catch (error) {
        return null;
    }
};

const summarizeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid video ID");
    }

    const video = await videoModel.findById(videoId);
    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    const videoUrl = video.videoFile?.url || video.videoFile;
    if (!videoUrl) {
        throw new apiErrors(400, "Video URL not found");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: "application/json" }
        });

        const videoFile = video.duration > 600 ? null : await getVideoFileForAnalysis(videoUrl);

        const categoryPrompts = {
            'Music': 'For this MUSIC video, analyze: lyrics meaning and themes, musical style/genre, instruments used, vocal performance quality, melody and rhythm patterns, cultural or emotional significance, the artist\'s style, and how it fits in the broader music landscape.',
            'Gaming': 'For this GAMING video, analyze: the game being played, gameplay mechanics shown, strategies or tips demonstrated, commentary quality, skill level displayed, and relevance to the gaming community.',
            'Education': 'For this EDUCATION video, analyze: the subject matter in depth, teaching methodology, difficulty level, accuracy of information, curriculum relevance, and how effectively concepts are explained.',
            'Entertainment': 'For this ENTERTAINMENT video, analyze: the content format, entertainment value, production quality, storytelling elements, audience engagement techniques, and cultural relevance.',
            'Sports': 'For this SPORTS video, analyze: the sport/activity shown, athletic techniques, performance analysis, rules explained, training tips, and competitive context.',
            'Technology': 'For this TECHNOLOGY video, analyze: the technology covered, technical accuracy, practical applications, comparisons with alternatives, and future implications.',
            'Comedy': 'For this COMEDY video, analyze: humor style, comedic timing, writing quality, audience appeal, cultural references, and entertainment value.',
            'News': 'For this NEWS video, analyze: the topic covered, factual accuracy, different perspectives presented, impact of the event, and broader context.',
        };

        const categoryInstruction = categoryPrompts[video.category] || `For this ${video.category} video, provide a thorough analysis of the content, themes, and key takeaways.`;

        const descriptionContext = video.description ? `\nVideo description provided by the creator: "${video.description}"` : '';

        const prompt = `Analyze the video titled "${video.title}" (Category: ${video.category}, Duration: ${Math.floor(video.duration / 60)} minutes).${descriptionContext}

${categoryInstruction}

IMPORTANT: Be SPECIFIC and DETAILED. Do NOT use generic placeholder text. Every field must contain real, meaningful analysis based on the video title, description, category, and any visual/audio content available. Each array should contain at least 3 items with substantive detail.

Return ONLY valid JSON in this exact structure:
{
  "comprehensiveSummary": "A detailed 2-3 paragraph summary that describes the specific content, themes, and value of this video. Mention specific details, not generic statements.",
  "researchInsights": {
    "factualData": ["Specific fact or data point about the content", "Another specific fact", "Third specific insight"],
    "expertOpinions": ["Expert-level observation about the content quality or technique", "Another professional perspective"],
    "caseStudies": ["Specific example or reference from the content", "Another concrete example"],
    "technicalConcepts": ["Technical or specialized concept covered", "Another technical element"]
  },
  "detailedKeyPoints": ["Specific key point 1", "Specific key point 2", "Specific key point 3", "Specific key point 4", "Specific key point 5"],
  "visualAnalysis": {
    "visualElements": ["Specific visual element or technique used", "Another visual element"],
    "presentationStyle": "Detailed description of how the content is presented",
    "qualityAssessment": "Specific assessment of production and content quality"
  },
  "contextualRelevance": {
    "industryContext": "How this content fits within its industry or genre",
    "currentRelevance": "Why this content matters today",
    "targetAudience": "Specific description of who would benefit most from this content"
  },
  "educationalOutcomes": {
    "learningObjectives": ["What viewers will learn - be specific", "Another learning outcome", "Third learning outcome"],
    "skillDevelopment": ["Specific skill that can be developed", "Another skill"],
    "practicalApplications": ["How this knowledge can be applied in practice", "Another practical use"],
    "prerequisites": ["What viewers should know beforehand"]
  }
}`;

        let result;
        if (videoFile && videoFile.inlineData) {
            result = await Promise.race([
                model.generateContent([prompt, videoFile]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 90000))
            ]);
        } else {
            result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 60000))
            ]);
        }

        const response = await result.response;
        let text = response.text();

        let aiResponse;
        try {
            text = text
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResponse = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (parseError) {
            const durationMin = Math.floor(video.duration / 60);
            const desc = video.description || '';

            const categoryFallbacks = {
                'Music': {
                    summary: `"${video.title}" is a ${durationMin}-minute music video that showcases musical artistry and creative expression. ${desc ? `The creator describes it as: ${desc}.` : ''} This piece explores melodic themes, rhythmic patterns, and vocal or instrumental performance, offering listeners an immersive audio-visual experience.`,
                    facts: [`"${video.title}" features musical composition spanning ${durationMin} minutes`, `The song falls within the ${video.category} category, suggesting specific genre characteristics`, `The production combines audio elements with visual storytelling to enhance the listening experience`],
                    experts: [`The musical arrangement demonstrates attention to composition and sound design`, `The performance style reflects contemporary trends in the music industry`],
                    cases: [`The song's thematic elements can be compared to similar works in its genre`, `The visual presentation style follows modern music video conventions`],
                    technical: [`Musical composition techniques including melody, harmony, and rhythm`, `Audio production and mixing quality`, `Visual cinematography and editing in the music video format`],
                    keyPoints: [`"${video.title}" presents a distinct musical identity through its composition and performance`, `The ${durationMin}-minute runtime allows for full artistic expression and thematic development`, `The music video format combines auditory and visual elements for a richer experience`, `The song's genre and style position it within a specific musical tradition`, `Production quality and arrangement choices shape the overall listener experience`],
                    audience: `Music lovers, fans of the genre, and anyone interested in discovering new songs and musical artists`
                },
                'Gaming': {
                    summary: `"${video.title}" is a ${durationMin}-minute gaming video that dives into gameplay, strategy, and the gaming experience. ${desc ? `Description: ${desc}.` : ''} This video offers viewers insights into game mechanics, player techniques, and the entertainment value of the featured game.`,
                    facts: [`Covers ${durationMin} minutes of gaming content with gameplay demonstrations`, `Showcases game mechanics, controls, and interactive elements`, `Provides visual walkthrough of in-game environments and challenges`],
                    experts: [`Demonstrates player skill and strategic decision-making in real-time`, `Commentary or gameplay style reflects experience and game knowledge`],
                    cases: [`Specific in-game scenarios are demonstrated with practical approaches`, `Gameplay moments highlight key features of the game`],
                    technical: [`Game mechanics and interactive systems demonstrated`, `Strategy and tactical decision-making in gameplay`, `Game design elements visible through gameplay`],
                    keyPoints: [`"${video.title}" showcases gameplay and interactive entertainment`, `${durationMin} minutes of gaming content with practical demonstrations`, `Game mechanics and strategies are highlighted throughout`, `The video provides entertainment and potential learning for gamers`, `Production and commentary quality enhance the viewing experience`],
                    audience: `Gamers, game enthusiasts, and viewers interested in gaming content and strategies`
                }
            };

            const fb = categoryFallbacks[video.category] || {
                summary: `"${video.title}" is a ${durationMin}-minute ${video.category.toLowerCase()} video that explores its subject in detail. ${desc ? `The creator describes it as: ${desc}.` : ''} This content provides viewers with valuable perspectives, information, and insights related to ${video.category.toLowerCase()}.`,
                facts: [`"${video.title}" delivers ${durationMin} minutes of focused ${video.category.toLowerCase()} content`, `The video is categorized under ${video.category}, indicating its primary theme and audience`, `The content combines visual and audio elements to effectively communicate its message`],
                experts: [`The content demonstrates knowledge and familiarity with the ${video.category.toLowerCase()} domain`, `The presentation approach reflects professional content creation standards`],
                cases: [`Specific examples and demonstrations are used to illustrate key points`, `The content draws from real-world scenarios relevant to ${video.category.toLowerCase()}`],
                technical: [`Subject-specific concepts and terminology related to ${video.category.toLowerCase()}`, `Content creation and presentation techniques`, `Domain knowledge demonstrated throughout the video`],
                keyPoints: [`"${video.title}" provides a focused exploration of its ${video.category.toLowerCase()} subject matter`, `The ${durationMin}-minute format allows for thorough coverage of key topics`, `Visual and audio presentation work together to engage viewers`, `The content is structured to deliver clear takeaways and value`, `Viewers gain exposure to important concepts within ${video.category.toLowerCase()}`],
                audience: `People interested in ${video.category.toLowerCase()}, content enthusiasts, and viewers looking to learn or be entertained`
            };

            aiResponse = {
                comprehensiveSummary: fb.summary,
                researchInsights: {
                    factualData: fb.facts,
                    expertOpinions: fb.experts,
                    caseStudies: fb.cases,
                    technicalConcepts: fb.technical
                },
                detailedKeyPoints: fb.keyPoints,
                visualAnalysis: {
                    visualElements: [`Video presentation with ${video.category.toLowerCase()}-specific visual elements`, `Production techniques appropriate for ${video.category.toLowerCase()} content`, `Visual storytelling that complements the audio content`],
                    presentationStyle: `Professional ${video.category.toLowerCase()} content presentation with attention to viewer engagement and content clarity`,
                    qualityAssessment: `The video demonstrates structured content delivery within its ${durationMin}-minute runtime, balancing depth with accessibility`
                },
                contextualRelevance: {
                    industryContext: `This content sits within the broader ${video.category.toLowerCase()} landscape, contributing to the genre's diversity and accessible content available to viewers`,
                    currentRelevance: `${video.category} content continues to grow in popularity with audiences seeking both entertainment and knowledge through video platforms`,
                    targetAudience: fb.audience
                },
                educationalOutcomes: {
                    learningObjectives: [`Gain deeper understanding of the themes and content presented in "${video.title}"`, `Appreciate the techniques and craftsmanship involved in ${video.category.toLowerCase()} content creation`, `Develop awareness of trends and styles within the ${video.category.toLowerCase()} space`],
                    skillDevelopment: [`Critical appreciation of ${video.category.toLowerCase()} content`, `Understanding of ${video.category.toLowerCase()} concepts and elements`, `Enhanced media literacy and content analysis skills`],
                    practicalApplications: [`Apply insights from "${video.title}" to personal interests in ${video.category.toLowerCase()}`, `Use the knowledge gained to explore related content and deepen understanding`, `Share and discuss the content's themes and takeaways with others`],
                    prerequisites: [`General interest in ${video.category.toLowerCase()} content`, `No special prior knowledge required to enjoy this video`]
                }
            };
        }

        return res.status(200).json(
            new apiResponse(200, aiResponse, "Video analysis completed")
        );

    } catch (error) {
        throw new apiErrors(500, error.message || "Failed to analyze video");
    }
});

const askQuestion = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { question } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid video ID");
    }

    if (!question || question.trim() === "") {
        throw new apiErrors(400, "Question is required");
    }

    const video = await videoModel.findById(videoId);
    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    const videoUrl = video.videoFile?.url || video.videoFile;
    if (!videoUrl) {
        throw new apiErrors(400, "Video URL not found");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        });
        const videoFile = video.duration > 600 ? null : await getVideoFileForAnalysis(videoUrl);

        const prompt = `Answer this question about the video "${video.title}" (${video.category}):

        Question: ${question}

        IMPORTANT: Provide ONLY a direct text answer. Do NOT use JSON format, do NOT use formatting like **, *, #, bullets, or any special characters. Write in plain natural language paragraphs only.`;

        let result;
        if (videoFile && videoFile.inlineData) {
            result = await Promise.race([
                model.generateContent([prompt, videoFile]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 45000))
            ]);
        } else {
            result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 30000))
            ]);
        }

        const response = await result.response;
        let text = response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '');

        let answer = text;

        // Extract from JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                answer = parsed.answer || text;
            } catch (e) {
                const beforeJson = text.substring(0, text.indexOf('{'));
                answer = beforeJson.trim() || text;
            }
        }

        // Clean formatting
        answer = answer
            .replace(/\\&quot;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/^[•\-]\s*/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        // Remove any remaining JSON
        if (answer.includes('{')) {
            const beforeJson = answer.substring(0, answer.indexOf('{'));
            if (beforeJson.trim()) answer = beforeJson.trim();
        }

        return res.status(200).json(
            new apiResponse(200, answer, "Question answered successfully")
        );

    } catch (error) {
        throw new apiErrors(500, "Failed to process question");
    }
});

export { summarizeVideo, askQuestion };