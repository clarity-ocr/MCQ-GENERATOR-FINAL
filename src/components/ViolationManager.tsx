// src/components/ViolationAlert.tsx

import React from 'react';
import type { ViolationAlert as ViolationAlertType } from '../types';

interface ViolationManagerProps {
  alert: ViolationAlertType;
  onGrantReattempt: (alertId: string) => void;
}

export const ViolationManager: React.FC<ViolationManagerProps> = ({ alert, onGrantReattempt }) => {
  return (
    <div className="p-3 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/30">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {alert.studentEmail}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        was disqualified from <span className="font-medium">{alert.testTitle}</span>.
      </p>
      <button
        onClick={() => onGrantReattempt(alert.id)}
        className="w-full mt-2 text-xs py-1 px-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Grant Re-attempt Permission
      </button>
    </div>
  );
};
