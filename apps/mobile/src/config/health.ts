import { API_BASE_URL } from "./api";

export async function checkBackendConnection() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend connection failed");
  }

  return response.json();
}
