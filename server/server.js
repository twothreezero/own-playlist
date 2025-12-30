// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Node 18 이상이면 global fetch 써도 됨
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 JSON body 파싱

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

// 🔍 모든 요청 로그 찍기 (디버깅용)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// --------- 파일 경로 설정 (playlist.json 저장용) ---------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "playlist.json");

// --------- Spotify 환경변수 ---------
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

// --------- JSON "DB" 유틸 ---------
function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    console.error("Failed to load DB:", e);
    return {};
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save DB:", e);
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// --------- Spotify access token 발급 ---------
async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const tokenUrl = "https://accounts.spotify.com/api/token";
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    console.error("Failed to get token:", await response.text());
    throw new Error("Failed to get Spotify token");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

// --------- 🔍 Spotify 검색 API (/api/search) ---------
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ error: "q(query) is required" });
    }

    const token = await getAccessToken();

    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(q)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await spotifyRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

// --------- 📤 플레이리스트 공유 저장 (/api/share) ---------
app.post("/api/share", (req, res) => {
  const { ownerName, playlist } = req.body;

  if (!Array.isArray(playlist) || playlist.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "플레이리스트가 비어 있습니다." });
  }

  const safeName =
    typeof ownerName === "string" && ownerName.trim().length > 0
      ? ownerName.trim()
      : "Someone";

  const db = loadDB();
  const id = generateId();

  db[id] = {
    createdAt: Date.now(),
    ownerName: safeName,
    playlist,
  };

  saveDB(db);

  const shareUrl = `http://localhost:3000/share/${id}`;

  res.json({
    success: true,
    shareId: id,
    shareUrl,
  });
});

// --------- 📥 공유된 플레이리스트 조회 (/api/share/:id) ---------
app.get("/api/share/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  if (!db[id]) {
    return res.status(404).json({
      success: false,
      message: "플레이리스트를 찾을 수 없습니다.",
    });
  }

  res.json({
    success: true,
    ownerName: db[id].ownerName || "Someone",
    playlist: db[id].playlist,
  });
});


// --------- 서버 실행 ---------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});