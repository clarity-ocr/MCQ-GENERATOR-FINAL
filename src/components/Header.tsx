// src/components/Header.tsx

import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  LogOut, 
  User as UserIcon, 
  Bell, 
  Menu, 
  X,
  LayoutDashboard,
  FileText,
  Users,
  ShieldAlert,
  PlusCircle,
  Settings
} from 'lucide-react';
import { AppUser, View } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from '../lib/utils'; // Ensures 'cn' is found

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeView, 
  onNavigate, 
  onLogout 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const NavItem = ({ view, label, icon: Icon }: { view: View; label: string; icon: React.ElementType }) => (
    <button 
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
        activeView === view ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        
        {/* --- LOGO --- */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-xl">Q</span>
          </div>
          <span className="font-bold text-lg hidden sm:inline-block tracking-tight">Quizly AI</span>
        </div>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden md:flex items-center gap-6">
          <NavItem view="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem view="content" label="Content" icon={FileText} />
          <NavItem view="network" label="Network" icon={Users} />
          <NavItem view="integrity" label="Integrity" icon={ShieldAlert} />
          <NavItem view="generator" label="Create" icon={PlusCircle} />
        </nav>

        {/* --- ACTIONS --- */}
        <div className="flex items-center gap-2">
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => onNavigate('generator')}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onNavigate('notifications')}
            className={activeView === 'notifications' ? "text-primary bg-accent" : ""}
          >
             <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                 <div className="flex h-full w-full items-center justify-center rounded-full bg-muted border border-border overflow-hidden">
                    <span className="text-xs font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                 </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('profile')}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden ml-1" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 animate-in slide-in-from-top-5 fade-in duration-200 shadow-lg">
           <div className="grid gap-2">
             <Button variant="ghost" className="justify-start" onClick={() => { onNavigate('dashboard'); setIsMobileMenuOpen(false); }}>
               <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
             </Button>
             <Button variant="ghost" className="justify-start" onClick={() => { onNavigate('content'); setIsMobileMenuOpen(false); }}>
               <FileText className="mr-2 h-4 w-4" /> Content
             </Button>
             <Button variant="ghost" className="justify-start" onClick={() => { onNavigate('network'); setIsMobileMenuOpen(false); }}>
               <Users className="mr-2 h-4 w-4" /> Network
             </Button>
             <Button variant="ghost" className="justify-start" onClick={() => { onNavigate('integrity'); setIsMobileMenuOpen(false); }}>
               <ShieldAlert className="mr-2 h-4 w-4" /> Integrity
             </Button>
             <div className="my-2 border-t border-border" />
             <Button variant="ghost" className="justify-start text-destructive" onClick={onLogout}>
               <LogOut className="mr-2 h-4 w-4" /> Log out
             </Button>
           </div>
        </div>
      )}
    </header>
  );
};