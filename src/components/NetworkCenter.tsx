// src/components/NetworkCenter.tsx
import React, { useState } from 'react';
import { FollowRequest, ConnectionRequest, AppUser } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Users, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface NetworkCenterProps {
  followRequests: FollowRequest[];
  connectionRequests: ConnectionRequest[];
  followers: AppUser[];
  following: AppUser[];
  onSendFollowRequest: (username: string) => void;
  onFollowRequestResponse: (id: string, status: 'accepted'|'rejected') => void;
  onAcceptConnection: (id: string) => void;
  onRejectConnection: (id: string) => void;
}

export const NetworkCenter: React.FC<NetworkCenterProps> = ({
  followRequests,
  connectionRequests,
  followers,
  following,
  onSendFollowRequest,
  onFollowRequestResponse,
  onAcceptConnection,
  onRejectConnection
}) => {
  const [username, setUsername] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <h2 className="text-3xl font-bold">Network Center</h2>
         <div className="flex gap-2 w-full md:w-auto">
            <Input 
              placeholder="Find user by @username" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="md:w-64"
            />
            <Button onClick={() => { onSendFollowRequest(username); setUsername(''); }}>
              <UserPlus className="w-4 h-4 mr-2" /> Follow
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Connection Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <Users className="w-5 h-5 text-primary" /> Connection Requests
               {connectionRequests.length > 0 && <Badge>{connectionRequests.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {connectionRequests.length === 0 && <p className="text-muted-foreground text-sm">No pending connection requests.</p>}
             {connectionRequests.map(req => (
               <div key={req.id} className="p-3 border rounded-lg bg-accent/5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{req.fromFacultyName}</p>
                    <p className="text-xs text-muted-foreground">{req.fromFacultyCollege}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onAcceptConnection(req.id)}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => onRejectConnection(req.id)}>Reject</Button>
                  </div>
               </div>
             ))}
          </CardContent>
        </Card>

        {/* Follow Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <UserPlus className="w-5 h-5 text-primary" /> Follow Requests
               {followRequests.length > 0 && <Badge>{followRequests.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {followRequests.length === 0 && <p className="text-muted-foreground text-sm">No pending follow requests.</p>}
             {followRequests.map(req => (
               <div key={req.id} className="p-3 border rounded-lg flex justify-between items-center">
                  <p className="font-medium">{req.studentEmail}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => onFollowRequestResponse(req.id, 'accepted')}>
                       <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => onFollowRequestResponse(req.id, 'rejected')}>
                       <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
               </div>
             ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};