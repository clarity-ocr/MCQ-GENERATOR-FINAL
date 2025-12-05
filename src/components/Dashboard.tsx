// src/components/Dashboard.tsx

import React, { useMemo } from 'react';
import { AppUser, Test, GeneratedMcqSet, TestAttempt } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Bell,
  User,
  ShieldCheck, 
  Star, 
  Award, 
  Zap, 
  Crown
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils'; // <--- FIXED: Imported cn here

// --- HELPER: Badge Logic (Inlined for simplicity) ---
interface Badge {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

const getUserBadges = (user: AppUser, publishedTests: Test[]): Badge[] => {
  const badges: Badge[] = [];
  const followerCount = user.followers?.length || 0;
  const testCount = publishedTests.length;

  if (user.isIdVerified) {
    badges.push({ id: 'trustee', label: 'Trustee', icon: ShieldCheck, color: 'text-blue-500 bg-blue-100 border-blue-200', description: 'Identity Verified' });
  }
  if (followerCount >= 10 && followerCount < 50) {
    badges.push({ id: 'rising-star', label: 'Rising Star', icon: Star, color: 'text-yellow-600 bg-yellow-100 border-yellow-200', description: 'Growing Community' });
  }
  if (followerCount >= 50) {
    badges.push({ id: 'influencer', label: 'Influencer', icon: Crown, color: 'text-purple-600 bg-purple-100 border-purple-200', description: 'Major Impact' });
  }
  if (testCount >= 5) {
    badges.push({ id: 'prolific', label: 'Prolific', icon: Zap, color: 'text-amber-600 bg-amber-100 border-amber-200', description: 'High Output' });
  }
  if (user.collegeName && user.role === 'faculty') {
    badges.push({ id: 'qualified', label: 'Qualified', icon: Award, color: 'text-green-600 bg-green-100 border-green-200', description: 'Academic' });
  }
  return badges;
};

// --- COMPONENT: UserBanner ---
const UserBanner: React.FC<{ 
  user: AppUser; 
  publishedTests: Test[]; 
  onNavigateToNotifications: () => void;
  onNavigateToProfile: () => void;
}> = ({ user, publishedTests, onNavigateToNotifications, onNavigateToProfile }) => {
  const badges = useMemo(() => getUserBadges(user, publishedTests), [user, publishedTests]);
  const followerCount = user.followers?.length || 0;
  const isHighLevel = followerCount >= 50; // Threshold for animated banner

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl p-6 md:p-10 transition-all duration-1000 border shadow-sm",
      !isHighLevel && "bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-black border-border/50",
      isHighLevel && "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy text-white shadow-2xl shadow-purple-500/20"
    )}>
      {isHighLevel && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-2", isHighLevel ? "text-white" : "text-foreground")}>
            Hello, {user.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className={cn(
               "px-3 py-1 rounded-full text-xs font-mono font-medium border",
               isHighLevel ? "bg-white/20 border-white/30 text-white" : "bg-muted text-muted-foreground border-border"
             )}>
                @{user.username}
             </div>
             
             {badges.map(badge => (
               <div key={badge.id} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border shadow-sm cursor-help", isHighLevel ? "bg-white/90 text-purple-900 border-transparent" : badge.color)} title={badge.description}>
                 <badge.icon className="w-3 h-3" />
                 {badge.label}
               </div>
             ))}
          </div>
        </div>

        <div className="flex gap-3">
           <Button variant={isHighLevel ? "secondary" : "outline"} className={cn(isHighLevel && "bg-white/20 text-white hover:bg-white/30 border-white/20")} onClick={onNavigateToNotifications}>
             <Bell className="w-4 h-4 mr-2" /> Notifications
           </Button>
           <Button variant={isHighLevel ? "secondary" : "default"} className={cn(isHighLevel && "bg-white text-purple-600 hover:bg-gray-100")} onClick={onNavigateToProfile}>
             <User className="w-4 h-4 mr-2" /> Profile
           </Button>
        </div>
      </div>
      
      {!isHighLevel && (
        <div className="mt-6 max-w-md">
           <div className="flex justify-between text-xs mb-1 text-muted-foreground">
             <span>Next Milestone: Influencer Badge</span>
             <span>{followerCount}/50 Followers</span>
           </div>
           <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500" style={{ width: `${Math.min((followerCount / 50) * 100, 100)}%` }} />
           </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT: Dashboard ---
interface DashboardProps {
  user: AppUser;
  publishedTests: Test[];
  generatedSets: GeneratedMcqSet[];
  testAttempts: TestAttempt[];
  followersCount: number;
  followingCount: number;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  publishedTests,
  generatedSets,
  followersCount,
  onNavigate
}) => {
  const totalQuestions = publishedTests.reduce((acc, t) => acc + t.questions.length, 0);

  const quickLinks = [
    { label: 'Manage Content', desc: 'Drafts & Tests', icon: FileText, view: 'content', color: 'bg-blue-500/10 text-blue-600' },
    { label: 'My Network', desc: 'Followers & Connections', icon: Users, view: 'network', color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Integrity Center', desc: 'Violations & Alerts', icon: Activity, view: 'integrity', color: 'bg-rose-500/10 text-rose-600' },
    { label: 'Analytics', desc: 'Performance Data', icon: BarChart3, view: 'testAnalytics', color: 'bg-emerald-500/10 text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <UserBanner 
        user={user} 
        publishedTests={publishedTests} 
        onNavigateToNotifications={() => onNavigate('notifications')}
        onNavigateToProfile={() => onNavigate('profile')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Tests" value={publishedTests.length} sub="Published" icon={FileText} />
        <StatsCard label="Questions Bank" value={totalQuestions} sub="Created" icon={Activity} />
        <StatsCard label="Community" value={followersCount} sub="Followers" icon={Users} />
        <StatsCard label="Drafts" value={generatedSets.length} sub="Unpublished" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-primary" /> Management Console
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <div key={link.view} onClick={() => onNavigate(link.view)} className="group flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-all cursor-pointer hover:border-primary/50 bg-card">
                  <div className={`p-3 rounded-lg ${link.color}`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold group-hover:text-primary transition-colors">{link.label}</h4>
                    <p className="text-sm text-muted-foreground">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
           </div>

           <Card>
             <CardHeader>
               <CardTitle className="text-base">Publishing Activity (Last 6 Months)</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-end justify-between h-32 gap-2 mt-2">
                 {[40, 70, 30, 85, 50, 90].map((h, i) => (
                   <div key={i} className="w-full bg-primary/10 rounded-t-sm relative group">
                     <div className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000 group-hover:bg-primary/80" style={{ height: `${h}%` }}></div>
                   </div>
                 ))}
               </div>
               <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                 <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="h-full border-none shadow-none bg-transparent">
             <div className="rounded-2xl bg-gradient-to-b from-primary/5 to-transparent p-6 border h-full">
               <h3 className="font-bold mb-4">Profile Strength</h3>
               <div className="space-y-4">
                 <StrengthItem label="Identity Verified" active={user.isIdVerified} />
                 <StrengthItem label="10+ Followers" active={followersCount >= 10} />
                 <StrengthItem label="5+ Tests Published" active={publishedTests.length >= 5} />
                 <StrengthItem label="50+ Followers (Aurora)" active={followersCount >= 50} />
               </div>
               
               <div className="mt-8 pt-8 border-t border-border/50">
                 <h3 className="font-bold mb-2">System Status</h3>
                 <div className="flex items-center gap-2 text-sm text-green-600">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   All Systems Operational
                 </div>
               </div>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, sub, icon: Icon }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </CardContent>
  </Card>
);

// --- COMPONENT: StrengthItem ---
const StrengthItem = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
      active ? "bg-green-500 text-white border-green-600" : "bg-muted text-muted-foreground"
    )}>
      {active ? "✓" : ""}
    </div>
    <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
  </div>
);