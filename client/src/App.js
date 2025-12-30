import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ShareCreatePage from "./ShareCreatePage.jsx";
import SharePage from "./SharePage";
import "./App.css";

// 🔥 검색 & 공유 공통 UI
function HeaderAction({ mode, query, setQuery, loading, onSearch, onShare }) {
  if (mode === "search") {
    return (
      <form onSubmit={onSearch} className="search-form">
        <input
          className="search-form__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="음악을 찾아보세요!"
          name="search"
        />
        <button className="btn search-form__btn" type="submit" disabled={loading}>
          {loading ? <span className="material-icons">hourglass_empty</span> : "검색"}
        </button>
      </form>
    );
  }

  return (
    <div className="share-box">
      <div className="share-text">내가 만든 플레이리스트를 친구에게 공유해보세요!</div>
      <button className="btn share-btn" type="button" onClick={onShare}>
        공유하기
      </button>
    </div>
  );
}

/* ===========================
    메인 앱 (기존 구조 유지)
=========================== */
function MainApp() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_PLAYLIST = 10;
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem("playlist");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_PLAYLIST) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState("search");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("playlist", JSON.stringify(playlist));
  }, [playlist]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:4000/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setTracks(data.tracks?.items ?? []);
    } catch {
      alert("검색 중 오류가 발생했어요 😢");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = (track) => {
    const exists = playlist.some((t) => t.id === track.id);
    if (exists) setPlaylist((prev) => prev.filter((t) => t.id !== track.id));
    else {
      if (playlist.length >= MAX_PLAYLIST) {
        alert("플레이리스트는 최대 10곡까지만 담을 수 있어요!");
        return;
      }
      setPlaylist((prev) => [...prev, track]);
    }
  };

  const handleClearPlaylist = () => {
    if (!playlist.length) return alert("삭제할 플레이리스트가 없어요!");
    if (!window.confirm("플레이리스트를 모두 삭제할까요?")) return;
    setPlaylist([]);
  };

  const goShareCreatePage = () => {
    if (playlist.length === 0) {
      alert("공유할 곡이 없어요!");
      return;
    }

    navigate("/share");
  };

  return (
    <div className="app">
      <header className="header">
        <nav className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === "search" ? "tab--active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <div className="tab-inner">
              <span className="tab-icon material-icons">search</span>
              <span className="tab-label">Search</span>
            </div>
          </button>

          <button
            type="button"
            className={`tab ${activeTab === "playlist" ? "tab--active" : ""}`}
            onClick={() => setActiveTab("playlist")}
          >
            <div className="tab-inner">
              <span className="tab-icon material-icons">queue_music</span>
              <span className="tab-label">Playlist</span>
            </div>
            {playlist.length > 0 && <span className="badge">{playlist.length}</span>}
          </button>
        </nav>

        <h1 className="title">Make Own Playlist</h1>

        <HeaderAction
          mode={activeTab}
          query={query}
          setQuery={setQuery}
          loading={loading}
          onSearch={handleSearch}
          onShare={goShareCreatePage}
        />
      </header>

      <main className="content">
        <div className="scroll-area" ref={scrollRef}>
          {activeTab === "search" ? (
            <>
              {!loading &&
                (tracks.length === 0 ? (
                  <p className="empty-text">검색 결과가 여기에 표시됩니다.</p>
                ) : (
                  <p className="playlist-count">
                    검색 결과는 {tracks.length}개까지 보여집니다.
                  </p>
                ))}

              <ul className="track-list">
                {tracks.map((track) => {
                  const isLiked = playlist.some((t) => t.id === track.id);
                  return (
                    <li key={track.id} className="track-item">
                      <div className="track-info">
                        {track.album.images[2] && (
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
                          {track.preview_url && (
                            <audio className="track__audio" controls src={track.preview_url} />
                          )}
                        </div>
                      </div>

                      <button
                        className={`btn like ${isLiked ? "active" : ""}`}
                        onClick={() => handleToggleLike(track)}
                      >
                        <span className="material-icons">
                          {isLiked ? "favorite" : "favorite_border"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <section className="playlist">
              <div className="playlist-nav">
                <button className="btn clear" onClick={handleClearPlaylist}>
                  전체 삭제
                </button>

                <p className="playlist-count">
                  {playlist.length >= MAX_PLAYLIST ? (
                    <>🎉 <strong>다 찼어요!</strong></>
                  ) : (
                    <>
                      Total : <strong>{playlist.length}</strong>
                      <span className="playlist-limit">
                        / {MAX_PLAYLIST - playlist.length}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {playlist.length === 0 ? (
                <p className="empty-text">
                  좋아요를 눌러서 플레이리스트를 만들어보세요.
                </p>
              ) : (
                <ul className="track-list">
                  {playlist.map((track) => (
                    <li key={track.id} className="track-item">
                      <div className="track-info">
                        {track.album.images[2] && (
                          <img
                            className="track-img"
                            src={track.album.images[2].url}
                            alt={track.name}
                          />
                        )}

                        <div className="track">
                          <div className="track__title">{track.name}</div>
                          <div className="track__dec">
                            {track.artists.map((a) => a.name).join(", ")} · {track.album.name}
                          </div>

                          {track.preview_url && (
                            <audio className="track__audio" controls src={track.preview_url} />
                          )}
                        </div>
                      </div>

                      <button className="btn remove" onClick={() => handleToggleLike(track)}>
                        <span className="material-icons">delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================= Routes ================= */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/share" element={<ShareCreatePage />} />
      <Route path="/share/:id" element={<SharePage />} />
    </Routes>
  );
}

