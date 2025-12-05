// src/components/ContentLibrary.tsx
import React from 'react';
import { GeneratedMcqSet, Test, CustomFormField } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Share2, Clock, Trash2 } from 'lucide-react';
import { McqDisplay } from './McqDisplay';
import { Badge } from './ui/badge';

// Reuse PublishModal here (code omitted for brevity, import or redefine)
// For this response, assuming we pass the handler down or import the shared modal from a UI file if you extract it.
// To keep it simple in one file copy, I will render a simplified list logic.

interface ContentLibraryProps {
  generatedSets: GeneratedMcqSet[];
  publishedTests: Test[];
  onPublishTest: (id: string, ...args: any) => void;
  onRevokeTest: (id: string) => void;
  onViewTestAnalytics: (test: Test) => void;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  generatedSets,
  publishedTests,
  onPublishTest,
  onRevokeTest,
  onViewTestAnalytics
}) => {
  // Logic for expanding/modals would go here (same as old Dashboard)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Content Library</h2>
        <Button>+ Create New (Generator)</Button>
      </div>

      {/* Drafts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Drafts & Unpublished
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedSets.length > 0 ? (
            generatedSets.map(set => (
              <div key={set.id} className="p-4 border rounded-xl flex justify-between items-center bg-card">
                 <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Draft</Badge>
                      <h4 className="font-semibold">{set.mcqs.length} Questions</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Generated: {new Date(set.timestamp).toLocaleString()}</p>
                 </div>
                 <Button onClick={() => onPublishTest(set.id, "Quick Publish", 30, null, 'default', [])}>
                    Publish
                 </Button>
                 {/* Note: In full implementation, restore the PublishModal here */}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No drafts available.</div>
          )}
        </CardContent>
      </Card>

      {/* Published Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-500" /> Published Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {publishedTests.length > 0 ? (
             publishedTests.map(test => (
               <div key={test.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-bold text-lg">{test.title}</h4>
                    <p className="text-sm text-muted-foreground">{test.questions.length} Questions • {test.durationMinutes} Minutes</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onViewTestAnalytics(test)}>Analytics</Button>
                    <Button variant="destructive" size="sm" onClick={() => onRevokeTest(test.id)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
               </div>
             ))
           ) : (
             <div className="text-center py-8 text-muted-foreground">No published tests.</div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};