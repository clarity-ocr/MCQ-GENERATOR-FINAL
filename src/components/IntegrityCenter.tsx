// src/components/IntegrityCenter.tsx
import React from 'react';
import { ViolationAlert as ViolationAlertType, AppNotification } from '../types';
import { ViolationManager } from './ViolationManager'; // Reuse existing
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, BellOff } from 'lucide-react';

interface IntegrityCenterProps {
  violationAlerts: ViolationAlertType[];
  ignoredNotifications: AppNotification[];
  onGrantReattempt: (id: string) => void;
}

export const IntegrityCenter: React.FC<IntegrityCenterProps> = ({
  violationAlerts,
  ignoredNotifications,
  onGrantReattempt
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <h2 className="text-3xl font-bold text-destructive flex items-center gap-2">
        <AlertTriangle className="w-8 h-8" /> Integrity Center
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader><CardTitle className="text-destructive">Active Violations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             {violationAlerts.length === 0 && <p className="text-muted-foreground">No active violations detected.</p>}
             {violationAlerts.map(alert => (
               <ViolationManager key={alert.id} alert={alert} onGrantReattempt={onGrantReattempt} />
             ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BellOff className="w-5 h-5 text-gray-500" /> Ignored Tests Log</CardTitle></CardHeader>
          <CardContent className="space-y-3">
             {ignoredNotifications.length === 0 && <p className="text-muted-foreground">No data available.</p>}
             {ignoredNotifications.map(notif => (
               <div key={notif.id} className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
                 <p className="font-semibold">{notif.studentEmail}</p>
                 <p className="text-sm text-muted-foreground">Ignored test: {notif.test.title}</p>
                 <p className="text-xs text-muted-foreground mt-1">{new Date(notif.actionTimestamp || '').toLocaleString()}</p>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};