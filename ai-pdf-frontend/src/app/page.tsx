"use client";

import { useState, useEffect } from "react";
import { uploadPDF, askQuestion } from "./src/api/api";
import { isAxiosError } from "axios";

// Geçmiş dökümanlar için tip tanımı
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

  // --- HANDLERS ---

  // 1. File Upload Logic
  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await uploadPDF(file);
      const receivedHash = response?.data?.file_hash;

      if (response.success && receivedHash) {
        setFileHash(receivedHash);
        setCurrentFileName(file.name);

        // Geçmişe ekle (eğer listede yoksa)
        setHistory((prev) => {
          if (prev.find((doc) => doc.hash === receivedHash)) return prev;
          return [{ hash: receivedHash, name: file.name }, ...prev];
        });

        alert("File processed! Document added to your session history.");
      } else {
        const debugInfo = JSON.stringify(response?.data || response);
        throw new Error(`Validation failed. Received: ${debugInfo}`);
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const apiDetail = err.response?.data?.detail || err.message;
        setError("API Error: " + apiDetail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during upload.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Ask Question Logic
  const handleAsk = async () => {
    if (!query || !fileHash) return;

    setLoading(true);
    setError("");
    try {
      const data = await askQuestion(query, fileHash);
      setAnswer(data.answer);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError("Query Error: " + (err.response?.data?.detail || err.message));
      } else {
        setError("An unexpected error occurred during the query.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Switch between documents
  const switchDocument = (doc: DocumentHistory) => {
    setFileHash(doc.hash);
    setCurrentFileName(doc.name);
    setAnswer(""); // Eski dökümanın cevabını temizle
    setQuery("");
  };

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
            AI PDF Analyzer
          </h1>
          <p style={{ color: "#aaa", fontSize: "1.1rem" }}>
            High-performance document intelligence engine.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: history.length > 0 ? "250px 1fr" : "1fr",
            gap: "30px",
          }}
        >
          {/* SIDEBAR: HISTORY */}
          {history.length > 0 && (
            <aside
              style={{ borderRight: "1px solid #222", paddingRight: "20px" }}
            >
              <h4
                style={{
                  color: "#888",
                  marginBottom: "15px",
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                }}
              >
                Recent Documents
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {history.map((doc) => (
                  <button
                    key={doc.hash}
                    onClick={() => switchDocument(doc)}
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      backgroundColor:
                        fileHash === doc.hash ? "#3b82f6" : "#111",
                      color: fileHash === doc.hash ? "white" : "#ccc",
                      border: "1px solid #222",
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "0.2s",
                    }}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* MAIN CONTENT AREA */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
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
                  fontSize: "1.2rem",
                  color: fileHash ? "#4ade80" : "#fff",
                }}
              >
                {fileHash
                  ? `Active: ${currentFileName} ✓`
                  : "Step 1: Upload New PDF"}
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
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    opacity: loading || !file ? 0.5 : 1,
                  }}
                >
                  {loading ? "Processing..." : "Upload"}
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
                transition: "all 0.3s ease",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1.2rem" }}>
                Step 2: Ask a Question
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginTop: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Ask anything about the document..."
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    backgroundColor: "#161616",
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
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor:
                      loading || !fileHash || !query
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loading ? "AI is thinking..." : "Ask AI"}
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
                  borderRadius: "8px",
                  background: "#1a0606",
                }}
              >
                {error}
              </div>
            )}

            {/* AI ANSWER */}
            {answer && (
              <div
                style={{
                  background: "#111",
                  padding: "30px",
                  borderRadius: "16px",
                  border: "1px solid #222",
                  borderLeft: "4px solid #3b82f6",
                }}
              >
                <h4
                  style={{ marginTop: 0, color: "#3b82f6", fontSize: "1.1rem" }}
                >
                  AI Insights:
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

        {/* --- FOOTER: PROJECT SUMMARY / README --- */}
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
                How it Works
              </h4>
              <p
                style={{ color: "#888", fontSize: "0.9rem", lineHeight: "1.6" }}
              >
                This system utilizes a **RAG (Retrieval-Augmented Generation)**
                architecture. When you upload a PDF, the backend streams the
                file in chunks to prevent memory overflows. The document is then
                partitioned into segments, converted into vector embeddings, and
                stored. When you ask a question, the most relevant segments are
                retrieved and analyzed by **Llama 3.3** to provide precise
                answers.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#fff", marginBottom: "15px" }}>
                Tech Stack
              </h4>
              <ul
                style={{
                  color: "#888",
                  fontSize: "0.9rem",
                  lineHeight: "1.8",
                  paddingLeft: "18px",
                }}
              >
                <li>
                  <strong>Backend:</strong> FastAPI (Python) & Celery for async
                  task processing.
                </li>
                <li>
                  <strong>LLM:</strong> Llama 3.3 via Groq for low-latency
                  inference.
                </li>
                <li>
                  <strong>Database:</strong> MongoDB for metadata & Redis for
                  task queuing.
                </li>
                <li>
                  <strong>Storage:</strong> Cloudinary for secure document
                  hosting.
                </li>
                <li>
                  <strong>Frontend:</strong> Next.js 15 (App Router) &
                  TypeScript.
                </li>
              </ul>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "40px",
              color: "#444",
              fontSize: "0.8rem",
            }}
          >
            Built by Özenç Dönmezer • 2026 AI PDF Analyzer Project
          </div>
        </footer>
      </main>
    </div>
  );
}
