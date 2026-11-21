import type { WeatherVisualCategory } from '../types/weather';
import { SKY_THEMES } from '../utils/weatherIntelligence';

interface WeatherBackdropProps {
  category: WeatherVisualCategory;
}

const RAIN_DROPS = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.3 + (i % 3) * 1.9) % 100}%`,
  dur: `${1.3 + (i % 5) * 0.22}s`,
  delay: `${(i % 7) * 0.25}s`,
  height: `${38 + (i % 4) * 16}px`,
}));

const SNOW_FLAKES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 3.9 + (i % 4) * 1.4) % 100}%`,
  dur: `${7 + (i % 5) * 1.6}s`,
  delay: `${(i % 8) * 0.85}s`,
  size: `${3 + (i % 4) * 2}px`,
}));

const STARS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 11.7 + 3) % 96}%`,
  top: `${(i * 7.3 + 4) % 52}%`,
  size: i % 4 === 0 ? 3 : 2,
  delay: `${(i % 6) * 0.55}s`,
}));

export function WeatherBackdrop({ category }: WeatherBackdropProps) {
  const theme = SKY_THEMES[category];

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-1000 ease-out"
      style={{ background: theme.background }}
      aria-hidden="true"
    >
      {/* Atmospheric Luminous Gradient Orbs */}
      <div
        className="pointer-events-none absolute -top-36 -right-24 h-[34rem] w-[34rem] rounded-full blur-[120px] anim-ambient-orb transition-colors duration-1000"
        style={{ background: theme.orbPrimary }}
      />
      <div
        className="pointer-events-none absolute -bottom-44 -left-24 h-[36rem] w-[36rem] rounded-full blur-[130px] anim-ambient-orb transition-colors duration-1000"
        style={{ background: theme.orbSecondary, animationDelay: '-6s' }}
      />

      {/* Subtle Zenith Sunbeam Glow */}
      {theme.atmosphereEffect === 'sunbeams' && (
        <div
          className="pointer-events-none absolute top-0 right-0 h-[60vh] w-[60vw] opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 85% 12%, rgba(254, 240, 138, 0.45) 0%, rgba(251, 191, 36, 0.08) 45%, transparent 72%)',
          }}
        />
      )}

      {/* Subtle Starfield on Clear / Partly Cloudy Night */}
      {theme.atmosphereEffect === 'stars' && (
        <div className="pointer-events-none absolute inset-0">
          {STARS.map((s, idx) => (
            <span
              key={idx}
              className="absolute rounded-full bg-white/75 anim-star-1"
              style={{
                left: s.left,
                top: s.top,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient Diagonal Rain Streaks */}
      {(theme.atmosphereEffect === 'rain' || theme.atmosphereEffect === 'storm') && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {RAIN_DROPS.map((drop, idx) => (
            <span
              key={idx}
              className="absolute top-0 w-px bg-gradient-to-b from-transparent via-sky-200/45 to-transparent anim-bg-rain"
              style={
                {
                  left: drop.left,
                  height: drop.height,
                  '--dur': drop.dur,
                  '--delay': drop.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Ambient Falling Snow Particles */}
      {theme.atmosphereEffect === 'snow' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {SNOW_FLAKES.map((flake, idx) => (
            <span
              key={idx}
              className="absolute top-0 rounded-full bg-white/70 blur-[0.5px] anim-bg-snow"
              style={
                {
                  left: flake.left,
                  width: flake.size,
                  height: flake.size,
                  '--dur': flake.dur,
                  '--delay': flake.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Soft Calibrated Contrast Veil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6, 11, 22, 0.22) 0%, rgba(6, 11, 22, 0.14) 45%, rgba(6, 11, 22, 0.34) 100%)',
        }}
      />
    </div>
  );
}
