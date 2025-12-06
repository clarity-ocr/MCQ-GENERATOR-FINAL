import React, { useState, useEffect } from 'react';
import type { Test, Student, AppUser } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Fingerprint, Building2, Users, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface StudentLoginProps {
  test: Test;
  currentUser: AppUser | null; // Added to access logged-in user data
  onLogin: (student: Student) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ test, currentUser, onLogin }) => {
  // --- STATE INITIALIZATION ---
  // If currentUser exists, pre-fill data
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || ''); 
  const [department, setDepartment] = useState(''); 
  const [group, setGroup] = useState(''); 
  
  // Custom Fields State
  const [customData, setCustomData] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  // Update state if currentUser changes (e.g. late load)
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleCustomDataChange = (label: string, value: string) => {
    setCustomData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 1. Validate Default Mode
    if (test.studentFieldsMode === 'default') {
      if (!name.trim() || !username.trim()) {
        setError("Name and Username are required.");
        return;
      }
    } 
    // 2. Validate Custom Mode
    else {
      for (const field of test.customStudentFields) {
        if (field.required !== false && !customData[field.label]?.trim()) {
          setError(`Field "${field.label}" is required.`);
          return;
        }
      }
    }
    
    // 3. Construct Data Object
    const loginData: Student = { 
      name: name.trim() || customData['Name'] || "Candidate", 
      registrationNumber: username.trim() || customData['ID'] || "Unknown", 
      branch: department.trim() || "N/A", 
      section: group.trim() || "N/A", 
      customData 
    };

    onLogin(loginData);
  };

  const isAutoFilled = !!currentUser;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2 ring-4 ring-white dark:ring-gray-800">
            {currentUser ? (
               // Show Avatar/Initials if logged in
               <span className="text-xl font-bold text-primary">{currentUser.name.charAt(0)}</span>
            ) : (
               <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Candidate Registration</CardTitle>
          <CardDescription>
            {isAutoFilled ? (
              <span className="flex items-center justify-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Logged in as {currentUser?.username}
              </span>
            ) : (
              "Enter your details to register and begin:"
            )}
            <span className="font-bold text-foreground block mt-2 text-lg px-4 py-1 bg-muted rounded-full w-fit mx-auto">
              {test.title}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* --- DEFAULT FIELDS MODE --- */}
            {test.studentFieldsMode === 'default' && (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. John Doe" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className={`pl-9 ${isAutoFilled ? 'bg-muted/50' : ''}`}
                      // We usually allow name editing even if logged in, but you can lock it:
                      // readOnly={isAutoFilled} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Username / Unique ID</Label>
                  <div className="relative">
                    {isAutoFilled ? (
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                    ) : (
                      <Fingerprint className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input 
                      placeholder="e.g. user_123 or Roll No" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      className={`pl-9 font-mono ${isAutoFilled ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 text-amber-900 dark:text-amber-100 cursor-not-allowed' : ''}`}
                      readOnly={isAutoFilled} // LOCK THE USERNAME IF LOGGED IN
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground flex justify-between">
                    <span>This ID tracks your attempt limits.</span>
                    {isAutoFilled && <span className="text-amber-600 font-medium">Auto-selected from account</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department / Branch</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Optional" 
                        value={department} 
                        onChange={e => setDepartment(e.target.value)} 
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Group / Section</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Optional" 
                        value={group} 
                        onChange={e => setGroup(e.target.value)} 
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- CUSTOM FIELDS MODE --- */}
            {test.studentFieldsMode === 'custom' && (
              <div className="space-y-4">
                {test.customStudentFields.map((field, idx) => (
                  <div key={idx} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input 
                      required={field.required !== false}
                      placeholder={`Enter ${field.label}`}
                      value={customData[field.label] || ''} 
                      onChange={e => handleCustomDataChange(field.label, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* --- ERRORS --- */}
            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* --- SUBMIT --- */}
            <Button type="submit" size="lg" className="w-full text-base py-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
              {isAutoFilled ? 'Confirm & Start Test' : 'Register & Start Test'} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              By continuing, you agree to the test integrity rules.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};