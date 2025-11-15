import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION, RESUME_TAILOR_PROMPT, SKILLS_EXTRACTOR_PROMPT, COVER_LETTER_PROMPT, JOB_MATCHER_PROMPT } from '../constants';
import { type Message } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function initChat(history?: Message[]): Chat {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: history?.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    });
    return chat;
}

export async function generateTailoredResume(jobDescription: string, resume: string): Promise<string> {
    const prompt = RESUME_TAILOR_PROMPT(jobDescription, resume);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function extractSkillsFromJD(jobDescription: string): Promise<string> {
    const prompt = SKILLS_EXTRACTOR_PROMPT(jobDescription);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function generateCoverLetter(jobDescription: string, resume: string): Promise<string> {
    const prompt = COVER_LETTER_PROMPT(jobDescription, resume);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function findMatchingJobs(resume: string, jobTitle: string, preferences: string): Promise<string> {
    const prompt = JOB_MATCHER_PROMPT(resume, jobTitle, preferences);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}