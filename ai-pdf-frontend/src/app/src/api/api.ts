import axios from "axios";

// URL sonuna v1'den sonra slash KOYMUYORUZ
const API_BASE_URL = "https://ozzenc-ai-pdf-analyzer.hf.space/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  // headers: { "Content-Type": "application/json" } 
  // Not: Bunu sildim çünkü FormData gönderirken axios bunu otomatik yönetmeli.
});

// PDF Yükleme Servisi
export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // DİKKAT: "/pdf-upload/" yerine "pdf-upload/" (başındaki slash'ı sildik)
  // Bu, baseURL ile birleşirken tertemiz bir yapı sağlar.
  const response = await api.post("pdf-upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000, 
  });
  return response.data;
};

// Soru Sorma Servisi
export const askQuestion = async (
  query: string,
  fileHash: string,
  topK: number = 4,
) => {
  // Burada da başındaki slash'ı sildik: "search/query/"
  const response = await api.post(
    "search/query/",
    {
      query: query,
      file_hash: fileHash,
      top_k: topK,
    },
    {
      timeout: 30000,
    }
  );
  return response.data;
};

export default api;