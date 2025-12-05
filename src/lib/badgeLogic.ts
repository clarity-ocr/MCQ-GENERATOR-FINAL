// src/lib/badgeLogic.ts
import { AppUser, Test } from '../types';
import { ShieldCheck, Star, Award, Zap, Crown } from 'lucide-react';

export interface Badge {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

export const getUserBadges = (user: AppUser, publishedTests: Test[]): Badge[] => {
  const badges: Badge[] = [];
  const followerCount = user.followers?.length || 0;
  const testCount = publishedTests.length;

  // 1. TRUSTEE BADGE (Verified Identity)
  if (user.isIdVerified) {
    badges.push({
      id: 'trustee',
      label: 'Trustee',
      icon: ShieldCheck,
      color: 'text-blue-500 bg-blue-100 border-blue-200',
      description: 'Identity Verified Faculty'
    });
  }

  // 2. RISING STAR (First 10 Followers)
  if (followerCount >= 10 && followerCount < 50) {
    badges.push({
      id: 'rising-star',
      label: 'Rising Star',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      description: 'Growing Community (10+)'
    });
  }

  // 3. INFLUENCER (50+ Followers - Triggers Animation)
  if (followerCount >= 50) {
    badges.push({
      id: 'influencer',
      label: 'Influencer',
      icon: Crown,
      color: 'text-purple-600 bg-purple-100 border-purple-200',
      description: 'Major Impact (50+ Followers)'
    });
  }

  // 4. PROLIFIC (5+ Tests Published)
  if (testCount >= 5) {
    badges.push({
      id: 'prolific',
      label: 'Prolific',
      icon: Zap,
      color: 'text-amber-600 bg-amber-100 border-amber-200',
      description: 'High Content Output'
    });
  }

  // 5. QUALIFIED (Faculty Role + College Data)
  if (user.collegeName && user.role === 'faculty') {
    badges.push({
      id: 'qualified',
      label: 'Qualified',
      icon: Award,
      color: 'text-green-600 bg-green-100 border-green-200',
      description: 'Academic Credentials'
    });
  }

  return badges;
};