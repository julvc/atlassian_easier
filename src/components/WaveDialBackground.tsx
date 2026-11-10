import React from 'react';

interface WaveDialBackgroundProps {
  isDark?: boolean;
}

export const WaveDialBackground: React.FC<WaveDialBackgroundProps> = ({ isDark = false }) => {
  if (isDark) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#080808] transition-colors duration-300">
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="darkBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080808" />
              <stop offset="50%" stopColor="#0B0D12" />
              <stop offset="100%" stopColor="#0F121A" />
            </linearGradient>

            <linearGradient id="waveDark1" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#0F131D" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#141824" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0C0F17" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="waveDark2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#141826" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#181D2E" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0F131D" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="waveDark3" x1="30%" y1="100%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#121622" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#1A2033" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0E121A" stopOpacity="0.8" />
            </linearGradient>

            <filter id="darkReliefShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000000" floodOpacity="0.6" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#4030EE" floodOpacity="0.15" />
            </filter>

            <filter id="darkDeepWaveShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="14" stdDeviation="28" floodColor="#000000" floodOpacity="0.7" />
            </filter>

            <pattern id="watchGuillocheDark" width="160" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 20 Q 40 5, 80 20 T 160 20"
                fill="none"
                stroke="#4030EE"
                strokeWidth="0.7"
                strokeOpacity="0.16"
              />
              <path
                d="M0 22 Q 40 7, 80 22 T 160 22"
                fill="none"
                stroke="#DEDEDE"
                strokeWidth="0.5"
                strokeOpacity="0.04"
              />
              <path
                d="M0 38 Q 40 23, 80 38 T 160 38"
                fill="none"
                stroke="#4030EE"
                strokeWidth="0.5"
                strokeOpacity="0.1"
              />
            </pattern>

            <radialGradient id="watchGleamDark" cx="75%" cy="15%" r="65%">
              <stop offset="0%" stopColor="#4030EE" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#4030EE" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1920" height="1080" fill="url(#darkBase)" />

          <path
            d="M-100,280 C320,120 620,440 1050,220 C1480,0 1780,260 2050,140 L2050,1150 L-100,1150 Z"
            fill="url(#waveDark1)"
            filter="url(#darkDeepWaveShadow)"
          />
          <path
            d="M-100,480 C360,290 740,640 1180,380 C1540,160 1820,380 2050,260 L2050,1150 L-100,1150 Z"
            fill="url(#waveDark2)"
            filter="url(#darkReliefShadow)"
          />
          <path
            d="M-100,680 C300,520 690,780 1120,560 C1520,340 1790,520 2050,420 L2050,1150 L-100,1150 Z"
            fill="url(#waveDark3)"
            filter="url(#darkReliefShadow)"
          />
          <path
            d="M-100,860 C420,720 840,940 1260,760 C1620,620 1880,740 2050,660 L2050,1150 L-100,1150 Z"
            fill="#0B0D14"
            fillOpacity="0.8"
            filter="url(#darkReliefShadow)"
          />

          <rect width="1920" height="1080" fill="url(#watchGuillocheDark)" opacity="0.9" />

          <path
            d="M-100,280 C320,120 620,440 1050,220 C1480,0 1780,260 2050,140"
            fill="none"
            stroke="#4030EE"
            strokeWidth="1.8"
            strokeOpacity="0.35"
          />
          <path
            d="M-100,480 C360,290 740,640 1180,380 C1540,160 1820,380 2050,260"
            fill="none"
            stroke="#DEDEDE"
            strokeWidth="1.2"
            strokeOpacity="0.12"
          />
          <path
            d="M-100,680 C300,520 690,780 1120,560 C1520,340 1790,520 2050,420"
            fill="none"
            stroke="#4030EE"
            strokeWidth="1.4"
            strokeOpacity="0.25"
          />

          <path
            d="M-100,484 C360,294 740,644 1180,384 C1540,164 1820,384 2050,264"
            fill="none"
            stroke="#4030EE"
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />
          <path
            d="M-100,684 C300,524 690,784 1120,564 C1520,344 1790,524 2050,424"
            fill="none"
            stroke="#4030EE"
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />

          <rect width="1920" height="1080" fill="url(#watchGleamDark)" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#080808]/70" />
      </div>
    );
  }

  // TEMA CLARO: Blanco hueso (#F7F7F4) + Olas pastel + Guilloché
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#F7F7F4]">
      <svg
        className="absolute inset-0 w-full h-full object-cover opacity-85"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="boneBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9F9F6" />
            <stop offset="45%" stopColor="#F6F6F2" />
            <stop offset="100%" stopColor="#EFF3F8" />
          </linearGradient>

          <linearGradient id="wavePastel1" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#EAF1F8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#F0F4FA" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E4ECF6" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id="wavePastel2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFEBF7" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#EBF2FA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5F8FC" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="wavePastel3" x1="30%" y1="100%" x2="70%" y2="0%">
            <stop offset="0%" stopColor="#E2EDF9" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#F2F6FB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#DAE7F5" stopOpacity="0.7" />
          </linearGradient>

          <filter id="reliefShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#8B9EB5" floodOpacity="0.12" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.9" />
          </filter>

          <filter id="deepWaveShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="24" floodColor="#7A8FA8" floodOpacity="0.10" />
          </filter>

          <pattern id="watchGuilloche" width="160" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M0 20 Q 40 5, 80 20 T 160 20"
              fill="none"
              stroke="#4030EE"
              strokeWidth="0.6"
              strokeOpacity="0.045"
            />
            <path
              d="M0 22 Q 40 7, 80 22 T 160 22"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
            <path
              d="M0 38 Q 40 23, 80 38 T 160 38"
              fill="none"
              stroke="#4030EE"
              strokeWidth="0.45"
              strokeOpacity="0.035"
            />
          </pattern>

          <radialGradient id="watchGleam" cx="75%" cy="15%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#boneBase)" />

        <path
          d="M-100,280 C320,120 620,440 1050,220 C1480,0 1780,260 2050,140 L2050,1150 L-100,1150 Z"
          fill="url(#wavePastel1)"
          filter="url(#deepWaveShadow)"
        />
        <path
          d="M-100,480 C360,290 740,640 1180,380 C1540,160 1820,380 2050,260 L2050,1150 L-100,1150 Z"
          fill="url(#wavePastel2)"
          filter="url(#reliefShadow)"
        />
        <path
          d="M-100,680 C300,520 690,780 1120,560 C1520,340 1790,520 2050,420 L2050,1150 L-100,1150 Z"
          fill="url(#wavePastel3)"
          filter="url(#reliefShadow)"
        />
        <path
          d="M-100,860 C420,720 840,940 1260,760 C1620,620 1880,740 2050,660 L2050,1150 L-100,1150 Z"
          fill="#F5F8FC"
          fillOpacity="0.7"
          filter="url(#reliefShadow)"
        />

        <rect width="1920" height="1080" fill="url(#watchGuilloche)" opacity="0.85" />

        <path
          d="M-100,280 C320,120 620,440 1050,220 C1480,0 1780,260 2050,140"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeOpacity="0.8"
        />
        <path
          d="M-100,480 C360,290 740,640 1180,380 C1540,160 1820,380 2050,260"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <path
          d="M-100,680 C300,520 690,780 1120,560 C1520,340 1790,520 2050,420"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeOpacity="0.9"
        />

        <path
          d="M-100,484 C360,294 740,644 1180,384 C1540,164 1820,384 2050,264"
          fill="none"
          stroke="#4030EE"
          strokeWidth="0.7"
          strokeOpacity="0.08"
        />
        <path
          d="M-100,684 C300,524 690,784 1120,564 C1520,344 1790,524 2050,424"
          fill="none"
          stroke="#4030EE"
          strokeWidth="0.7"
          strokeOpacity="0.08"
        />

        <rect width="1920" height="1080" fill="url(#watchGleam)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#F2F5F9]/50" />
    </div>
  );
};