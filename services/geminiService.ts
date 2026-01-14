
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMnemonicTip = async (front: string, top: string, left: string, right: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am trying to memorize the Rubik's cube color scheme. 
      Right now I am looking at the ${front} face, and ${top} is on top. 
      The results are: Left is ${left}, Right is ${right}.
      Can you give me a short, clever mnemonic (1-2 sentences) to remember this specific relative orientation? 
      Answer in Chinese.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "无法获取建议，请专注于记忆标准配色方案：白对黄，蓝对绿，红对橙。";
  }
};
