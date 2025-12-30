// client/src/ShareCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

export default function ShareCreatePage() {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const MAX_PLAYLIST = 10;

  // 🔹 만든 사람 이름
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("playlist");
      const savedName = localStorage.getItem("ownerName");

      if (saved) {
        const parsed = JSON.parse(saved);
        setPlaylist(Array.isArray(parsed) ? parsed.slice(0, MAX_PLAYLIST) : []);
      } else {
        setPlaylist([]);
      }

      if (savedName) {
        setOwnerName(savedName);
      }
    } catch {
      setPlaylist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateShare = async () => {
    if (!playlist.length) {
      alert("공유할 플레이리스트가 없어요!");
      navigate("/");
      return;
    }

    if (!ownerName.trim()) {
      alert("플레이리스트 이름에 사용될 닉네임을 입력해 주세요 🙂");
      return;
    }

    // 이름은 localStorage 에도 저장해두면 다음에 기본값으로 써먹기 좋음
    localStorage.setItem("ownerName", ownerName.trim());

    setSharing(true);
    try {
      const res = await fetch(`${API_BASE}/api/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          playlist,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      await navigator.clipboard.writeText(data.shareUrl);
      alert("공유 링크가 복사되었습니다! 🎧\n\n" + data.shareUrl);

      navigate(`/share/${data.shareId}`);
    } catch (e) {
      console.error(e);
      alert("공유 중 오류가 발생했어요 😢");
    } finally {
      setSharing(false);
    }
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

  return (
    <div className="app">
      <header className="header">
        <button className="btn clear" onClick={() => navigate(-1)}>
          ← 돌아가기
        </button>

        <h1 className="title">Share Playlist 🎧</h1>

        {/* 🔹 만든 사람 이름 입력 */}
        <div className="share-box">
          <div className="share-text">
            <input className="share-text__input" placeholder="예: 봄날의 햇살 등" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            의 플레이리스트.
          </div>
          <button className="btn share-btn" type="button" disabled={sharing} onClick={handleCreateShare}>
            {sharing ? "공유 링크 생성 중..." : <span class="material-icons">link</span>}
          </button>
        </div>
      </header>

      <main className="content">
        <div className="scroll-area">
          {playlist.length === 0 ? (
            <p className="empty-text">플레이리스트가 비어 있어요. 먼저 곡을 담은 뒤 다시 시도해 주세요.</p>
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
}
