// src/components/Notifications.tsx

import React from 'react';
import type { AppNotification, Test } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, Bell, FileText, MessageSquare, Clock, Check, X 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationsProps {
  notifications: AppNotification[];
  onStartTest: (test: Test, notificationId: string) => void;
  onIgnoreTest: (notificationId: string) => void;
  onBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  notifications, onStartTest, onIgnoreTest, onBack 
}) => {
  
  // Sort by timestamp (newest first), fallback to ID if timestamp missing
  const sortedNotifications = [...notifications].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
            <p className="text-muted-foreground">Updates from your faculty network.</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-16 border rounded-xl border-dashed">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          sortedNotifications.map(notif => {
            // -- LOGIC: Determine Type --
            const isTest = notif.type === 'test_invite' || (!!notif.test); // Fallback for legacy data
            const isMessage = notif.type === 'message';
            const dateStr = notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Just now';

            return (
              <Card key={notif.id} className={cn("transition-all hover:shadow-sm", notif.status === 'new' ? "border-l-4 border-l-blue-500 bg-blue-50/10" : "")}>
                <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  
                  {/* Icon */}
                  <div className={cn("p-3 rounded-full flex-shrink-0", isTest ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600")}>
                    {isTest ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{notif.facultyName}</span>
                        <span className="text-xs text-muted-foreground">• {dateStr}</span>
                        {notif.status === 'new' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 h-5 px-1.5 text-[10px]">NEW</Badge>}
                    </div>
                    
                    {isTest && notif.test ? (
                        <div>
                            <h3 className="font-bold text-lg">{notif.test.title}</h3>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                <span>{notif.test.questions.length} Questions</span>
                                <span>{notif.test.durationMinutes} Mins</span>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-bold">{notif.title || "Message"}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {isTest && notif.test && (
                        <>
                            <Button 
                                size="sm" 
                                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => onStartTest(notif.test!, notif.id)}
                            >
                                <Check className="w-4 h-4 mr-1" /> Start
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 md:flex-none"
                                onClick={() => onIgnoreTest(notif.id)}
                            >
                                <X className="w-4 h-4 mr-1" /> Dismiss
                            </Button>
                        </>
                    )}
                    {isMessage && (
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className="flex-1 md:flex-none"
                            onClick={() => onIgnoreTest(notif.id)} // Mark as read/dismiss
                        >
                            Mark Read
                        </Button>
                    )}
                  </div>

                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};