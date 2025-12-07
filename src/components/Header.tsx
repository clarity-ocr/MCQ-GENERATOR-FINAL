// src/components/Header.tsx

import React, { useState } from 'react';
import { Menu, X, LogOut, User, Bell, LayoutDashboard, Database, Network } from 'lucide-react';
import { Button } from './ui/button';
import { View, AppUser } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  notificationCount?: number; // NEW PROP
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeView, 
  onNavigate, 
  onLogout, 
  notificationCount = 0 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { onNavigate(view); setIsMenuOpen(false); }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-colors w-full md:w-auto text-sm font-medium",
        activeView === view 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg font-bold text-xl">Q</div>
          <span className="font-bold text-xl hidden sm:inline-block">Quizapo AI</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="content" icon={Database} label="Content" />
          <NavItem view="network" icon={Network} label="Network" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell with Dot */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => onNavigate('notifications')}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Profile/Logout (Desktop) */}
          <div className="hidden md:flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')}>
                <User className="w-4 h-4 mr-2" /> Profile
             </Button>
             <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
                <LogOut className="w-4 h-4" />
             </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t p-4 space-y-2 bg-background absolute w-full shadow-lg">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="content" icon={Database} label="Content" />
          <NavItem view="network" icon={Network} label="Network" />
          <div className="border-t my-2 pt-2">
            <NavItem view="profile" icon={User} label="Profile" />
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-destructive w-full text-sm font-medium">
                <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};