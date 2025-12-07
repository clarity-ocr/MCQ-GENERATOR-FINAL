import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Send, User } from 'lucide-react';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (username: string, message: string) => Promise<void>;
  prefilledUsername?: string; // Optional: to auto-fill from Analytics
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ 
  isOpen, onClose, onSend, prefilledUsername = '' 
}) => {
  const [username, setUsername] = useState(prefilledUsername);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Update local state if prefilled changes
  React.useEffect(() => { setUsername(prefilledUsername); }, [prefilledUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !message.trim()) return;
    
    setLoading(true);
    await onSend(username, message);
    setLoading(false);
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md border m-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" /> Send Notification
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Target Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="e.g. jeevasurya12" 
                className="pl-9"
                autoFocus={!prefilledUsername}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Type your alert or message here..." 
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};