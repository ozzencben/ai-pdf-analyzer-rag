"use client";

import { useState, useEffect, useRef } from "react";
import { uploadPDF, askQuestion } from "./src/api/api";
import { isAxiosError } from "axios";

interface DocumentHistory {
  hash: string;
  name: string;
}

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [history, setHistory] = useState<DocumentHistory[]>([]);
  const [query, setQuery] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // --- SYSTEM WARM-UP STATE (Soğuk Başlangıç Koruması) ---
  const [systemReady, setSystemReady] = useState<boolean>(false);
  const [warmupProgress, setWarmupProgress] = useState<number>(0);

  const answerRef = useRef<HTMLDivElement>(null);

  // 1. Sistem Hazırlık Süreci (30 Saniye Loader)
  useEffect(() => {
    const duration = 30000; // 30 saniye
    const intervalTime = 100;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setWarmupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setSystemReady(true);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // 2. LocalStorage'dan Geçmişi Yükle
  useEffect(() => {
    const savedHistory = localStorage.getItem("pdf_analysis_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) {
          setFileHash(parsed[0].hash);
          setCurrentFileName(parsed[0].name);
        }
      } catch (e) {
        console.error("History could not be parsed", e);
      }
    }
  }, []);

  // 3. Geçmiş Güncellendiğinde Kaydet
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("pdf_analysis_history", JSON.stringify(history));
    }
  }, [history]);

  // 4. Cevap geldiğinde scroll yap
  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [answer]);

  // --- HANDLERS ---

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await uploadPDF(file);
      const receivedHash = response?.data?.file_hash;
      const isDuplicate = response?.data?.is_duplicate;

      if (response.success && receivedHash) {
        setFileHash(receivedHash);
        setCurrentFileName(file.name);

        setHistory((prev) => {
          const exists = prev.find((doc) => doc.hash === receivedHash);
          if (exists) return prev;
          return [{ hash: receivedHash, name: file.name }, ...prev];
        });

        if (isDuplicate) {
          alert(
            "Bu dosya kütüphanenizde mevcut. Hemen soru sormaya başlayabilirsiniz!",
          );
        }
      } else {
        throw new Error("Sunucudan geçersiz yanıt alındı.");
      }
    } catch (err: unknown) {
      handleApiError(err, "Yükleme Hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!query || !fileHash) return;
    setLoading(true);
    setError("");
    try {
      const data = await askQuestion(query, fileHash);
      setAnswer(data.answer);
    } catch (err: unknown) {
      handleApiError(err, "Sorgu Hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: unknown, prefix: string) => {
    if (isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      setError(
        `${prefix}: ${typeof detail === "string" ? detail : err.message}`,
      );
    } else {
      setError(`${prefix}: Beklenmedik bir hata oluştu.`);
    }
  };

  const switchDocument = (doc: DocumentHistory) => {
    setFileHash(doc.hash);
    setCurrentFileName(doc.name);
    setAnswer("");
    setQuery("");
    setError("");
  };

  // --- RENDER: SYSTEM INITIALIZING ---
  if (!systemReady) {
    return (
      <div
        style={{
          backgroundColor: "#050505",
          color: "#eee",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", letterSpacing: "1px" }}>
          Nexus Engine Isıtılıyor...
        </h2>
        <div
          style={{
            width: "300px",
            height: "4px",
            backgroundColor: "#222",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${warmupProgress}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <p style={{ marginTop: "15px", color: "#666", fontSize: "0.9rem" }}>
          AI modelleri ve veritabanı bağlantıları optimize ediliyor. (%
          {Math.round(warmupProgress)})
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "#050505", color: "#eee", minHeight: "100vh" }}
    >
      <main
        style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}
      >
        <header style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: "bold",
              marginBottom: "10px",
              letterSpacing: "-1px",
            }}
          >
            AI PDF Analyzer{" "}
            <span
              style={{
                fontSize: "0.8rem",
                verticalAlign: "middle",
                backgroundColor: "#1e3a8a",
                padding: "4px 8px",
                borderRadius: "4px",
                color: "#60a5fa",
              }}
            >
              v1.0-PRO
            </span>
          </h1>
          <p style={{ color: "#aaa", fontSize: "1.1rem" }}>
            Yüksek performanslı doküman zekası motoru.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: history.length > 0 ? "250px 1fr" : "1fr",
            gap: "30px",
          }}
        >
          {/* SIDEBAR */}
          {history.length > 0 && (
            <aside
              style={{ borderRight: "1px solid #222", paddingRight: "20px" }}
            >
              <h4
                style={{
                  color: "#888",
                  marginBottom: "15px",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Son Dökümanlar
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {history.map((doc) => (
                  <button
                    key={doc.hash}
                    onClick={() => switchDocument(doc)}
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor:
                        fileHash === doc.hash ? "#1d4ed8" : "#0f0f0f",
                      color: fileHash === doc.hash ? "white" : "#888",
                      border: "1px solid #222",
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "0.3s",
                    }}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* MAIN */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}
          >
            {/* STEP 1: UPLOAD */}
            <section
              style={{
                background: "#0a0a0a",
                border: "1px solid #222",
                padding: "25px",
                borderRadius: "16px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  fontSize: "1.1rem",
                  color: fileHash ? "#4ade80" : "#fff",
                }}
              >
                {fileHash
                  ? `Aktif: ${currentFileName} ✓`
                  : "1. Adım: PDF Yükle"}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                  marginTop: "15px",
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ flex: 1, color: "#888" }}
                />
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  style={{
                    cursor: loading || !file ? "not-allowed" : "pointer",
                    padding: "12px 24px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    transition: "0.2s",
                  }}
                >
                  {loading ? "İşleniyor..." : "Yükle"}
                </button>
              </div>
            </section>

            {/* STEP 2: QUERY */}
            <section
              style={{
                background: "#0a0a0a",
                border: "1px solid #222",
                padding: "25px",
                borderRadius: "16px",
                opacity: fileHash ? 1 : 0.4,
                pointerEvents: fileHash ? "auto" : "none",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>
                2. Adım: Soru Sor
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginTop: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Döküman hakkında herhangi bir şey sor..."
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid #333",
                    backgroundColor: "#111",
                    color: "white",
                    fontSize: "1rem",
                  }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !fileHash || !query}
                  style={{
                    padding: "16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor:
                      loading || !fileHash || !query
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loading ? "AI Düşünüyor..." : "Analiz Et"}
                </button>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div
                style={{
                  color: "#f87171",
                  padding: "15px",
                  border: "1px solid #450a0a",
                  borderRadius: "10px",
                  background: "#1a0606",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            {/* ANSWER */}
            {answer && (
              <div
                ref={answerRef}
                style={{
                  background: "#0f0f0f",
                  padding: "30px",
                  borderRadius: "16px",
                  border: "1px solid #222",
                  borderLeft: "4px solid #3b82f6",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    color: "#3b82f6",
                    fontSize: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  AI Analiz Sonucu:
                </h4>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#ddd",
                    lineHeight: "1.8",
                    fontSize: "1.05rem",
                  }}
                >
                  {answer}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer
          style={{
            marginTop: "80px",
            borderTop: "1px solid #222",
            paddingTop: "40px",
            paddingBottom: "60px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
            }}
          >
            <div>
              <h4 style={{ color: "#fff", marginBottom: "15px" }}>
                Mimari Hakkında
              </h4>
              <p
                style={{
                  color: "#777",
                  fontSize: "0.85rem",
                  lineHeight: "1.6",
                }}
              >
                Nexus Engine, dokümanları SHA-256 ile tokenize eder.{" "}
                <strong>Llama 3.3</strong> ve <strong>VectorDB</strong>{" "}
                kullanarak bağlamsal doğruluk sağlar.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#fff", marginBottom: "15px" }}>
                Sistem Durumu
              </h4>
              <ul
                style={{
                  color: "#777",
                  fontSize: "0.85rem",
                  lineHeight: "1.8",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                <li>✅ Backend: FastAPI & Celery</li>
                <li>✅ AI: Groq (Llama 3.3 70B)</li>
                <li>✅ Database: MongoDB & PostgreSQL (pgvector)</li>
              </ul>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "50px",
              color: "#333",
              fontSize: "0.75rem",
            }}
          >
            Backend Expertise Project • Özenç Dönmezer • 2026
          </div>
        </footer>
      </main>
    </div>
  );
}
