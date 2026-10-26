import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

// 5 High-Definition (1080p Full HD) sports & fitness videos matching the Sports Center facilities:
const VIDEO_THEMES = [
  {
    id: 'gym',
    name: 'Gym & Thể Hình',
    src1080: '/videos/gym-workout-1080.mp4',
    src720: '/videos/gym-workout-720.mp4',
    poster: '/images/gym-poster.jpg',
    overlay: 'bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-slate-950/15',
  },
  {
    id: 'studio',
    name: 'Pilates & Yoga Studio',
    src1080: '/videos/studio-workout-1080.mp4',
    src720: '/videos/studio-workout-720.mp4',
    poster: '/images/studio-poster.jpg',
    overlay: 'bg-gradient-to-r from-slate-950/70 via-slate-950/25 to-white/10',
  },
  {
    id: 'boxing',
    name: 'Boxing & Sàn Đấu Ring',
    src1080: '/videos/boxing-training-1080.mp4',
    src720: '/videos/boxing-training-720.mp4',
    poster: '/images/boxing-poster.jpg',
    overlay: 'bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-black/25',
  },
  {
    id: 'swimming',
    name: 'Bể Bơi Bốn Mùa',
    src1080: '/videos/swimming-pool-1080.mp4',
    src720: '/videos/swimming-pool-720.mp4',
    poster: '/images/swimming-poster.jpg',
    overlay: 'bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-slate-950/15',
  },
  {
    id: 'crossfit',
    name: 'CrossFit Kettlebell',
    src1080: '/videos/crossfit-workout-1080.mp4',
    src720: '/videos/athletes-track-720.mp4',
    poster: '/images/crossfit-poster.jpg',
    overlay: 'bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-black/25',
  },
];

// Smart Non-Repeating Randomizer:
// Shuffles all 5 themes into a playback queue. Every reload or entry from Landing Page pulls the next video,
// ensuring the user NEVER gets the same video twice in a row!
function getNextRandomTheme() {
  try {
    let queue = JSON.parse(sessionStorage.getItem('nexus_video_queue') || '[]');
    queue = queue.filter((id) => VIDEO_THEMES.some((t) => t.id === id));

    if (queue.length === 0) {
      const allIds = VIDEO_THEMES.map((t) => t.id);
      // Fisher-Yates shuffle
      for (let i = allIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
      }
      // Ensure the first item of the new cycle is not the same as the last played
      const lastPlayed = sessionStorage.getItem('nexus_last_played_video');
      if (allIds[0] === lastPlayed && allIds.length > 1) {
        [allIds[0], allIds[1]] = [allIds[1], allIds[0]];
      }
      queue = allIds;
    }

    const nextId = queue.shift();
    sessionStorage.setItem('nexus_video_queue', JSON.stringify(queue));
    sessionStorage.setItem('nexus_last_played_video', nextId);

    return VIDEO_THEMES.find((t) => t.id === nextId) || VIDEO_THEMES[0];
  } catch {
    return VIDEO_THEMES[Math.floor(Math.random() * VIDEO_THEMES.length)];
  }
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const videoRef = useRef(null);

  // Each time user enters auth pages from landing page or reloads, pick a brand new random theme
  const [currentTheme] = useState(() => getNextRandomTheme());

  const isLogin = pathname === '/login';

  // Explicit video load and play control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isLogin) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isLogin, currentTheme]);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-slate-900 select-none">
      {/* PERSISTENT FULL-HD VIDEO BACKGROUND */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          key={currentTheme.id}
          src={currentTheme.src720}
          poster={currentTheme.poster}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center filter contrast-[1.04] saturate-[1.08] brightness-[0.95]"
        >
          <source src={currentTheme.src720} type="video/mp4" />
          <source src={currentTheme.src1080} type="video/mp4" />
        </video>

        {/* Dynamic gradient overlay to ensure crystal clear contrast for typography */}
        <div className={`absolute inset-0 ${currentTheme.overlay}`} />
        <div className="absolute inset-0 bg-sky-400/[0.03] mix-blend-overlay" />
      </div>

      {/* AUTH PAGES OUTLET */}
      <div className="absolute top-5 right-5 z-50 flex items-center gap-2">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
