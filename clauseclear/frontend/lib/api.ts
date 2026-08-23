import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cc_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string | null; plan: string };
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post<AuthResponse>("/auth/register", { email, password, name });
  return data;
}

export interface ContractSummary {
  id: string;
  fileName: string;
  status: string;
  overallRisk: string | null;
  createdAt: string;
}

export async function listContracts() {
  const { data } = await api.get<{ contracts: ContractSummary[] }>("/contracts");
  return data.contracts;
}

export async function uploadContract(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/contracts/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.contract as { id: string; fileName: string; status: string };
}

export async function analyzeContract(id: string) {
  const { data } = await api.post(`/contracts/${id}/analyze`);
  return data;
}

export async function getContract(id: string) {
  const { data } = await api.get(`/contracts/${id}`);
  return data.contract;
}

export async function sendChatMessage(contractId: string, question: string, sessionId?: string) {
  const { data } = await api.post("/chat/message", { contractId, question, sessionId });
  return data as { sessionId: string; answer: string };
}

export default api;
