// src/components/NetworkCenter.tsx

import React, { useState } from 'react';
import { FollowRequest, ConnectionRequest, AppUser } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Users, UserPlus, CheckCircle, XCircle, Search, UserMinus, UserCheck, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface NetworkCenterProps {
  followRequests: FollowRequest[];
  connectionRequests: ConnectionRequest[];
  followers: AppUser[];
  following: AppUser[];
  onSendFollowRequest: (username: string) => void;
  onFollowRequestResponse: (id: string, status: 'accepted'|'rejected') => void;
  onAcceptConnection: (id: string) => void;
  onRejectConnection: (id: string) => void;
  onUnfollow: (userId: string) => void;
}

export const NetworkCenter: React.FC<NetworkCenterProps> = ({
  followRequests, connectionRequests, followers, following,
  onSendFollowRequest, onFollowRequestResponse, onAcceptConnection, onRejectConnection, onUnfollow
}) => {
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'followers' | 'following'>('requests');

  const doIFollow = (userId: string) => following.some(u => u.id === userId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
         <div><h2 className="text-3xl font-bold tracking-tight">Network Center</h2><p className="text-muted-foreground">Manage your connections.</p></div>
         <div className="flex gap-2"><div className="relative flex-1 md:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Find @username..." value={username} onChange={e => setUsername(e.target.value)} className="pl-9 bg-background" /></div><Button onClick={() => { onSendFollowRequest(username); setUsername(''); }}><UserPlus className="w-4 h-4 mr-2" /> Follow</Button></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{followers.length}</p><p className="text-sm font-medium">Followers</p></CardContent></Card>
        <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{following.length}</p><p className="text-sm font-medium">Following</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{followRequests.length}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{connectionRequests.length}</p><p className="text-sm text-muted-foreground">Connects</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2 border-b">
        {['requests', 'followers', 'following'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize", activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>{t}</button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base">Connections</CardTitle></CardHeader><CardContent className="space-y-3">{connectionRequests.length===0&&<p className="text-sm text-muted-foreground">No requests.</p>}{connectionRequests.map(req => (<div key={req.id} className="p-3 border rounded-lg bg-accent/5 flex justify-between items-center"><div><p className="font-semibold">{req.fromFacultyName}</p></div><div className="flex gap-2"><Button size="sm" onClick={() => onAcceptConnection(req.id)}>Accept</Button><Button size="sm" variant="ghost" onClick={() => onRejectConnection(req.id)}>Reject</Button></div></div>))}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Follows</CardTitle></CardHeader><CardContent className="space-y-3">{followRequests.length===0&&<p className="text-sm text-muted-foreground">No requests.</p>}{followRequests.map(req => (<div key={req.id} className="p-3 border rounded-lg flex justify-between items-center"><p className="font-medium">{req.studentEmail}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onFollowRequestResponse(req.id, 'accepted')}><CheckCircle className="w-4 h-4 text-green-600" /></Button><Button size="sm" variant="outline" onClick={() => onFollowRequestResponse(req.id, 'rejected')}><XCircle className="w-4 h-4 text-red-600" /></Button></div></div>))}</CardContent></Card>
        </div>
      )}

      {activeTab === 'followers' && (
        <Card><CardContent className="pt-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{followers.map(f => (<div key={f.id} className="flex justify-between items-center p-4 border rounded-xl"><div><p className="font-semibold">{f.name}</p><p className="text-xs text-muted-foreground">@{f.username}</p></div>{doIFollow(f.id) ? <Button size="sm" variant="secondary" disabled><UserCheck className="w-3 h-3 mr-1"/> Following</Button> : <Button size="sm" onClick={() => onSendFollowRequest(f.username)}><UserPlus className="w-3 h-3 mr-1"/> Follow Back</Button>}</div>))}</div></CardContent></Card>
      )}

      {activeTab === 'following' && (
        <Card><CardContent className="pt-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{following.map(u => (<div key={u.id} className="flex justify-between items-center p-4 border rounded-xl"><div><p className="font-semibold">{u.name}</p><p className="text-xs text-muted-foreground">@{u.username}</p></div><Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => onUnfollow(u.id)}><UserMinus className="w-3 h-3 mr-1"/> Unfollow</Button></div>))}</div></CardContent></Card>
      )}
    </div>
  );
};