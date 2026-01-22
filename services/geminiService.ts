
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Dialect, TranslationResult, TranslationMode } from "../types";

export const translateText = async (
  text: string, 
  dialect: Dialect, 
  mode: TranslationMode
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = mode === TranslationMode.TO_DIALECT 
    ? `你是一位精通中国方言的顶级语言学专家。请将用户输入的普通话翻译成精准的方言：${dialect}。
       注意区分细微差别（例如：成都话较温婉，自贡话有独特的尾音和卷舌，重庆话较硬朗）。
       必须返回方言最地道的口语写法，而非简单的字面替换。`
    : `你是一位精通中国方言的顶级语言学专家。请将输入的方言（${dialect}）翻译成标准普通话。`;

  const prompt = mode === TranslationMode.TO_DIALECT
    ? `翻译文本: "${text}"。
       要求返回：
       1. 地道的${dialect}文字表达。
       2. 该方言最常用的拼音标注（如粤语用粤拼，川渝话用四川方言拼音，包含音调）。
       3. 针对${dialect}特点的文化解释。`
    : `翻译文本: "${text}"。
       要求返回：
       1. 翻译后的标准普通话。
       2. 原方言文本的音调标注。
       3. 对方言特定词汇的解析。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING, description: "翻译后的方言结果" },
          phonetic: { type: Type.STRING, description: "对应的方言拼音标注" },
          meaning: { type: Type.STRING, description: "详细的语境与文化解释" },
          dialectName: { type: Type.STRING, description: "当前方言名称" }
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
  
  // 改进提示词，引导模型模仿特定方言的语调和节奏
  const prompt = `Please read this Chinese text using the very authentic accent and unique prosody of the "${dialect}" region. 
  Emphasize the local tonal character and emotional flair of the region: "${text}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 使用通用的声线，但通过 Prompt 引导语调
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const base64Audio = part?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("语音流返回为空");
    }
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw new Error(`语音生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};
