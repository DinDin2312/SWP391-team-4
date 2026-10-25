import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const videoRef = useRef(null);

  const isLogin = pathname === '/login';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isLogin) {
      // macOS Lock Screen Effect: Resume playing smoothly right from current frame
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      // Register Page: Freeze action at the exact moment
      video.pause();
    }
  }, [isLogin]);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-slate-900 select-none">
      {/* 1. PERSISTENT 1080P FULL-HD ATHLETIC VIDEO BACKGROUND */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/images/runner-poster.jpg"
          className="w-full h-full object-cover object-center filter contrast-[1.03] saturate-[1.08] brightness-[0.96]"
        >
          <source src="/videos/athletes-track-1080.mp4" type="video/mp4" />
          <source src="/videos/athletes-track-720.mp4" type="video/mp4" />
        </video>

        {/* Airy daylight gradient overlay - keeps text legible on the left while staying bright and vibrant */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/20 to-white/10" />
        <div className="absolute inset-0 bg-sky-400/[0.04] mix-blend-overlay" />
      </div>

      {/* 2. AUTH PAGES OUTLET */}
      <div className="relative z-10 w-full min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
