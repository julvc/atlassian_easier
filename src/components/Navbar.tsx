import React from 'react';
import { useApp } from '../context/AppContext';
import { AppLogo } from './icons/AppLogo';

export const Navbar: React.FC = () => {
  const {
    profiles,
    activeProfile,
    selectProfile,
    currentUser,
    connectionStatus,
    runSmokeTest,
    isProcessRunning,
    theme,
    toggleTheme
  } = useApp();

  return (
    <header className="h-16 glass-panel border-b border-black/5 dark:border-white/10 flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-3.5">
          <AppLogo size={38} />
          <div className="hidden 2xl:block h-6 w-px bg-black/10 dark:bg-white/10" />
          <p className="hidden 2xl:block text-[11px] text-gray-500 dark:text-gray-400 max-w-[260px] leading-snug">
            Automatización Jira, Bitbucket & Confluence (CMMI v3.0)
          </p>
        </div>

        {/* Profile Switcher */}
        <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Proyecto:</span>
          <select
            value={activeProfile?.id || ''}
            onChange={(e) => selectProfile(e.target.value)}
            className="glass-input text-gray-900 dark:text-gray-100 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-600 max-w-[320px] truncate transition-colors font-medium shadow-xs"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {p.name} {p.jiraProjectKey ? `(${p.jiraProjectKey})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Status Badges, Theme Toggle, Smoke Test & User info */}
      <div className="flex items-center space-x-3.5">
        {/* Botón Selector Tema Claro / Oscuro */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro'}
          className="glass-button text-[11px] text-gray-800 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-semibold transition-all hover:border-brand-500/30 cursor-pointer shadow-xs"
        >
          <span>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
        </button>

        {/* Botón Rápido Smoke Test en Navbar */}
        <button
          type="button"
          onClick={runSmokeTest}
          disabled={isProcessRunning}
          title="Ejecutar Smoke Test de conectividad Atlassian y ejecutables .BAT"
          className="glass-button text-[11px] text-gray-800 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-semibold transition-all hover:border-brand-500/30"
        >
          <span>🧪</span>
          <span>Smoke Test</span>
        </button>

        {/* Chips Semánticos de Conectividad */}
        <div className="flex items-center space-x-2">
          {activeProfile?.enableJira && (
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
              connectionStatus.jira === 'ok' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : connectionStatus.jira === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white/80 text-gray-600 border-black/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus.jira === 'ok' ? 'bg-emerald-500 animate-pulse' : connectionStatus.jira === 'error' ? 'bg-rose-500' : 'bg-gray-400'
              }`} />
              <span>Jira {activeProfile.jiraProjectKey || ''}</span>
            </div>
          )}

          {activeProfile?.enableBitbucket && (
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
              activeProfile.bitbucketRepoSlug
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-white/80 text-gray-600 border-black/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activeProfile.bitbucketRepoSlug ? 'bg-brand-600' : 'bg-gray-400'}`} />
              <span>Bitbucket</span>
            </div>
          )}

          {activeProfile?.enableConfluence && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Confluence</span>
            </div>
          )}
        </div>

        {/* User Badge */}
        {currentUser ? (
          <div className="flex items-center space-x-2.5 glass-panel px-3 py-1.5 rounded-xl shadow-xs border border-black/5 dark:border-white/10">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-xs">
              {currentUser.displayName ? currentUser.displayName[0] : 'U'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {currentUser.displayName}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                {currentUser.emailAddress}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2">
            Verificando credenciales...
          </div>
        )}
      </div>
    </header>
  );
};