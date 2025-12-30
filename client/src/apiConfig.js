// client/src/apiConfig.js

// 개발 환경(development)에서는 로컬 서버 사용
// 배포 환경(production)에서는 Render 서버 주소 사용
export const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://own-playlist.onrender.com";
