import React from 'react';

interface NavIconProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

/**
 * 1. ICONO COHETE (Pipeline & .BAT)
 */
export const RocketPipelineIcon: React.FC<NavIconProps> = ({ size = 26, isActive = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      <defs>
        <linearGradient id="rocketBodyLgt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#E4ECF7" />
          <stop offset="100%" stopColor="#C9D7EB" />
        </linearGradient>
        <linearGradient id="rocketTipRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5630" />
          <stop offset="100%" stopColor="#DE350B" />
        </linearGradient>
        <linearGradient id="navFlameGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="50%" stopColor="#FF8500" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        <linearGradient id="windowGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C7FF" />
          <stop offset="100%" stopColor="#0052CC" />
        </linearGradient>
      </defs>

      <path d="M22,42 C16,46 9,56 6,61 C13,59 18,54 22,48 Z" fill="url(#navFlameGrad)" />
      <path d="M26,46 C19,53 13,63 10,64 C19,61 24,53 28,49 Z" fill="#FFA000" />
      <path d="M30,48 C27,53 22,59 19,63 C24,60 29,54 32,50 Z" fill="url(#navFlameGrad)" />

      <path d="M29,36 L15,43 C13,44 14,48 17,47 L27,45 Z" fill="url(#rocketTipRed)" />
      <path d="M44,43 L48,56 C49,58 52,58 52,54 L49,46 Z" fill="url(#rocketTipRed)" />

      <path
        d="M56,12 C48,6 36,14 28,24 C20,34 18,44 21,50 C27,51 38,48 46,40 C54,32 61,19 56,12 Z"
        fill="url(#rocketBodyLgt)"
        stroke="#4A5568"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M56,12 C52,9 47,12 43,16 L53,26 C57,22 59,15 56,12 Z" fill="url(#rocketTipRed)" />
      <circle cx="38" cy="30" r="5" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="36.5" cy="28.5" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
    </svg>
  );
};

/**
 * 2. ICONO TABLERO KANBAN (Jira Issues)
 */
export const KanbanJiraIcon: React.FC<NavIconProps> = ({ size = 26, isActive = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      <defs>
        <linearGradient id="cardOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAB00" />
          <stop offset="100%" stopColor="#FF8B00" />
        </linearGradient>
        <linearGradient id="cardCoral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7452" />
          <stop offset="100%" stopColor="#FF5630" />
        </linearGradient>
      </defs>

      <line x1="12" y1="12" x2="12" y2="54" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="12" x2="28" y2="54" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="12" x2="44" y2="54" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="58" y1="12" x2="58" y2="54" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />

      <rect x="14" y="14" width="12" height="3" rx="1.5" fill="#0052CC" />
      <rect x="30" y="14" width="12" height="3" rx="1.5" fill="#6554C0" />
      <rect x="46" y="14" width="10" height="3" rx="1.5" fill="#00A3BF" />

      <rect x="14" y="21" width="12" height="10" rx="2" fill="url(#cardOrange)" />
      <rect x="14" y="34" width="12" height="12" rx="2" fill="url(#cardCoral)" />

      <rect x="30" y="21" width="12" height="12" rx="2" fill="url(#cardCoral)" />
      <line x1="33" y1="26" x2="39" y2="26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="33" y1="29" x2="37" y2="29" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />

      <rect x="46" y="21" width="10" height="12" rx="2" fill="url(#cardOrange)" />
      <line x1="48" y1="26" x2="54" y2="26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

/**
 * 3. ICONO CRONÓMETRO CON ENGRANAJES (Bitácora & Horas)
 */
export const ChronoWorklogIcon: React.FC<NavIconProps> = ({ size = 26, isActive = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      <defs>
        <linearGradient id="chronoDial" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDF2F7" />
        </linearGradient>
      </defs>

      <rect x="25" y="6" width="6" height="4" rx="1.5" fill="#64748B" />
      <path d="M28,10 L28,14" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />

      <g transform="translate(45, 12)">
        <circle cx="6" cy="6" r="4.5" fill="#718096" />
        <rect x="4.8" y="0" width="2.4" height="12" rx="0.5" fill="#718096" />
        <rect x="0" y="4.8" width="12" height="2.4" rx="0.5" fill="#718096" />
        <circle cx="6" cy="6" r="2" fill="#FFFFFF" />
      </g>

      <g transform="translate(42, 40)">
        <circle cx="8" cy="8" r="6" fill="#FF5630" />
        <rect x="6.5" y="0" width="3" height="16" rx="0.8" fill="#FF5630" />
        <rect x="0" y="6.5" width="16" height="3" rx="0.8" fill="#FF5630" />
        <circle cx="8" cy="8" r="2.8" fill="#FFFFFF" />
      </g>

      <circle cx="28" cy="34" r="19" fill="#475569" stroke="#64748B" strokeWidth="2" />
      <circle cx="28" cy="34" r="15" fill="url(#chronoDial)" />

      <circle cx="28" cy="22" r="1" fill="#718096" />
      <circle cx="40" cy="34" r="1" fill="#718096" />
      <circle cx="28" cy="46" r="1" fill="#718096" />
      <circle cx="16" cy="34" r="1" fill="#718096" />

      <line x1="28" y1="34" x2="36" y2="24" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="34" r="2.5" fill="#1E293B" />
      <circle cx="28" cy="34" r="1" fill="#FF3B30" />
    </svg>
  );
};

/**
 * 4. ICONO ESLABÓN DE CADENA (Bitbucket & Confluence)
 */
export const ChainIntegrationsIcon: React.FC<NavIconProps> = ({ size = 26, isActive = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      <defs>
        <linearGradient id="chainBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C7FF" />
          <stop offset="100%" stopColor="#0052CC" />
        </linearGradient>
        <linearGradient id="chainPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#6C47FF" />
        </linearGradient>
      </defs>

      <rect
        x="12"
        y="16"
        width="28"
        height="14"
        rx="7"
        transform="rotate(-45 26 23)"
        stroke="url(#chainBlueGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect
        x="24"
        y="34"
        width="28"
        height="14"
        rx="7"
        transform="rotate(-45 38 41)"
        stroke="url(#chainPurpleGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="2" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
};

/**
 * 5. ICONO ENGRANAJE MECÁNICO (Perfiles de Proyecto)
 */
export const GearProfilesIcon: React.FC<NavIconProps> = ({ size = 26, isActive = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'hover:scale-105'} ${className}`}
    >
      <defs>
        <linearGradient id="gearMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      <g transform="translate(32, 32)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="-3.5"
            y="-22"
            width="7"
            height="8"
            rx="1.5"
            transform={`rotate(${deg})`}
            fill="url(#gearMetalGrad)"
          />
        ))}
        <circle cx="0" cy="0" r="18" fill="url(#gearMetalGrad)" />
        <circle cx="0" cy="0" r="12" fill="#334155" />
        <circle cx="0" cy="0" r="8" fill="#0052CC" />
        <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
      </g>
    </svg>
  );
};