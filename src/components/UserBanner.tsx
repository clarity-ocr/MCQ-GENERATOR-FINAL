// src/components/UserBanner.tsx

import React, { useMemo } from 'react';
import { AppUser, Test } from '../types';
import { getUserBadges } from '../lib/badgeLogic';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Bell, User } from 'lucide-react';

interface UserBannerProps {
  user: AppUser;
  publishedTests: Test[];
  onNavigateToNotifications: () => void;
  onNavigateToProfile: () => void;
}

export const UserBanner: React.FC<UserBannerProps> = ({ 
  user, 
  publishedTests, 
  onNavigateToNotifications,
  onNavigateToProfile
}) => {
  const badges = useMemo(() => getUserBadges(user, publishedTests), [user, publishedTests]);
  const followerCount = user.followers?.length || 0;
  
  // Animation Logic: 50+ Followers unlocks the "Aurora" effect
  const isHighLevel = followerCount >= 50;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl p-6 md:p-10 transition-all duration-1000",
      // Base Background
      !isHighLevel && "bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-black border border-border/50",
      // Animated Background (High Level)
      isHighLevel && "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy text-white shadow-2xl shadow-purple-500/20"
    )}>
      
      {/* Background Particles for High Level (CSS only simulation) */}
      {isHighLevel && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold tracking-tight mb-2",
            isHighLevel ? "text-white" : "text-gray-900 dark:text-white"
          )}>
            Hello, {user.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className={cn(
               "px-3 py-1 rounded-full text-xs font-mono font-medium border",
               isHighLevel ? "bg-white/20 border-white/30 text-white" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
             )}>
                @{user.username}
             </div>
             
             {/* Badge Display */}
             {badges.map(badge => (
               <div 
                 key={badge.id}
                 className={cn(
                   "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border shadow-sm cursor-help",
                   isHighLevel ? "bg-white/90 text-purple-900 border-transparent" : badge.color
                 )}
                 title={badge.description}
               >
                 <badge.icon className="w-3 h-3" />
                 {badge.label}
               </div>
             ))}
          </div>
        </div>

        <div className="flex gap-3">
           <Button 
             variant={isHighLevel ? "secondary" : "outline"} 
             className={cn(isHighLevel && "bg-white/20 text-white hover:bg-white/30 border-white/20")}
             onClick={onNavigateToNotifications}
           >
             <Bell className="w-4 h-4 mr-2" /> Notifications
           </Button>
           <Button 
             variant={isHighLevel ? "secondary" : "default"}
             className={cn(isHighLevel && "bg-white text-purple-600 hover:bg-gray-100")}
             onClick={onNavigateToProfile}
           >
             <User className="w-4 h-4 mr-2" /> Profile
           </Button>
        </div>
      </div>
      
      {/* Milestone Progress Bar (if not yet high level) */}
      {!isHighLevel && (
        <div className="mt-6 max-w-md">
           <div className="flex justify-between text-xs mb-1 text-muted-foreground">
             <span>Next Milestone: Influencer Badge</span>
             <span>{followerCount}/50 Followers</span>
           </div>
           <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500" 
               style={{ width: `${Math.min((followerCount / 50) * 100, 100)}%` }}
             />
           </div>
        </div>
      )}
    </div>
  );
};