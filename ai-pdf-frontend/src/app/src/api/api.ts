// src/lib/api.ts
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// PDF Yükleme Servisi
export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // SONUNA / EKLEDİK: "/pdf-upload/"
  const response = await api.post("/pdf-upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000, 
  });
  return response.data;
};

// Soru Sorma (Search/Query) Servisi
export const askQuestion = async (
  query: string,
  fileHash: string,
  topK: number = 4,
) => {
  // SONUNA / EKLEDİK: "/search/query/"
  const response = await api.post("/search/query/", {
    query: query,
    file_hash: fileHash,
    top_k: topK,
  });
  return response.data;
};

export default api;
