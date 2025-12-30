// client/src/SharePage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./App.css";

import { API_BASE } from "./apiConfig";

export default function SharePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/share/${id}`);
        const data = await res.json();

        console.log("share detail response:", data);

        if (!data.success) throw new Error();
        setPlaylist(data.playlist || []);
        setOwnerName(data.ownerName || "");
      } catch (e) {
        console.error(e);
        setPlaylist([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const handleCopyLink = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다! 🎧");
    } catch (e) {
      console.warn("clipboard 실패, prompt 폴백 사용", e);
      window.prompt("아래 링크를 복사해 주세요.", url);
    }
  };

  const goHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="app">
        <main className="content">
          <div className="scroll-area">
            <p className="empty-text">플레이리스트를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!playlist || playlist.length === 0) {
    return (
      <div className="app">
        <header className="header">
          <h1 className="title">Shared Playlist 🎧</h1>
        </header>

        <main className="content">
          <div className="scroll-area">
            <p className="empty-text">플레이리스트를 찾을 수 없어요 😢</p>
            <button className="btn home" onClick={goHome}>
              홈으로 이동
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayName = ownerName || "Someone";

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">{displayName}'s Playlist</h1>

        <div className="share-box">
          <p className="playlist-count">
            총 <strong>{playlist.length}</strong>곡이 담겨있어요
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn share-btn" type="button" onClick={handleCopyLink}>
              <span className="material-icons">link</span>
              &nbsp;링크 복사
            </button>
            <button className="btn home" type="button" onClick={goHome}>
              다시하기
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="scroll-area">
          <ul className="track-list">
            {playlist.map((track) => (
              <li key={track.id} className="track-item">
                <div className="track-info">
                  {track.album?.images?.[2] && (
                    <img
                      className="track-img"
                      src={track.album.images[2].url}
                      alt={track.name}
                      onClick={() => window.open(track.external_urls.spotify, "_blank")}
                    />
                  )}

                  <div className="track">
                    <div className="track__title">{track.name}</div>
                    <div className="track__dec">
                      {track.artists.map((a) => a.name).join(", ")} · {track.album.name}
                    </div>

                    {track.preview_url && <audio className="track__audio" controls src={track.preview_url} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
