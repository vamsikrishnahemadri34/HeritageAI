import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage } from "./chat";

const CHAT_STORAGE_KEY = "heritageai_chat_history";

export async function saveChatHistory(
  messages: ChatMessage[]
): Promise<void> {
  await AsyncStorage.setItem(
    CHAT_STORAGE_KEY,
    JSON.stringify(messages)
  );
}

export async function loadChatHistory(): Promise<ChatMessage[]> {
  const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is ChatMessage =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        (item.sender === "user" || item.sender === "assistant")
    );
  } catch {
    return [];
  }
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
}
