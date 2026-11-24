import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "heritageai_access_token";

export interface OCRResult {
  success: boolean;
  filename: string;
  language: string;
  extracted_text: string;
  word_count: number;
  message: string;
}

export async function scanInscription(imageUri: string): Promise<OCRResult> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("Please log in before scanning.");
  }

  const result = await FileSystem.uploadAsync(
    `${API_BASE_URL}/scanner/ocr`,
    imageUri,
    {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file",
      mimeType: "image/jpeg",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let data: any;

  try {
    data = JSON.parse(result.body);
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(data.detail || "Inscription scanning failed.");
  }

  return data as OCRResult;
}


export async function translateInscription(
  text: string,
  sourceLanguage: string
): Promise<string> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("Please log in before translating.");
  }

  const response = await fetch(`${API_BASE_URL}/scanner/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text,
      source_language: sourceLanguage,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Translation failed.");
  }

  return data.translated_text as string;
}
