import React from 'react';

interface AppLogoProps {
  /**
   * 'full': Icono del cohete + Texto "ATLASSIAN EASY" + Badge "SUITE"
   * 'icon': Solo el isotipo del cohete con sus nodos y llamas
   */
  variant?: 'full' | 'icon';
  size?: number;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Isotipo Vectorial del Cohete Atlassian Easy / Easier Suite
 * Fiel a la propuesta visual del usuario:
 * - Cohete fusiforme con gradiente Azul Eléctrico (#0052CC / #1E6BFF) a Púrpura (#6C47FF)
 * - Nodos interconectados (ecosistema Atlassian / red de commits)
 * - Cápsula cockpit blanca con riel tecnológico y nodo cyan
 * - Llamas de propulsión en gradiente Coral (#FF3B30) a Ámbar Dorado (#FFAA00)
 */
export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform hover:scale-105 ${className}`}
    >
      <defs>
        {/* Gradiente Fuselaje: Azul Atlassian Eléctrico a Púrpura Neón */}
        <linearGradient id="rocketBodyGrad" x1="20%" y1="90%" x2="90%" y2="15%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="45%" stopColor="#1E6BFF" />
          <stop offset="85%" stopColor="#6C47FF" />
          <stop offset="100%" stopColor="#8743FF" />
        </linearGradient>

        {/* Gradiente Alerón Inferior */}
        <linearGradient id="rocketFinGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#0041A8" />
          <stop offset="100%" stopColor="#552CD6" />
        </linearGradient>

        {/* Gradiente Llamas: Coral Escarlata a Amarillo Solar */}
        <linearGradient id="flameCenterGrad" x1="85%" y1="15%" x2="10%" y2="95%">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="40%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>

        <linearGradient id="flameSideGrad" x1="85%" y1="20%" x2="15%" y2="90%">
          <stop offset="0%" stopColor="#FF453A" />
          <stop offset="60%" stopColor="#FF8500" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>

        {/* Gradiente Nodos Red Superior (Cyan a Azul) */}
        <linearGradient id="nodeTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C7FF" />
          <stop offset="100%" stopColor="#0070F3" />
        </linearGradient>

        {/* Gradiente Nodo Red Inferior (Púrpura a Magenta) */}
        <linearGradient id="nodeBottomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A259FF" />
          <stop offset="100%" stopColor="#7B2CBF" />
        </linearGradient>

        {/* Sombra de Profundidad */}
        <filter id="rocketShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052CC" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* 1. RED DE NODOS INTERCONECTADOS */}
      <g strokeWidth="2.5" strokeLinecap="round">
        <line x1="32" y1="28" x2="62" y2="44" stroke="#00A3FF" strokeOpacity="0.85" />
        <line x1="32" y1="28" x2="22" y2="54" stroke="#0070F3" strokeOpacity="0.75" />
        <line x1="72" y1="76" x2="94" y2="88" stroke="#8A3FFC" strokeOpacity="0.85" />
      </g>

      <circle cx="32" cy="28" r="6.5" fill="url(#nodeTopGrad)" />
      <circle cx="32" cy="28" r="3" fill="#FFFFFF" fillOpacity="0.8" />
      <circle cx="22" cy="54" r="5" fill="#0052CC" />
      <circle cx="22" cy="54" r="2" fill="#FFFFFF" fillOpacity="0.6" />
      <circle cx="94" cy="88" r="6.5" fill="url(#nodeBottomGrad)" />
      <circle cx="94" cy="88" r="3" fill="#FFFFFF" fillOpacity="0.85" />

      {/* 2. LLAMAS DE PROPULSIÓN DINÁMICAS */}
      <path d="M34,80 C27,86 16,98 12,106 C22,103 29,95 34,88 Z" fill="url(#flameSideGrad)" />
      <path d="M42,84 C34,94 22,112 16,118 C28,114 38,102 46,90 Z" fill="url(#flameCenterGrad)" />
      <path d="M48,88 C43,94 36,104 32,112 C39,107 46,99 50,93 Z" fill="url(#flameSideGrad)" />

      {/* 3. ALERONES DEL COHETE */}
      <path d="M46,62 L26,72 C23,73 24,78 28,78 L43,76 Z" fill="url(#rocketFinGrad)" />
      <path d="M66,74 L74,94 C76,98 81,97 80,92 L74,78 Z" fill="url(#rocketFinGrad)" />

      {/* 4. CUERPO PRINCIPAL DEL COHETE */}
      <path
        d="M98,24 C86,16 68,26 56,40 C44,54 38,72 40,82 C49,84 68,78 82,66 C96,54 106,36 98,24 Z"
        fill="url(#rocketBodyGrad)"
        filter="url(#rocketShadow)"
      />

      {/* 5. CÁPSULA COCKPIT */}
      <path
        d="M86,34 C80,28 72,34 65,42 C58,50 54,60 55,65 C60,66 69,62 76,55 C83,48 89,40 86,34 Z"
        fill="#FFFFFF"
      />
      <path d="M62,56 L77,41" stroke="#0052CC" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="77" cy="41" r="4" fill="#00C7FF" />
      <circle cx="77" cy="41" r="1.8" fill="#FFFFFF" />
      <ellipse cx="40.5" cy="83.5" rx="5" ry="2.5" transform="rotate(-45 40.5 83.5)" fill="#172B4D" />
    </svg>
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'full',
  size = 38,
  className = ''
}) => {
  if (variant === 'icon') {
    return <AppLogoIcon size={size} className={className} />;
  }

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center drop-shadow-sm">
        <AppLogoIcon size={size} />
      </div>
      <div className="flex flex-col leading-none">
        <div className="text-[13px] font-black tracking-wider text-gray-900 dark:text-white uppercase font-sans">
          ATLASSIAN
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5">
          <span className="text-[13px] font-black tracking-wider text-gray-900 dark:text-white uppercase font-sans">
            EASIER
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r from-[#5B36F5] to-[#7B2CBF] shadow-xs">
            SUITE
          </span>
        </div>
      </div>
    </div>
  );
};