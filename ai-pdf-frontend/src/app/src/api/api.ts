import axios from "axios";

// Vercel'deki değişken varsa onu kullan, yoksa localhost'u kullan
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: Eğer Hugging Face'e gidiyorsak Token ekle
api.interceptors.request.use((config) => {
  if (HF_TOKEN && config.baseURL?.includes("hf.space")) {
    config.headers.Authorization = `Bearer ${HF_TOKEN}`;
  }
  return config;
});

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("pdf-upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000,
  });
  return response.data;
};

export const askQuestion = async (
  query: string,
  fileHash: string,
  topK: number = 4,
) => {
  const response = await api.post(
    "search/query/",
    { query, file_hash: fileHash, top_k: topK },
    { timeout: 30000 },
  );
  return response.data;
};

export default api;
