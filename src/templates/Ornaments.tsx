import React from 'react';

interface OrnamentProps {
  color: string;
  accent?: string;
  className?: string;
}

/** Uzbek Suzani / Samarkand inspired top medallion arch */
export const MilliyArchOrnament: React.FC<OrnamentProps> = ({ color, accent = '#C99A45', className = '' }) => (
  <svg viewBox="0 0 320 96" fill="none" className={className} aria-hidden="true">
    <path
      d="M10 86 C60 86, 95 28, 160 12 C225 28, 260 86, 310 86"
      stroke={accent}
      strokeWidth="1.5"
      strokeOpacity="0.85"
    />
    <path
      d="M28 86 C72 86, 105 38, 160 24 C215 38, 248 86, 292 86"
      stroke={color}
      strokeWidth="1"
      strokeDasharray="3 3"
      strokeOpacity="0.55"
    />
    <g transform="translate(160, 44)">
      <polygon points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="1.2" />
      <polygon points="0,-11 3,-3 11,0 3,3 0,11 -3,3 -11,0 -3,-3" transform="rotate(45)" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1" />
      <circle cx="0" cy="0" r="3.5" fill={accent} />
    </g>
    <circle cx="96" cy="56" r="3" fill={accent} fillOpacity="0.7" />
    <circle cx="224" cy="56" r="3" fill={accent} fillOpacity="0.7" />
    <circle cx="64" cy="74" r="2" fill={color} fillOpacity="0.5" />
    <circle cx="256" cy="74" r="2" fill={color} fillOpacity="0.5" />
  </svg>
);

/** Classic floral botanical flourish divider */
export const ClassicFlourish: React.FC<OrnamentProps> = ({ color, className = '' }) => (
  <svg viewBox="0 0 280 42" fill="none" className={className} aria-hidden="true">
    <path d="M12 21 H106" stroke={color} strokeWidth="0.9" strokeOpacity="0.55" />
    <path d="M174 21 H268" stroke={color} strokeWidth="0.9" strokeOpacity="0.55" />
    <path
      d="M112 21 C122 10, 134 10, 140 21 C146 32, 158 32, 168 21"
      stroke={color}
      strokeWidth="1.25"
      strokeOpacity="0.85"
    />
    <path
      d="M112 21 C122 32, 134 32, 140 21 C146 10, 158 10, 168 21"
      stroke={color}
      strokeWidth="1.25"
      strokeOpacity="0.45"
    />
    <circle cx="140" cy="21" r="3" fill={color} />
    <circle cx="106" cy="21" r="1.8" fill={color} fillOpacity="0.7" />
    <circle cx="174" cy="21" r="1.8" fill={color} fillOpacity="0.7" />
  </svg>
);

/** Islamic geometric Rub el Hizb arch & star */
export const IslamicArchOrnament: React.FC<OrnamentProps> = ({ color, accent = '#C9A23F', className = '' }) => (
  <svg viewBox="0 0 320 110" fill="none" className={className} aria-hidden="true">
    <path
      d="M16 104 Q16 42 160 10 Q304 42 304 104"
      stroke={accent}
      strokeWidth="1.6"
      strokeOpacity="0.85"
    />
    <path
      d="M28 104 Q28 50 160 21 Q292 50 292 104"
      stroke={color}
      strokeWidth="0.9"
      strokeOpacity="0.45"
    />
    <g transform="translate(160, 56)">
      <rect x="-13" y="-13" width="26" height="26" stroke={accent} strokeWidth="1.3" fill={accent} fillOpacity="0.12" />
      <rect x="-13" y="-13" width="26" height="26" transform="rotate(45)" stroke={accent} strokeWidth="1.3" fill={accent} fillOpacity="0.12" />
      <circle cx="0" cy="0" r="5" stroke={color} strokeWidth="1.1" fill={accent} fillOpacity="0.35" />
    </g>
    <path d="M108 56 H134 M186 56 H212" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
  </svg>
);

/** Royal gala crown & diamond divider */
export const RoyalCrestOrnament: React.FC<OrnamentProps> = ({ color, className = '' }) => (
  <svg viewBox="0 0 280 64" fill="none" className={className} aria-hidden="true">
    <path d="M18 42 L104 42" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    <path d="M176 42 L262 42" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    <path
      d="M116 42 L124 20 L140 31 L156 20 L164 42 Z"
      stroke={color}
      strokeWidth="1.4"
      fill={color}
      fillOpacity="0.16"
    />
    <circle cx="124" cy="16" r="2.2" fill={color} />
    <circle cx="140" cy="11" r="2.8" fill={color} />
    <circle cx="156" cy="16" r="2.2" fill={color} />
    <path d="M112 48 H168" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />
    <polygon points="140,52 145,57 140,62 135,57" fill={color} />
  </svg>
);

/** Romantic Heart Wax Seal & Ribbon Ornament */
export const LoveSealOrnament: React.FC<OrnamentProps> = ({ color, accent = '#E11D48', className = '' }) => (
  <svg viewBox="0 0 280 76" fill="none" className={className} aria-hidden="true">
    <path d="M20 38 H100" stroke={accent} strokeWidth="1" strokeOpacity="0.45" />
    <path d="M180 38 H260" stroke={accent} strokeWidth="1" strokeOpacity="0.45" />
    <circle cx="140" cy="38" r="27" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" strokeDasharray="3 3" />
    <circle cx="140" cy="38" r="21" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" />
    <path
      d="M140 49 C140 49, 126 40.5, 126 32.5 C126 28.5, 129.2 26, 132.8 26 C135.7 26, 138.3 27.7, 140 30.2 C141.7 27.7, 144.3 26, 147.2 26 C150.8 26, 154 28.5, 154 32.5 C154 40.5, 140 49, 140 49 Z"
      fill={accent}
    />
    <circle cx="92" cy="38" r="2.5" fill={accent} fillOpacity="0.7" />
    <circle cx="188" cy="38" r="2.5" fill={accent} fillOpacity="0.7" />
  </svg>
);

/** Starry Constellation Heart for Romantic Night / Anniversary */
export const StarryHeartOrnament: React.FC<OrnamentProps> = ({ color, accent = '#E07A8B', className = '' }) => (
  <svg viewBox="0 0 280 80" fill="none" className={className} aria-hidden="true">
    {/* Constellation lines */}
    <path
      d="M62 46 L94 28 L122 38 M158 38 L186 28 L218 46"
      stroke={color}
      strokeWidth="0.8"
      strokeDasharray="2 3"
      strokeOpacity="0.55"
    />
    <circle cx="62" cy="46" r="2" fill={color} />
    <circle cx="94" cy="28" r="2.5" fill={accent} />
    <circle cx="186" cy="28" r="2.5" fill={accent} />
    <circle cx="218" cy="46" r="2" fill={color} />
    {/* Crescent & Heart */}
    <path
      d="M140 58 C140 58, 121 46, 121 34 C121 28, 125.8 24, 131 24 C135 24, 138 26.5, 140 29.8 C142 26.5, 145 24, 149 24 C154.2 24, 159 28, 159 34 C159 46, 140 58, 140 58 Z"
      stroke={color}
      strokeWidth="1.5"
      fill={accent}
      fillOpacity="0.2"
    />
    {/* Little 4-point stars */}
    <path d="M140 8 L141.5 12.5 L146 14 L141.5 15.5 L140 20 L138.5 15.5 L134 14 L138.5 12.5 Z" fill={color} />
    <path d="M78 14 L79 17 L82 18 L79 19 L78 22 L77 19 L74 18 L77 17 Z" fill={color} fillOpacity="0.7" />
    <path d="M202 14 L203 17 L206 18 L203 19 L202 22 L201 19 L198 18 L201 17 Z" fill={color} fillOpacity="0.7" />
  </svg>
);

/** Festive Sparkle Garland for Birthday / Beshik */
export const FestiveGarlandOrnament: React.FC<OrnamentProps> = ({ color, accent = '#E59F3B', className = '' }) => (
  <svg viewBox="0 0 280 64" fill="none" className={className} aria-hidden="true">
    <path d="M20 20 Q80 48 140 26 Q200 48 260 20" stroke={accent} strokeWidth="1.4" strokeOpacity="0.7" />
    <path d="M140 10 L143 19 L152 22 L143 25 L140 34 L137 25 L128 22 L137 19 Z" fill={accent} />
    <circle cx="76" cy="34" r="4" fill={color} fillOpacity="0.75" />
    <circle cx="204" cy="34" r="4" fill={color} fillOpacity="0.75" />
    <circle cx="48" cy="28" r="2.5" fill={accent} />
    <circle cx="232" cy="28" r="2.5" fill={accent} />
    <circle cx="110" cy="32" r="2.5" fill={color} fillOpacity="0.5" />
    <circle cx="170" cy="32" r="2.5" fill={color} fillOpacity="0.5" />
  </svg>
);

/** Subtle corner filigree */
export const CornerOrnament: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <path d="M4 60 V14 C4 8 8 4 14 4 H60" stroke={color} strokeWidth="1.4" strokeOpacity="0.55" />
    <path d="M12 52 V18 C12 14 14 12 18 12 H52" stroke={color} strokeWidth="0.9" strokeOpacity="0.35" />
    <circle cx="16" cy="16" r="2.5" fill={color} fillOpacity="0.6" />
  </svg>
);

/** Olive branch & gentle heart for Forgiveness (Kechirim) */
export const ForgivenessOrnament: React.FC<OrnamentProps> = ({ color, accent = '#E11D48', className = '' }) => (
  <svg viewBox="0 0 280 72" fill="none" className={className} aria-hidden="true">
    <path d="M36 46 Q90 22 126 36" stroke={color} strokeWidth="1.2" strokeOpacity="0.6" />
    <path d="M244 46 Q190 22 154 36" stroke={color} strokeWidth="1.2" strokeOpacity="0.6" />
    {/* Soft olive leaves */}
    <ellipse cx="78" cy="30" rx="8" ry="3.5" transform="rotate(-22 78 30)" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1" />
    <ellipse cx="104" cy="28" rx="7" ry="3" transform="rotate(-10 104 28)" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1" />
    <ellipse cx="202" cy="30" rx="8" ry="3.5" transform="rotate(22 202 30)" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1" />
    <ellipse cx="176" cy="28" rx="7" ry="3" transform="rotate(10 176 28)" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1" />
    {/* Center heart */}
    <path
      d="M140 50 C140 50, 125 40.5, 125 32 C125 27.5, 128.6 24.5, 132.5 24.5 C135.5 24.5, 138.2 26.5, 140 29 C141.8 26.5, 144.5 24.5, 147.5 24.5 C151.4 24.5, 155 27.5, 155 32 C155 40.5, 140 50, 140 50 Z"
      fill={accent}
      fillOpacity="0.22"
      stroke={accent}
      strokeWidth="1.4"
    />
  </svg>
);

/** Radiant Golden Sunburst for Gratitude (Rahmat) */
export const GratitudeSunOrnament: React.FC<OrnamentProps> = ({ color, accent = '#D97706', className = '' }) => (
  <svg viewBox="0 0 280 72" fill="none" className={className} aria-hidden="true">
    <path d="M24 44 H104 M176 44 H256" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
    <circle cx="140" cy="36" r="14" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.4" />
    <circle cx="140" cy="36" r="7" fill={color} fillOpacity="0.3" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="140"
        y1="14"
        x2="140"
        y2="20"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinecap="round"
        transform={`rotate(${deg} 140 36)`}
      />
    ))}
  </svg>
);

/** Paper Airplane & Stars for Missing You (Sog'indim) */
export const MissYouPlaneOrnament: React.FC<OrnamentProps> = ({ color, accent = '#818CF8', className = '' }) => (
  <svg viewBox="0 0 280 72" fill="none" className={className} aria-hidden="true">
    <path
      d="M28 52 Q80 62 122 38"
      stroke={accent}
      strokeWidth="1.2"
      strokeDasharray="4 4"
      strokeOpacity="0.7"
    />
    <path
      d="M126 36 L166 20 L148 52 L140 39 Z"
      fill={accent}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M166 20 L140 39" stroke={color} strokeWidth="1.1" />
    <circle cx="198" cy="24" r="2.2" fill={accent} />
    <circle cx="222" cy="36" r="1.8" fill={color} fillOpacity="0.6" />
    <circle cx="88" cy="24" r="1.8" fill={color} fillOpacity="0.5" />
  </svg>
);

/** Festive Floral Crescent for Greetings (Tabrik) */
export const GreetingBouquetOrnament: React.FC<OrnamentProps> = ({ color, accent = '#C9A23F', className = '' }) => (
  <svg viewBox="0 0 280 70" fill="none" className={className} aria-hidden="true">
    <path d="M24 38 H108 M172 38 H256" stroke={accent} strokeWidth="1" strokeOpacity="0.55" />
    <polygon
      points="140,12 146,28 162,34 146,40 140,56 134,40 118,34 134,28"
      fill={accent}
      fillOpacity="0.2"
      stroke={accent}
      strokeWidth="1.3"
    />
    <circle cx="140" cy="34" r="4" fill={color} />
    <circle cx="110" cy="22" r="2.2" fill={accent} fillOpacity="0.7" />
    <circle cx="170" cy="22" r="2.2" fill={accent} fillOpacity="0.7" />
  </svg>
);
