import React, { useState } from 'react';
import { StudioLogo } from './StudioLogo';
import { db } from '../services/db';
import { SyncStatus, User, AppNotification } from '../types';
import {
  Menu,
  Search,
  Bell,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  syncStatus: SyncStatus;
  currentUser: User;
  onNavigate: (view: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenSearch,
  syncStatus,
  currentUser,
  onNavigate,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const users = db.getUsers();
  const notifications = db.getNotifications().slice(0, 8);
  const unreadCount = db.getUnreadNotificationsCount();

  const handleSwitchUser = (userId: string) => {
    db.setCurrentUser(userId);
    setShowUserMenu(false);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    db.markNotificationAsRead(notif.id);
    setShowNotifMenu(false);
    if (notif.targetView) {
      onNavigate(notif.targetView, notif.targetId);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-teal-950/95 backdrop-blur-md border-b border-teal-800/40 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-open-sidebar"
            onClick={onOpenSidebar}
            className="p-2 -ml-1 text-teal-200 hover:text-white hover:bg-teal-900/60 rounded-lg transition-colors"
            title="Menu Principale"
            aria-label="Menu Principale"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button
            id="btn-logo-home"
            onClick={() => onNavigate('home')}
            className="text-left focus:outline-none"
          >
            <StudioLogo size="md" />
          </button>
        </div>

        {/* Center: Universal Search trigger (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            id="btn-header-search-bar"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-teal-900/50 border border-teal-700/40 text-teal-200 hover:text-white hover:bg-teal-900/80 hover:border-teal-500/50 transition-all text-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-400 group-hover:text-teal-300" />
              <span className="text-teal-300/80">Cosa stai cercando? (IA o filtri)</span>
            </div>
            <kbd className="hidden lg:inline-block text-[10px] font-mono bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800 text-teal-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Sync Pill, Mobile Search Icon, Device/User, Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Button */}
          <button
            id="btn-mobile-search"
            onClick={onOpenSearch}
            className="md:hidden p-2 text-teal-200 hover:text-white hover:bg-teal-900/60 rounded-lg transition-colors"
            title="Cerca con IA"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Sync Status Badge (Requisito 40: Indicatore Sincronizzazione) */}
          <button
            id="btn-sync-status"
            onClick={() => db.triggerSyncSimulation()}
            title={`Stato: ${syncStatus.state.toUpperCase()} - Clicca per forzare sincronizzazione`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              syncStatus.state === 'synced'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                : syncStatus.state === 'syncing'
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/50 animate-pulse'
                : syncStatus.state === 'offline'
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                : 'bg-orange-950/80 text-orange-300 border-orange-700/50'
            }`}
          >
            {syncStatus.state === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {syncStatus.state === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            {syncStatus.state === 'offline' && <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            {syncStatus.state === 'conflict' && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
            <span className="hidden sm:inline">
              {syncStatus.state === 'synced' && '🟢 Sincronizzato'}
              {syncStatus.state === 'syncing' && '🟡 Sincronizzazione...'}
              {syncStatus.state === 'offline' && '🔴 Offline'}
              {syncStatus.state === 'conflict' && '⚠️ Conflitto'}
            </span>
          </button>

          {/* User & Device Switcher (Requisito 6 & 7: Filippo & Mariangela sui 2 Smartphone) */}
          <div className="relative">
            <button
              id="btn-user-switcher"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-900/40 hover:bg-teal-900/80 border border-teal-800/60 text-xs font-medium text-teal-100 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span className="max-w-[90px] sm:max-w-none truncate">{currentUser.name.split(' ')[0]}</span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: currentUser.avatarColor }}
              />
              <ChevronDown className="w-3 h-3 text-teal-300" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-teal-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs text-slate-400">Postazione Attiva / Smartphone:</p>
                  <p className="text-sm font-semibold text-white">{currentUser.deviceName}</p>
                </div>

                <div className="p-1 space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-teal-900/60 text-teal-100 font-semibold border border-teal-700/50'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: u.avatarColor }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-white">{u.name}</p>
                          <p className="text-[10px] text-teal-400">{u.role}</p>
                        </div>
                      </div>
                      {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-teal-400" />}
                    </button>
                  ))}
                </div>

                <div className="px-3 py-2 mt-1 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Simulazione multi-dispositivo</span>
                  <button
                    onClick={() => db.toggleOfflineMode()}
                    className="text-teal-400 hover:underline"
                  >
                    {syncStatus.state === 'offline' ? 'Torna Online' : 'Simula Offline'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown (Requisito 36: Notifiche Real-time tra dispositivi) */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-teal-200 hover:text-white hover:bg-teal-900/60 rounded-lg transition-colors"
              title="Notifiche"
              aria-label="Notifiche"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-teal-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 bg-teal-950/80 border-b border-teal-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold text-white">Notifiche Studio</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => db.markAllNotificationsAsRead()}
                      className="text-xs text-teal-400 hover:underline"
                    >
                      Segna lette
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nessuna notifica al momento
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-800/80 transition-colors ${
                          !n.read ? 'bg-teal-950/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-100">{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                          <span>Origine: {n.originDevice}</span>
                          <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      onNavigate('settings');
                    }}
                    className="text-xs text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    Gestisci preferenze notifiche <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
