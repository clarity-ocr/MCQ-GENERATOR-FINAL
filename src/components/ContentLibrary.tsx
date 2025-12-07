// src/components/ContentLibrary.tsx

import React, { useState } from 'react';
import { GeneratedMcqSet, Test, CustomFormField, View } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  FileText, 
  Share2, 
  Trash2, 
  PlusCircle, 
  Clock, 
  Calendar,
  AlertCircle,
  X,
  Copy,
  CheckCircle2,
  Link as LinkIcon,
  History
} from 'lucide-react';
import { McqDisplay } from './McqDisplay';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

// --- SUB-COMPONENT: PublishModal ---
interface PublishModalProps {
  questionCount: number;
  onSubmit: (title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[], shuffleQuestions: boolean, shuffleOptions: boolean, attemptLimit: number, allowSkip: boolean) => void;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ questionCount, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [endDate, setEndDate] = useState('');
  const [studentFieldsMode, setStudentFieldsMode] = useState<'default' | 'custom'>('default');
  const [customFields, setCustomFields] = useState<CustomFormField[]>([{ label: '' }]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Test Title is required."); return; }
    if (duration <= 0) { setError("Duration must be positive."); return; }
    
    if (endDate && new Date(endDate) <= new Date()) {
       setError("Deadline must be in the future.");
       return;
    }

    const finalFields = studentFieldsMode === 'custom' ? customFields.filter(f => f.label.trim() !== '') : [];
    onSubmit(title, duration, endDate || null, studentFieldsMode, finalFields, shuffleQuestions, shuffleOptions, attemptLimit, allowSkip);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Publish Test</CardTitle>
            <CardDescription>Configure settings for {questionCount} questions</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4"/></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Title</label>
              <Input placeholder="e.g. Final Exam - Module 1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (Minutes)</label>
                <Input type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attempt Limit (0 = Unlimited)</label>
                <Input type="number" min="0" value={attemptLimit} onChange={e => setAttemptLimit(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Revoke Deadline</label>
                <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                <p className="text-[10px] text-muted-foreground">Test closes automatically after this time.</p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary"/>
                        Shuffle Questions
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary"/>
                        Shuffle Options
                    </label>
                </div>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={allowSkip} onChange={e => setAllowSkip(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary"/>
                        Allow Skipping Questions
                    </label>
                </div>
                <p className="text-[10px] text-muted-foreground">If "Allow Skipping" is unchecked, students must answer all questions to submit.</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4"/> {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Publish & Notify Followers</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: DraftItem ---
const DraftItem: React.FC<{ 
  set: GeneratedMcqSet; 
  onPublish: (id: string, ...args: any[]) => void; 
}> = ({ set, onPublish }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="border rounded-xl bg-card transition-all hover:shadow-md hover:border-primary/30 group">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              Draft
            </Badge>
            <h4 className="font-semibold">MCQ Set ({set.mcqs.length} Questions)</h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created: {new Date(set.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="flex-1 sm:flex-none">
            {isExpanded ? 'Hide' : 'Review'}
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)} className="flex-1 sm:flex-none">
            <Share2 className="w-4 h-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4 max-h-[500px] overflow-y-auto animate-in slide-in-from-top-2">
          {set.mcqs.map((mcq, idx) => (
            <McqDisplay key={idx} mcq={mcq} index={idx} />
          ))}
        </div>
      )}

      {showModal && (
        <PublishModal 
          questionCount={set.mcqs.length}
          onClose={() => setShowModal(false)}
          onSubmit={(...args) => {
            onPublish(set.id, ...args);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: PublishedItem ---
const PublishedItem: React.FC<{ 
  test: Test; 
  onRevoke: (id: string) => void;
  onAnalytics: (test: Test) => void;
}> = ({ test, onRevoke, onAnalytics }) => {
  const [copied, setCopied] = useState(false);
  
  // Autonomous Expiration Check
  const isExpired = test.endDate && new Date(test.endDate) < new Date();

  const handleShare = () => {
    // Create direct deep link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?testId=${test.id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error("Copy failed", err));
  };

  return (
    <Card className={cn(
      "transition-colors", 
      isExpired ? "opacity-80 bg-muted/40 border-dashed" : "hover:border-primary/40"
    )}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-bold text-lg flex items-center gap-2">
              {test.title}
              {isExpired && <Badge variant="destructive" className="text-[10px] h-5">Expired</Badge>}
            </h4>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {test.durationMinutes}m</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {test.questions.length} Qs</span>
              {test.endDate && (
                <span className={cn("flex items-center gap-1", isExpired ? "text-destructive" : "text-orange-600")}>
                  <Calendar className="w-3 h-3"/> {isExpired ? "Ended:" : "Due:"} {new Date(test.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "border-green-200", 
            isExpired ? "text-muted-foreground border-border" : "text-green-600 bg-green-50"
          )}>
            {isExpired ? 'Closed' : 'Live'}
          </Badge>
        </div>
        
        <div className="flex gap-2 pt-2 border-t mt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAnalytics(test)}>
            Analytics
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className={cn("flex-1", copied ? "text-green-600 border-green-200" : "")}
            disabled={!!isExpired} // Disable share if expired
          >
            {copied ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <LinkIcon className="w-4 h-4 mr-2"/>}
            {copied ? 'Link Copied' : 'Copy Link'}
          </Button>

          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onRevoke(test.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---

interface ContentLibraryProps {
  generatedSets: GeneratedMcqSet[];
  publishedTests: Test[];
  onPublishTest: (id: string, ...args: any[]) => void;
  onRevokeTest: (id: string) => void;
  onViewTestAnalytics: (test: Test) => void;
  onNavigate: (view: View) => void; 
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  generatedSets,
  publishedTests,
  onPublishTest,
  onRevokeTest,
  onViewTestAnalytics,
  onNavigate
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">Manage your drafts, publish tests, and track deadlines.</p>
        </div>
        
        <div className="flex gap-2">
            {/* NEW: Test History Button */}
            <Button variant="outline" onClick={() => onNavigate('testHistory')}>
                <History className="w-4 h-4 mr-2" /> My Attempts
            </Button>
            
            <Button onClick={() => onNavigate('generator')} className="shadow-lg shadow-primary/20">
                <PlusCircle className="w-4 h-4 mr-2" /> Create New
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Drafts Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold">Drafts</h3>
          </div>

          <div className="space-y-4">
            {generatedSets.length > 0 ? (
              [...generatedSets]
                .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(set => (
                  <DraftItem 
                    key={set.id} 
                    set={set} 
                    onPublish={onPublishTest} 
                  />
                ))
            ) : (
              <EmptyState 
                icon={FileText}
                title="No drafts available"
                desc="Use the AI generator to create new tests."
                action={() => onNavigate('generator')}
                actionLabel="Go to Generator"
              />
            )}
          </div>
        </div>

        {/* Published Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Share2 className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Live & Past Tests</h3>
          </div>

          <div className="space-y-4">
            {publishedTests.length > 0 ? (
              publishedTests
                .sort((a, b) => {
                   // Sort: Active first, then by date
                   const aActive = !a.endDate || new Date(a.endDate) > new Date();
                   const bActive = !b.endDate || new Date(b.endDate) > new Date();
                   if (aActive && !bActive) return -1;
                   if (!aActive && bActive) return 1;
                   return 0;
                })
                .map(test => (
                  <PublishedItem 
                    key={test.id} 
                    test={test} 
                    onRevoke={onRevokeTest}
                    onAnalytics={onViewTestAnalytics}
                  />
              ))
            ) : (
              <EmptyState 
                icon={Share2}
                title="No tests published"
                desc="Published tests will appear here."
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper for empty states
const EmptyState = ({ icon: Icon, title, desc, action, actionLabel }: any) => (
  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/10 text-center animate-in zoom-in-95">
    <div className="p-3 bg-muted rounded-full mb-3">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h4 className="font-medium text-foreground">{title}</h4>
    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">{desc}</p>
    {action && (
      <Button variant="link" onClick={action} className="mt-2 text-primary">
        {actionLabel}
      </Button>
    )}
  </div>
);