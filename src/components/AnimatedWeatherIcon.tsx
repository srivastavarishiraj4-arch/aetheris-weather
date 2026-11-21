import type { WeatherVisualCategory } from '../types/weather';

interface AnimatedWeatherIconProps {
  category: WeatherVisualCategory;
  size?: number;
  className?: string;
}

export function AnimatedWeatherIcon({
  category,
  size = 96,
  className = '',
}: AnimatedWeatherIconProps) {
  const uid = `wi-${category}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sun`} x1="20" y1="16" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id={`${uid}-sun-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-cloud`} x1="20" y1="30" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={`${uid}-storm-cloud`} x1="18" y1="26" x2="78" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="55%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`${uid}-moon`} x1="24" y1="18" x2="70" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id={`${uid}-bolt`} x1="48" y1="54" x2="42" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {category === 'clear-day' && (
        <g>
          <circle cx="48" cy="48" r="40" fill={`url(#${uid}-sun-glow)`} className="anim-sun-pulse" />
          <g className="anim-sun-spin" style={{ transformOrigin: '48px 48px' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="48"
                y1="11"
                x2="48"
                y2="19"
                stroke="#FDE047"
                strokeWidth="3.2"
                strokeLinecap="round"
                transform={`rotate(${deg} 48 48)`}
              />
            ))}
          </g>
          <circle cx="48" cy="48" r="20" fill={`url(#${uid}-sun)`} className="anim-sun-pulse" />
        </g>
      )}

      {category === 'clear-night' && (
        <g>
          <circle cx="48" cy="48" r="34" fill="rgba(147, 197, 253, 0.14)" className="anim-sun-pulse" />
          <path
            d="M58.5 64.5C44.5 64.5 33.5 53.5 33.5 39.5C33.5 32.5 36.2 26.2 40.7 21.6C29.4 24.4 21 34.6 21 46.8C21 61.2 32.6 72.8 47 72.8C57.6 72.8 66.8 66.4 70.8 57.3C67.2 61.7 63.1 64.5 58.5 64.5Z"
            fill={`url(#${uid}-moon)`}
          />
          <g className="anim-star-1" style={{ transformOrigin: '67px 26px' }}>
            <path d="M67 20L68.5 24.5L73 26L68.5 27.5L67 32L65.5 27.5L61 26L65.5 24.5L67 20Z" fill="#FEF08A" />
          </g>
          <g className="anim-star-2" style={{ transformOrigin: '75px 42px' }}>
            <path d="M75 38L76 41L79 42L76 43L75 46L74 43L71 42L74 41L75 38Z" fill="#BAE6FD" />
          </g>
          <circle cx="54" cy="23" r="1.8" fill="#E0F2FE" className="anim-star-2" />
        </g>
      )}

      {category === 'partly-cloudy-day' && (
        <g>
          <g className="anim-sun-spin" style={{ transformOrigin: '60px 34px' }}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="60"
                y1="12"
                x2="60"
                y2="17"
                stroke="#FDE047"
                strokeWidth="2.8"
                strokeLinecap="round"
                transform={`rotate(${deg} 60 34)`}
              />
            ))}
          </g>
          <circle cx="60" cy="34" r="14" fill={`url(#${uid}-sun)`} className="anim-sun-pulse" />
          <g className="anim-cloud-drift">
            <path
              d="M27 72H67C74.2 72 80 66.2 80 59C80 52.3 74.9 46.8 68.4 46.1C66.2 37.9 58.8 32 50 32C40.1 32 32 39.6 31.1 49.2C24.8 49.9 20 55.2 20 61.7C20 67.4 23.2 72 27 72Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
        </g>
      )}

      {category === 'partly-cloudy-night' && (
        <g>
          <path
            d="M68 43C59.5 43 52.8 36.3 52.8 27.8C52.8 23.6 54.4 19.8 57.1 17C50.2 18.7 45 24.9 45 32.3C45 41.1 52.1 48.2 60.9 48.2C67.4 48.2 73 44.3 75.5 38.7C73.3 41.4 70.8 43 68 43Z"
            fill={`url(#${uid}-moon)`}
          />
          <circle cx="77" cy="22" r="2" fill="#FEF08A" className="anim-star-1" />
          <g className="anim-cloud-drift">
            <path
              d="M24 74H65C72.2 74 78 68.2 78 61C78 54.3 72.9 48.8 66.4 48.1C64.2 39.9 56.8 34 48 34C38.1 34 30 41.6 29.1 51.2C22.8 51.9 18 57.2 18 63.7C18 69.4 20.6 74 24 74Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
        </g>
      )}

      {category === 'cloudy' && (
        <g>
          <g className="anim-cloud-drift-reverse" opacity="0.72">
            <path
              d="M34 56H72C77.5 56 82 51.5 82 46C82 40.9 78.1 36.7 73.1 36.1C71.4 29.8 65.7 25 58.9 25C51.2 25 45 31 44.3 38.4C39.4 38.9 35.6 43 35.6 48C35.6 52.4 31.1 56 34 56Z"
              fill="#CBD5E1"
            />
          </g>
          <g className="anim-cloud-drift">
            <path
              d="M22 72H66C73.2 72 79 66.2 79 59C79 52.2 73.8 46.6 67.2 46C65 37.6 57.4 31.5 48.5 31.5C38.4 31.5 30.2 39.2 29.3 49C22.9 49.7 18 55.1 18 61.7C18 67.4 19.8 72 22 72Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
        </g>
      )}

      {category === 'rain' && (
        <g>
          <g className="anim-cloud-drift">
            <path
              d="M22 58H68C75 58 80.5 52.5 80.5 45.5C80.5 39 75.5 33.7 69.1 33.1C67 25 59.7 19 51 19C41.2 19 33.2 26.5 32.3 36C26 36.7 21 42 21 48.4C21 53.7 20 58 22 58Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
          <line x1="33" y1="64" x2="29" y2="75" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" className="anim-rain-1" />
          <line x1="48" y1="64" x2="44" y2="77" stroke="#7DD3FC" strokeWidth="3.2" strokeLinecap="round" className="anim-rain-2" />
          <line x1="63" y1="64" x2="59" y2="75" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" className="anim-rain-3" />
        </g>
      )}

      {category === 'thunderstorm' && (
        <g>
          <g className="anim-cloud-drift">
            <path
              d="M21 56H69C75.8 56 81 50.8 81 44C81 37.7 76.2 32.5 70 32C68 24.1 60.8 18 52 18C42.3 18 34.4 25.4 33.5 34.8C27.2 35.5 22 40.8 22 47.2C22 52.2 19.6 56 21 56Z"
              fill={`url(#${uid}-storm-cloud)`}
            />
          </g>
          <path
            d="M50 53L39 69H48L43 85L61 64H51L56 53H50Z"
            fill={`url(#${uid}-bolt)`}
            className="anim-lightning"
          />
          <line x1="29" y1="63" x2="26" y2="72" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" className="anim-rain-1" />
          <line x1="67" y1="63" x2="64" y2="72" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" className="anim-rain-3" />
        </g>
      )}

      {category === 'snow' && (
        <g>
          <g className="anim-cloud-drift">
            <path
              d="M22 57H68C75 57 80.5 51.5 80.5 44.5C80.5 38 75.5 32.7 69.1 32.1C67 24 59.7 18 51 18C41.2 18 33.2 25.5 32.3 35C26 35.7 21 41 21 47.4C21 52.7 20 57 22 57Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
          <g className="anim-snow-1" style={{ transformOrigin: '33px 70px' }}>
            <circle cx="33" cy="70" r="3.2" fill="#E0F2FE" />
          </g>
          <g className="anim-snow-2" style={{ transformOrigin: '49px 73px' }}>
            <circle cx="49" cy="73" r="3.6" fill="#FFFFFF" />
          </g>
          <g className="anim-snow-3" style={{ transformOrigin: '64px 69px' }}>
            <circle cx="64" cy="69" r="3" fill="#BAE6FD" />
          </g>
        </g>
      )}

      {category === 'fog' && (
        <g>
          <g className="anim-cloud-drift" opacity="0.9">
            <path
              d="M24 52H68C74.2 52 79 47.2 79 41C79 35.2 74.6 30.4 69 29.8C67.1 22.8 60.8 17.5 53 17.5C44.4 17.5 37.3 24 36.5 32.4C30.8 33 26.5 37.8 26.5 43.5C26.5 48.2 22.8 52 24 52Z"
              fill={`url(#${uid}-cloud)`}
            />
          </g>
          <line x1="20" y1="61" x2="76" y2="61" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" className="anim-fog-1" />
          <line x1="26" y1="70" x2="70" y2="70" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" className="anim-fog-2" />
          <line x1="32" y1="79" x2="64" y2="79" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" className="anim-fog-1" />
        </g>
      )}

      {category === 'windy' && (
        <g>
          <path
            d="M16 38H58C64 38 68 34 68 29C68 24 64 20 59 20C55.5 20 52.5 22 51.5 25"
            stroke="#E0F2FE"
            strokeWidth="3.6"
            strokeLinecap="round"
            className="anim-wind"
          />
          <path
            d="M14 52H72C78 52 82 56 82 61C82 66 78 70 73 70C69.5 70 66.5 68 65.5 65"
            stroke="#7DD3FC"
            strokeWidth="3.6"
            strokeLinecap="round"
            className="anim-wind"
            style={{ animationDelay: '0.4s' }}
          />
          <path
            d="M22 66H48C52 66 55 69 55 73C55 77 52 80 48 80"
            stroke="#BAE6FD"
            strokeWidth="3.2"
            strokeLinecap="round"
            className="anim-wind"
            style={{ animationDelay: '0.85s' }}
          />
        </g>
      )}
    </svg>
  );
}
