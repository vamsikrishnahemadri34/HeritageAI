import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "heritageai_access_token";

export interface ScanHistoryItem {
  id: number;
  filename: string;
  language: string;
  extracted_text: string;
  translated_text: string | null;
  word_count: number;
  created_at: string;
}

async function historyRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("Please log in to access scan history.");
  }

  const response = await fetch(`${API_BASE_URL}/scanner/history/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Scan history request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function saveScanHistory(
  scan: Omit<ScanHistoryItem, "id" | "created_at">
): Promise<ScanHistoryItem> {
  return historyRequest<ScanHistoryItem>("", {
    method: "POST",
    body: JSON.stringify(scan),
  });
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  return historyRequest<ScanHistoryItem[]>("", {
    method: "GET",
  });
}

export async function deleteScanHistory(scanId: number): Promise<void> {
  await historyRequest<void>(String(scanId), {
    method: "DELETE",
  });
}

export async function updateScanTranslation(
  scanId: number,
  translatedText: string
): Promise<ScanHistoryItem> {
  return historyRequest<ScanHistoryItem>(String(scanId), {
    method: "PATCH",
    body: JSON.stringify({ translated_text: translatedText }),
  });
}
