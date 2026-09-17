import React, { useState } from 'react';
import { StudioLogo } from './StudioLogo';
import { db } from '../services/db';
import { SyncStatus, User, AppNotification } from '../types';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  ChevronDown,
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
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const notifications = db.getNotifications().slice(0, 8);
  const unreadCount = db.getUnreadNotificationsCount();

  const handleNotificationClick = (notif: AppNotification) => {
    db.markNotificationAsRead(notif.id);
    setShowNotifMenu(false);

    if (notif.targetView) {
      onNavigate(notif.targetView, notif.targetId);
    }
  };

  const syncLabel =
    syncStatus.state === 'synced'
      ? 'Sincronizzato'
      : syncStatus.state === 'syncing'
        ? 'Sincronizzazione'
        : syncStatus.state === 'offline'
          ? 'Offline'
          : 'Conflitto';

  return (
    <header className="sticky top-0 z-40 border-b border-[#ddd7ce] bg-[#f7f4ee]/95 text-[#292725] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">

        {/* MENU */}
        <button
          id="btn-open-sidebar"
          onClick={onOpenSidebar}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-[#514d48] transition-all hover:border-[#d2cbc1] hover:bg-white hover:text-[#8b5360]"
          title="Menu principale"
          aria-label="Menu principale"
        >
          <Menu className="h-5 w-5 transition-transform group-hover:scale-105" />
        </button>

        {/* LOGO — discreto */}
        <button
          id="btn-logo-home"
          onClick={() => onNavigate('home')}
          className="hidden shrink-0 items-center opacity-80 transition-opacity hover:opacity-100 sm:flex"
          aria-label="Home Studio Ottico Di Pietro"
        >
          <StudioLogo size="sm" />
        </button>

        {/* SEARCH PRINCIPALE */}
        <button
          id="btn-header-search-bar"
          onClick={onOpenSearch}
          className="group mx-auto flex h-11 min-w-0 flex-1 items-center justify-between rounded-full border border-[#d8d1c7] bg-white/65 px-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#b99aa1] hover:bg-white sm:max-w-2xl sm:px-5"
          aria-label="Cosa stai cercando?"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[#8b5360]" />

            <span className="truncate text-xs font-medium text-[#77716a] sm:text-sm">
              Cosa stai cercando?
            </span>
          </div>

          <span className="hidden shrink-0 text-[9px] uppercase tracking-[0.16em] text-[#aaa39a] md:block">
            IA · filtri · archivio
          </span>
        </button>

        {/* CONTROLLI — SOLO SYNC + NOTIFICHE */}
        <div className="flex shrink-0 items-center gap-1">

          {/* SYNC */}
          <button
            id="btn-sync-status"
            onClick={() => db.triggerSyncSimulation()}
            title={`Stato: ${syncLabel}. Clicca per sincronizzare.`}
            aria-label={`Sincronizzazione: ${syncLabel}`}
            className="group flex h-10 items-center gap-2 rounded-full border border-transparent px-2.5 text-[#77716a] transition-all hover:border-[#d2cbc1] hover:bg-white hover:text-[#514d48] sm:px-3"
          >
            {syncStatus.state === 'synced' && (
              <CheckCircle2 className="h-4 w-4 text-[#66816f]" />
            )}

            {syncStatus.state === 'syncing' && (
              <RefreshCw className="h-4 w-4 animate-spin text-[#a88655]" />
            )}

            {syncStatus.state === 'offline' && (
              <WifiOff className="h-4 w-4 text-[#9b666d]" />
            )}

            {syncStatus.state === 'conflict' && (
              <AlertTriangle className="h-4 w-4 text-[#a88655]" />
            )}

            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] sm:inline">
              {syncLabel}
            </span>
          </button>

          {/* NOTIFICHE */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => setShowNotifMenu((value) => !value)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#77716a] transition-all hover:border-[#d2cbc1] hover:bg-white hover:text-[#8b5360]"
              title="Notifiche"
              aria-label="Notifiche"
              aria-expanded={showNotifMenu}
            >
              <Bell className="h-[18px] w-[18px]" />

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b5360] px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowNotifMenu(false)}
                  aria-label="Chiudi notifiche"
                />

                <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#d9d2c8] bg-[#fbf9f5] shadow-[0_18px_50px_rgba(42,38,34,0.16)]">
                  <div className="flex items-center justify-between border-b border-[#e5dfd6] px-4 py-3.5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b5360]">
                        Studio
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-[#292725]">
                        Notifiche
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={() => db.markAllNotificationsAsRead()}
                        className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b5360] hover:underline"
                      >
                        Segna lette
                      </button>
                    )}
                  </div>

                  <div className="max-h-[330px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto h-5 w-5 text-[#c4bdb3]" />
                        <p className="mt-3 text-xs text-[#8c857d]">
                          Nessuna notifica al momento
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`block w-full border-b border-[#ebe6de] px-4 py-3 text-left transition-colors hover:bg-white ${
                            !notification.read ? 'bg-[#f5efea]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                !notification.read
                                  ? 'bg-[#8b5360]'
                                  : 'bg-[#d3ccc3]'
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-[#36322e]">
                                  {notification.title}
                                </p>

                                <span className="shrink-0 text-[9px] text-[#aaa39a]">
                                  {new Date(
                                    notification.timestamp
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <p className="mt-1 text-[11px] leading-relaxed text-[#77716a]">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em] text-[#aaa39a]">
                                {notification.originDevice}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[#e5dfd6] bg-[#f7f4ee] p-2.5 text-center">
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onNavigate('settings');
                      }}
                      className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8b5360] hover:underline"
                    >
                      Gestisci notifiche
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MOBILE MENU — il menu resta sempre accessibile */}
          <button
            onClick={onOpenSidebar}
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#77716a] transition-all hover:border-[#d2cbc1] hover:bg-white hover:text-[#8b5360] sm:hidden"
            title="Menu"
            aria-label="Menu"
          >
            <ChevronDown className="hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
