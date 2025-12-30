// client/src/SharePage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./App.css";

export default function SharePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:4000/api/share/${id}`);
        const data = await res.json();

        if (!data.success) throw new Error();
        setPlaylist(data.playlist);
        setOwnerName(data.ownerName || "Someone");
      } catch (e) {
        setPlaylist([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="app">
        <main className="content">
          <div className="scroll-area">
            <p className="empty-text">불러오는 중...</p>
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
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">{ownerName}'s Playlist</h1>

        <div className="share-box">
          <p className="playlist-count">
            총 <strong>{playlist.length}</strong>곡이 담겨있어요
          </p>
          <button className="btn home" onClick={() => navigate("/")}>
            만들기
          </button>
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
