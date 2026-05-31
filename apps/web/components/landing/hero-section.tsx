'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE_DURATION = 0.5;

    function loop() {
      if (!video) return;
      const { currentTime, duration } = video;

      if (duration) {
        if (currentTime < FADE_DURATION) {
          video.style.opacity = String(currentTime / FADE_DURATION);
        }
        else if (currentTime > duration - FADE_DURATION) {
          video.style.opacity = String((duration - currentTime) / FADE_DURATION);
        }
        else {
          video.style.opacity = '1';
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    function handleEnded() {
      if (!video) return;
      video.style.opacity = '0';
      setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    }

    video.play().catch(() => {});
    video.addEventListener('ended', handleEnded);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      video.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-white">
      <div className="absolute inset-x-0 bottom-0 z-0" style={{ top: '300px' }}>
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ opacity: 0, transition: 'opacity 0.1s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6"
        style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
      >
        <div className="animate-fade-rise mb-8 rounded-full border border-gray-200 px-4 py-1.5"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6F6F6F' }}>
          ✦ Free forever · No signup required
        </div>

        <h1
          className="animate-fade-rise max-w-5xl font-normal"
          style={{
            fontFamily:    "'Instrument Serif', Georgia, serif",
            fontSize:      'clamp(42px, 7vw, 86px)',
            lineHeight:    0.95,
            letterSpacing: '-2.46px',
            color:         '#000000',
            margin:        0,
          }}>
          Beyond complexity,{' '}
          <br />
          we craft{' '}
          <em style={{ color: '#6F6F6F', fontStyle: 'italic' }}>the perfect</em>
          <br />
          <em style={{ color: '#6F6F6F', fontStyle: 'italic' }}>document.</em>
        </h1>

        <p
          className="animate-fade-rise-delay mt-8 max-w-2xl leading-relaxed"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize:   'clamp(15px, 2vw, 18px)',
            color:      '#6F6F6F',
          }}>
          Merge, split, compress and convert PDF files instantly.
          Built for creators, professionals, and teams who value their time.
          Files deleted automatically after one hour.
        </p>

        <div className="animate-fade-rise-delay-2 mt-12 flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/merge-pdf"
            className="rounded-full transition-transform hover:scale-[1.03]"
            style={{
              background:  '#000000',
              color:       '#FFFFFF',
              padding:     '18px 48px',
              fontFamily:  'Inter, sans-serif',
              fontSize:    '15px',
            }}>
            Start for Free
          </Link>
          <Link
            href="#tools"
            className="rounded-full"
            style={{
              border:     '0.5px solid #000000',
              color:      '#000000',
              padding:    '18px 28px',
              fontFamily: 'Inter, sans-serif',
              fontSize:   '15px',
            }}>
            See all 10 tools →
          </Link>
        </div>
      </div>
    </section>
  );
}
