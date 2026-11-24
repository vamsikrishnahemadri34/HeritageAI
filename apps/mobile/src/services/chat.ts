import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "heritageai_access_token";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
  imageUri?: string;
}

interface ChatResponse {
  reply: string;
  model: string;
}

function extractText(value: any): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n");
  }

  if (value && typeof value === "object") {
    for (const key of ["reply", "text", "content", "parts"]) {
      if (value[key] !== undefined) {
        const result = extractText(value[key]);
        if (result) return result;
      }
    }
  }

  return "";
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  imageBase64?: string,
  imageMimeType?: string
): Promise<ChatResponse> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("Please log in to use HeritageAI Chat.");
  }

  const conversationHistory = history.map((item) => ({
    role: item.sender === "assistant" ? "assistant" : "user",
    content: item.text,
  }));

  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      history: conversationHistory,
      ...(imageBase64 ? {
        image_base64: imageBase64,
        image_mime_type: imageMimeType,
      } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Unable to get an AI response."
    );
  }

  const reply = extractText(data.reply);

  if (!reply) {
    throw new Error("HeritageAI returned an empty response.");
  }

  return {
    reply,
    model: typeof data.model === "string" ? data.model : "Gemini",
  };
}
