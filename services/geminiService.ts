
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Dialect, TranslationResult, TranslationMode } from "../types";

export const translateText = async (
  text: string, 
  dialect: Dialect, 
  mode: TranslationMode
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = mode === TranslationMode.TO_DIALECT 
    ? `你是一位精通中国方言的语言学专家。请将用户输入的普通话或英文翻译成指定的方言：${dialect}。`
    : `你是一位精通中国方言的语言学专家。请将用户输入的方言（${dialect}）翻译成标准普通话。`;

  const prompt = mode === TranslationMode.TO_DIALECT
    ? `翻译文本: "${text}"。
       要求返回：
       1. 方言文字表达。
       2. 该方言的拼音或注音（如粤语使用粤拼，上海话使用吴语拼音）。
       3. 意思的详细解释。`
    : `翻译文本: "${text}"。
       要求返回：
       1. 翻译后的标准普通话。
       2. 原方言文本的读音标注（拼音）。
       3. 对方言词汇的文化解释或意义。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING, description: "翻译结果文本" },
          phonetic: { type: Type.STRING, description: "拼音/注音标注" },
          meaning: { type: Type.STRING, description: "含义/文化解释" },
          dialectName: { type: Type.STRING, description: "方言名称" }
        },
        required: ["translatedText", "phonetic", "meaning", "dialectName"]
      }
    }
  });

  const textOutput = response.text?.trim() || "{}";
  return JSON.parse(textOutput);
};

export const generateSpeech = async (text: string, dialect: Dialect): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 简化 Prompt，确保 TTS 模型更稳定地识别意图
  const prompt = `Read the following Chinese dialect text in a clear, authentic tone: ${text}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const base64Audio = part?.inlineData?.data;

    if (!base64Audio) {
      console.warn("Gemini TTS response structure:", JSON.stringify(response, null, 2));
      throw new Error("模型未返回有效的语音数据");
    }
    return base64Audio;
  } catch (error) {
    console.error("Speech generation error:", error);
    throw new Error(`语音生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};
