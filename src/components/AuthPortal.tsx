// src/components/AuthPortal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Role } from '../types';
import { countries, states, districts } from '../services/locationData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ArrowLeft, Check, X, AtSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface RegistrationData {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  collegeName: string;
  country: string;
  state: string;
  district: string;
}

interface AuthPortalProps {
  onLogin: (email: string, pass: string) => Promise<string | null>;
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; error?: string; email?: string }>;
  onGoogleSignIn: () => Promise<{ error?: string; isNewUser?: boolean; googleUser?: User }>;
  onRegistrationSuccess: (email: string) => void;
}

const PasswordInput = ({ value, onChange, placeholder, error }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("pr-10 bg-white/50 dark:bg-black/20 backdrop-blur-sm", error && "border-destructive focus-visible:ring-destructive")}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLogin,
  onRegister,
  onGoogleSignIn,
  onRegistrationSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Username Logic
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    name: '',
    email: '',
    role: Role.Student,
    collegeName: '',
    country: '',
    state: '',
    district: '',
  });
  const [password, setPassword] = useState('');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  useEffect(() => {
    setError(null);
    setStep(1);
    if (!isLogin && !isGoogleAuth) {
      setFormData(prev => ({ ...prev, name: '', email: '', username: '' }));
      setPassword('');
      setUsernameStatus('idle');
    }
  }, [isLogin]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, state: '', district: '' }));
  }, [formData.country]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, district: '' }));
  }, [formData.state]);

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    try {
      // NOTE: This query requires the 'allow read: if true' rule in firestore.rules
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      setUsernameStatus(querySnapshot.empty ? 'available' : 'taken');
    } catch (err) {
      console.error("Username check error:", err);
      // Fallback: If network/rules fail, allow user to try submitting (server will catch it)
      setUsernameStatus('idle'); 
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);

    if (field === 'username') {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setFormData(prev => ({ ...prev, username: cleanValue }));
      
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      if (cleanValue.length >= 3) {
        setUsernameStatus('checking');
        debounceTimer.current = setTimeout(() => checkUsername(cleanValue), 500);
      } else {
        setUsernameStatus('idle');
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGoogleSignIn();
      if (result.error) {
        setError(result.error);
      } else if (result.isNewUser && result.googleUser) {
        setIsGoogleAuth(true);
        setIsLogin(false);
        setFormData(prev => ({
          ...prev,
          email: result.googleUser!.email || '',
          name: result.googleUser!.displayName || '',
        }));
        setStep(2);
      }
    } catch (err) {
      setError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep: number) => {
    if (isLogin) {
      if (!formData.email || !password) return "Please enter email and password.";
      return null;
    }

    if (currentStep === 1) { 
      if (!formData.email.includes('@')) return "Invalid email address.";
      if (password.length < 6) return "Password must be at least 6 characters.";
    }
    
    if (currentStep === 2) { 
      if (formData.username.length < 3) return "Username must be at least 3 characters.";
      if (usernameStatus === 'taken') return "Username is already taken.";
      if (!formData.name.trim()) return "Full name is required.";
    }
    
    if (currentStep === 3) {
      if (!formData.collegeName) return "College name is required.";
      if (!formData.country || !formData.state || !formData.district) return "Please complete location details.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(isLogin ? 0 : step);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const errorMsg = await onLogin(formData.email, password);
        if (errorMsg) setError(errorMsg);
      } else {
        const res = await onRegister({ ...formData, password: isGoogleAuth ? undefined : password });
        if (res.error) setError(res.error);
        else if (res.success && res.email) onRegistrationSuccess(res.email);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-y-auto">
      <Card className="w-full max-w-md border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-2">
             <span className="text-2xl font-bold text-white">Q</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : isGoogleAuth ? "Complete Profile" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to connect with your academic network" 
              : step === 1 ? "Start your journey with us" 
              : step === 2 ? "Choose your unique identity" 
              : "Tell us where you study"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 px-3 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="student@university.edu"
                    className="bg-white/50 dark:bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput 
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isLogin && step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input 
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-white/50 dark:bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Create Password</Label>
                  <PasswordInput 
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
            )}

            {!isLogin && step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="bg-white/50 dark:bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input 
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="username"
                      className={cn(
                        "pl-9 pr-9 bg-white/50 dark:bg-black/20 transition-all",
                        usernameStatus === 'taken' && "border-destructive focus-visible:ring-destructive",
                        usernameStatus === 'available' && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                      {usernameStatus === 'taken' && <X className="h-4 w-4 text-destructive" />}
                    </div>
                  </div>
                  <div className="flex justify-between items-center min-h-[1.25rem]">
                    <p className={cn(
                      "text-xs transition-colors",
                      usernameStatus === 'taken' ? "text-destructive font-medium" : 
                      usernameStatus === 'available' ? "text-green-600 font-medium" : 
                      "text-muted-foreground"
                    )}>
                      {usernameStatus === 'taken' ? "Username is already taken" :
                       usernameStatus === 'available' ? "Username is available" :
                       "Unique handle for your profile"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isLogin && step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleInputChange('role', Role.Student)}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 text-center transition-all",
                      formData.role === Role.Student ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <span className="text-sm font-medium">Student</span>
                  </div>
                  <div
                    onClick={() => handleInputChange('role', Role.Faculty)}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 text-center transition-all",
                      formData.role === Role.Faculty ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <span className="text-sm font-medium">Faculty</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>College / School</Label>
                  <Input 
                    value={formData.collegeName}
                    onChange={(e) => handleInputChange('collegeName', e.target.value)}
                    placeholder="State University"
                    className="bg-white/50 dark:bg-black/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20"><SelectValue placeholder="Country" /></SelectTrigger>
                      <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={(v) => handleInputChange('state', v)} disabled={!formData.country}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>{(states[formData.country] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={formData.district} onValueChange={(v) => handleInputChange('district', v)} disabled={!formData.state}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20"><SelectValue placeholder="District" /></SelectTrigger>
                    <SelectContent>{(districts[formData.state] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="pt-2">
              {isLogin ? (
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="w-1/3 h-11">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={handleNext} 
                      disabled={step === 2 && (usernameStatus === 'checking' || usernameStatus === 'taken')}
                      className="w-full h-11 font-semibold"
                    >
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="w-full h-11 font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleAuth} 
            disabled={loading} 
            className="w-full h-11 bg-white/50 dark:bg-black/20 border-muted hover:bg-white/80 transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.011 35.091 44 30.025 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
            </svg>
            Google
          </Button>
        </CardContent>

        <CardFooter className="pb-6 pt-0">
          <p className="w-full text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPortal;