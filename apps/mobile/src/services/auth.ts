import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "heritageai_access_token";

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data as T;
}

export async function register(
  full_name: string,
  email: string,
  password: string
): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<User> {
  const result = await request<{
    access_token: string;
    token_type: string;
    user: User;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await SecureStore.setItemAsync(TOKEN_KEY, result.access_token);
  return result.user;
}

export async function getMyProfile(): Promise<User> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("You are not logged in");
  }

  return request<User>("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
