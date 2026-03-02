// src/lib/api.ts
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Genel bir timeout yerine servis bazlı yönetmek daha profesyoneldir
});

// PDF Yükleme Servisi
export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // 10MB dosya için 60 saniye (1 dk) bazen yetmez. 
  // Burayı 300000 (5 dakika) yaparak internet hızından kaynaklı kopmaları engelliyoruz.
  const response = await api.post("/pdf-upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000, // 5 dakika (300.000 ms)
  });
  return response.data;
};

// Soru Sorma (Search/Query) Servisi
export const askQuestion = async (
  query: string,
  fileHash: string,
  topK: number = 4,
) => {
  const response = await api.post("/search/query/", {
    query: query,
    file_hash: fileHash,
    top_k: topK,
  }, {
    timeout: 30000, // Soru sorma işlemi için 30 saniye yeterlidir
  });
  return response.data;
};

export default api;