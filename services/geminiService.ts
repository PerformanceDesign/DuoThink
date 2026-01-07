
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, MessageSender, BlindSpot, GroundingSource, CoachPersonality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DuoResponse {
  retort: string;
  blindSpot: BlindSpot;
  logicScore: number;
  sources: GroundingSource[];
}

const PERSONALITY_PROMPTS: Record<CoachPersonality, string> = {
  Socratic: "Focus on asking penetrating questions that lead the user to discover their own logical contradictions. Never give direct answers.",
  Aggressive: "Be blunt, highly critical, and challenge every single assumption the user makes. Use sharp, intense language.",
  Academic: "Maintain a formal, high-level scholarly tone. Focus on formal logic, structural integrity, and peer-reviewed style evidence.",
  Stoic: "Remain calm, objective, and detached. Focus on rationality, ethics, and the distinction between facts and emotional judgments."
};

export const debateCoachService = {
  async getResponse(topic: string, history: Message[], personality: CoachPersonality = 'Socratic'): Promise<DuoResponse> {
    const chatHistory = history.map(msg => ({
      role: msg.sender === MessageSender.USER ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const personalityInstruction = PERSONALITY_PROMPTS[personality];

    // Step 1: Factual Retort with Google Search Grounding
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: `We are debating: ${topic}` }] },
        ...chatHistory.map(m => ({ role: m.role as any, parts: m.parts }))
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are 'DuoThink AI', a debate coach with a ${personality} personality. ${personalityInstruction} 
        Your goal is to sharpen the user's logic. Challenge them using real-world data and facts. Be sharp and concise.`
      }
    });

    const retort = searchResponse.text || "I'm analyzing your point.";
    const rawSources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = rawSources
      .filter((c: any) => c.web)
      .map((c: any) => ({
        title: c.web.title || "Source",
        uri: c.web.uri
      }));

    // Step 2: Structured Blind Spot analysis
    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Debate Topic: ${topic}. Personality Context: ${personality}.
      Analyze the user's last statement: "${history.filter(m => m.sender === MessageSender.USER).pop()?.text || ""}"
      Return a JSON evaluation of logic and blind spots.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logicScore: { type: Type.INTEGER },
            blindSpot: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN },
                type: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["detected", "type", "explanation"]
            }
          },
          required: ["logicScore", "blindSpot"]
        }
      }
    });

    try {
      const parsed = JSON.parse(analysisResponse.text || "{}");
      return {
        retort,
        sources,
        blindSpot: parsed.blindSpot || { detected: false, type: "", explanation: "" },
        logicScore: typeof parsed.logicScore === 'number' ? parsed.logicScore : 50
      };
    } catch (e) {
      return {
        retort,
        sources,
        blindSpot: { detected: false, type: "", explanation: "" },
        logicScore: 50
      };
    }
  },

  async generateSpeech(text: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  },

  async getHint(topic: string, history: Message[], personality: CoachPersonality = 'Socratic'): Promise<string> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Debate Topic: ${topic}. Coach Personality: ${personality}. Provide a single helpful hint or logical angle for the user.`,
      config: {
        systemInstruction: "You are a helpful debate assistant. Provide a single short, brilliant hint to help the user win or sharpen their stance.",
        temperature: 0.8
      }
    });
    return response.text || "Try focusing on the utilitarian outcome.";
  }
};
