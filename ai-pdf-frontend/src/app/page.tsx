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

  // --- SYSTEM WARM-UP STATE (Cold Start Protection) ---
  const [systemReady, setSystemReady] = useState<boolean>(false);
  const [warmupProgress, setWarmupProgress] = useState<number>(0);

  const answerRef = useRef<HTMLDivElement>(null);

  // 1. System Preparation Process (30 Seconds Loader)
  useEffect(() => {
    const duration = 30000; // 30 seconds
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

  // 2. Load History from LocalStorage
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

  // 3. Save when History is Updated
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("pdf_analysis_history", JSON.stringify(history));
    }
  }, [history]);

  // 4. Scroll when Answer Arrives
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
            "Security Protocol: This document already exists in the database. Utilizing existing vector embeddings for instant analysis.",
          );
        }
      } else {
        throw new Error("Invalid response received from the server.");
      }
    } catch (err: unknown) {
      handleApiError(err, "Upload Error");
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
      handleApiError(err, "Query Error");
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
      setError(`${prefix}: An unexpected error occurred.`);
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
          Warming up Nexus Engine...
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
        <p
          style={{
            marginTop: "15px",
            color: "#666",
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          Initializing Celery Workers, establishing Vector DB connections,
          <br />
          and optimizing Llama 3.3 70B inference engine. (
          {Math.round(warmupProgress)}%)
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "#050505", color: "#eee", minHeight: "100vh" }}
    >
      <main
        style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}
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
            Nexus AI PDF Analyzer{" "}
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
            Professional-grade Distributed Document Intelligence System.
          </p>
        </header>

        {/* --- SYSTEM CAPABILITIES SUMMARY (NEW) --- */}
        <section
          style={{
            background: "linear-gradient(145deg, #0a0a0a 0%, #111 100%)",
            border: "1px solid #222",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "40px",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#3b82f6", fontSize: "1.2rem" }}>
            🚀 System Architecture & Capabilities
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                background: "#050505",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #222",
              }}
            >
              <strong
                style={{ display: "block", color: "#fff", marginBottom: "5px" }}
              >
                Distributed Processing
              </strong>
              <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>
                High-volume file processing handled by{" "}
                <strong>Celery Workers</strong> & <strong>Redis</strong> message
                broker.
              </p>
            </div>
            <div
              style={{
                background: "#050505",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #222",
              }}
            >
              <strong
                style={{ display: "block", color: "#fff", marginBottom: "5px" }}
              >
                Vector Intelligence
              </strong>
              <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>
                Utilizing <strong>PostgreSQL (pgvector)</strong> for semantic
                search and high-dimensional embeddings.
              </p>
            </div>
            <div
              style={{
                background: "#050505",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #222",
              }}
            >
              <strong
                style={{ display: "block", color: "#fff", marginBottom: "5px" }}
              >
                Smart Persistence
              </strong>
              <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>
                <strong>SHA-256</strong> hashing prevents duplicate processing.
                Media handled via <strong>Cloudinary</strong> &{" "}
                <strong>MongoDB</strong>.
              </p>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: history.length > 0 ? "300px 1fr" : "1fr",
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
                Document Library
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
                      padding: "12px",
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
                    📄 {doc.name}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* MAIN ACTIONS */}
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
                  ? `Active Document: ${currentFileName} ✓`
                  : "Step 1: Ingest New PDF Document"}
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
                  {loading ? "Asynchronous Upload..." : "Upload & Vectorize"}
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
                Step 2: Natural Language Query
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
                  placeholder="Ask a question about document content (e.g., 'Summarize the financial risks')"
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
                  {loading ? "Performing RAG Analysis..." : "Analyze Document"}
                </button>
              </div>
            </section>

            {/* ERROR DISPLAY */}
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
                ⚠️ {error}
              </div>
            )}

            {/* AI ANSWER DISPLAY */}
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
                  Nexus AI Insights:
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
                <div
                  style={{
                    marginTop: "20px",
                    fontSize: "0.75rem",
                    color: "#555",
                    borderTop: "1px solid #222",
                    paddingTop: "10px",
                  }}
                >
                  Source: {currentFileName} • Model: Llama-3.3-70B-SpecDec
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- DETAILED TECHNICAL GUIDE (SUMMARY) --- */}
        <section
          style={{
            marginTop: "60px",
            background: "#080808",
            padding: "40px",
            borderRadius: "20px",
            border: "1px solid #1a1a1a",
          }}
        >
          <h2
            style={{ color: "#fff", marginBottom: "30px", textAlign: "center" }}
          >
            Technical Deployment & Integration Guide
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "50px",
            }}
          >
            <div>
              <h4 style={{ color: "#60a5fa" }}>1. Data Ingestion Flow</h4>
              <p
                style={{ fontSize: "0.9rem", color: "#888", lineHeight: "1.6" }}
              >
                When a PDF is uploaded, the system generates a{" "}
                <strong>SHA-256 Hash</strong>. If the document is a duplicate,
                the system performs a lookup in <strong>MongoDB</strong> instead
                of re-processing, saving valuable compute resources. Unique
                files are stored in <strong>Cloudinary</strong> for persistence.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#60a5fa" }}>2. Distributed Task Queue</h4>
              <p
                style={{ fontSize: "0.9rem", color: "#888", lineHeight: "1.6" }}
              >
                Heavy AI workloads (PDF text extraction, chunking, embedding)
                are decoupled from the API via
                <strong> Celery & Redis</strong>. This ensures the frontend
                remains responsive while background workers handle the intensive
                processing.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#60a5fa" }}>3. RAG Architecture</h4>
              <p
                style={{ fontSize: "0.9rem", color: "#888", lineHeight: "1.6" }}
              >
                Retrieval-Augmented Generation (RAG) is implemented using{" "}
                <strong>PostgreSQL with pgvector</strong>. Queries are converted
                into embeddings and compared against document chunks to retrieve
                the most relevant context for the LLM.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#60a5fa" }}>4. Containerization</h4>
              <p
                style={{ fontSize: "0.9rem", color: "#888", lineHeight: "1.6" }}
              >
                The entire ecosystem is orchestrated via{" "}
                <strong>Docker Compose</strong>, separating the Next.js
                frontend, FastAPI backend, and Celery workers into isolated,
                scalable containers.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            marginTop: "60px",
            borderTop: "1px solid #222",
            paddingTop: "40px",
            paddingBottom: "60px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "20px",
              color: "#555",
              fontSize: "0.9rem",
            }}
          >
            <span>FastAPI</span> • <span>Next.js</span> • <span>Celery</span> •{" "}
            <span>Redis</span> • <span>pgvector</span> • <span>MongoDB</span>
          </div>
          <p style={{ color: "#333", fontSize: "0.75rem" }}>
            Nexus AI Infrastructure Project • Developed for Backend Expertise
            Portfolio • Özenç Dönmezer • 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
