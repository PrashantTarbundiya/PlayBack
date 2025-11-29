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
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        });

        const videoFile = video.duration > 600 ? null : await getVideoFileForAnalysis(videoUrl);

        const prompt = `Analyze "${video.title}" (${video.category}, ${Math.floor(video.duration / 60)} min). Return ONLY valid JSON:
{
  "comprehensiveSummary": "2-3 paragraph summary",
  "researchInsights": {
    "factualData": ["fact1", "fact2", "fact3"],
    "expertOpinions": ["opinion1", "opinion2"],
    "caseStudies": ["example1", "example2"],
    "technicalConcepts": ["concept1", "concept2"]
  },
  "detailedKeyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "visualAnalysis": {
    "visualElements": ["element1", "element2"],
    "presentationStyle": "style",
    "qualityAssessment": "quality"
  },
  "contextualRelevance": {
    "industryContext": "context",
    "currentRelevance": "relevance",
    "targetAudience": "audience"
  },
  "educationalOutcomes": {
    "learningObjectives": ["obj1", "obj2"],
    "skillDevelopment": ["skill1", "skill2"],
    "practicalApplications": ["app1", "app2"],
    "prerequisites": ["prereq1"]
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
            aiResponse = {
                comprehensiveSummary: `This ${video.category} video "${video.title}" (${Math.floor(video.duration / 60)} minutes) provides comprehensive coverage. ${video.description || 'Educational content designed to inform viewers.'}`,
                researchInsights: {
                    factualData: ["Content includes researched information relevant to the topic"],
                    expertOpinions: ["Video may feature expert perspectives"],
                    caseStudies: ["Practical examples likely included"],
                    technicalConcepts: ["Relevant concepts are covered"]
                },
                detailedKeyPoints: [
                    `Coverage of ${video.title} concepts`,
                    `${Math.floor(video.duration / 60)} minutes of content`,
                    `${video.category} focused material`,
                    "Visual and auditory learning elements"
                ],
                visualAnalysis: {
                    visualElements: ["Video includes visual aids"],
                    presentationStyle: "Professional presentation",
                    qualityAssessment: "Structured for learning"
                },
                contextualRelevance: {
                    industryContext: `Relevant to ${video.category}`,
                    currentRelevance: "Addresses contemporary needs",
                    targetAudience: `${video.category} enthusiasts`
                },
                educationalOutcomes: {
                    learningObjectives: [`Understanding ${video.title}`],
                    skillDevelopment: [`${video.category} skills`],
                    practicalApplications: ["Real-world application"],
                    prerequisites: ["Basic understanding recommended"]
                }
            };
        }

        return res.status(200).json(
            new apiResponse(200, aiResponse, "Video analysis completed")
        );

    } catch (error) {
        throw new apiErrors(500, "Failed to analyze video content");
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
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
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