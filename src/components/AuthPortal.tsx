// src/components/AuthPortal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Role } from '../types';
import { countries, states, districts } from '../services/locationData';
import TextPressure from './TextPressure';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface AuthPortalProps {
  onLogin: (email: string, pass: string) => Promise<string | null>;
  onRegister: (
    name: string,
    email: string,
    pass: string,
    role: Role,
    collegeName: string,
    country: string,
    state: string,
    district: string
  ) => Promise<{ success: boolean; error?: string; email?: string }>;
  onGoogleSignIn: () => Promise<{ error?: string }>;
  onRegistrationSuccess: (email: string) => void;
}

// --- Subcomponents for clarity ---
const RoleSelector: React.FC<{
  selectedRole: Role;
  onSelectRole: (role: Role) => void;
}> = ({ selectedRole, onSelectRole }) => (
  <div className="grid grid-cols-2 gap-4">
    <Button
      type="button"
      variant={selectedRole === Role.Student ? "default" : "outline"}
      onClick={() => onSelectRole(Role.Student)}
      aria-pressed={selectedRole === Role.Student}
    >
      Student
    </Button>
    <Button
      type="button"
      variant={selectedRole === Role.Faculty ? "default" : "outline"}
      onClick={() => onSelectRole(Role.Faculty)}
      aria-pressed={selectedRole === Role.Faculty}
    >
      Faculty
    </Button>
  </div>
);

const LoginForm: React.FC<{
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  error: string | null;
  isLoading: boolean;
}> = ({ email, password, setEmail, setPassword, error, isLoading }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email-login">Email</Label>
      <Input
        id="email-login"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@example.com"
        autoComplete="username"
        aria-invalid={!!error}
        aria-describedby={error ? "login-error" : undefined}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password-login">Password</Label>
      <Input
        id="password-login"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="••••••••"
        autoComplete="current-password"
        aria-invalid={!!error}
      />
    </div>
    {error && (
      <Alert variant="destructive" id="login-error">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    <Button type="submit" disabled={isLoading} className="w-full">
      {isLoading ? 'Logging in...' : 'Login'}
    </Button>
  </div>
);

const RegisterStep1: React.FC<{
  role: Role;
  name: string;
  collegeName: string;
  email: string;
  password: string;
  setRole: (role: Role) => void;
  setName: (name: string) => void;
  setCollegeName: (collegeName: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  onNext: () => void;
  errors: Record<string, string>;
}> = ({
  role,
  name,
  collegeName,
  email,
  password,
  setRole,
  setName,
  setCollegeName,
  setEmail,
  setPassword,
  onNext,
  errors,
}) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="space-y-2">
      <Label>I am a...</Label>
      <RoleSelector selectedRole={role} onSelectRole={setRole} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="name">Full Name</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Jane Doe"
        aria-invalid={!!errors.name}
      />
      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
    </div>
    <div className="space-y-2">
      <Label htmlFor="college">College/School Name</Label>
      <Input
        id="college"
        value={collegeName}
        onChange={(e) => setCollegeName(e.target.value)}
        placeholder="e.g. State University"
        aria-invalid={!!errors.collegeName}
      />
      {errors.collegeName && <p className="text-sm text-destructive">{errors.collegeName}</p>}
    </div>
    <div className="space-y-2">
      <Label htmlFor="email-register">Email Address</Label>
      <Input
        id="email-register"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-invalid={!!errors.email}
      />
      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
    </div>
    <div className="space-y-2">
      <Label htmlFor="password-register">Password</Label>
      <Input
        id="password-register"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Minimum 6 characters"
        aria-invalid={!!errors.password}
      />
      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
    </div>
    <Button type="button" onClick={onNext} className="w-full">
      Next: Location Details
    </Button>
  </div>
);

const RegisterStep2: React.FC<{
  country: string;
  state: string;
  district: string;
  setCountry: (country: string) => void;
  setState: (state: string) => void;
  setDistrict: (district: string) => void;
  onBack: () => void;
  error: string | null;
  isLoading: boolean;
}> = ({
  country,
  state,
  district,
  setCountry,
  setState,
  setDistrict,
  onBack,
  error,
  isLoading,
}) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <Select onValueChange={setCountry} value={country}>
        <SelectTrigger id="country">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="state">State / Province</Label>
      <Select
        onValueChange={setState}
        value={state}
        disabled={!country}
      >
        <SelectTrigger id="state">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {(states[country] || []).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="district">District / County</Label>
      <Select
        onValueChange={setDistrict}
        value={district}
        disabled={!state}
      >
        <SelectTrigger id="district">
          <SelectValue placeholder="Select District" />
        </SelectTrigger>
        <SelectContent>
          {(districts[state] || []).map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    <div className="flex gap-4">
      <Button type="button" variant="outline" onClick={onBack} className="w-1/2">
        Back
      </Button>
      <Button type="submit" disabled={isLoading} className="w-1/2">
        {isLoading ? 'Registering...' : 'Create Account'}
      </Button>
    </div>
  </div>
);

// --- Main Component ---
export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLogin,
  onRegister,
  onGoogleSignIn,
  onRegistrationSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setState('');
    setDistrict('');
  }, [country]);

  useEffect(() => {
    setDistrict('');
  }, [state]);

  useEffect(() => {
    if (isLogin) setStep(1);
    setName('');
    setCollegeName('');
    setCountry('');
    setState('');
    setDistrict('');
    setEmail('');
    setPassword('');
    setRole(Role.Student);
    setFormError(null);
    setFieldErrors({});
  }, [isLogin]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await onGoogleSignIn();
      if (error) setFormError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep1 = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!collegeName.trim()) newErrors.collegeName = 'College name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, collegeName, email, password]);

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const error = await onLogin(email, password);
        if (error) setFormError(error);
      } else {
        if (step === 2) {
            if (!country || !state || !district) {
              setFormError('Please complete your location details.');
              setIsLoading(false);
              return;
            }
            const result = await onRegister(
              name, email, password, role, collegeName, country, state, district
            );
            if (result.error) {
              setFormError(result.error);
            } else if (result.success && result.email) {
              onRegistrationSuccess(result.email);
            }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 1000,
      }}
      className="w-full bg-background p-4 sm:p-6 md:p-8"
    >
      <Card className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center">
          <img src="/App-logo.png" alt="Quizly AI Logo" className="w-16 h-16 mx-auto mb-4" />
          <div style={{ position: 'relative', height: '100px' }}>
            <TextPressure text={isLogin ? 'Welcome Back' : 'Create Account'} flex={true} weight={true} italic={true} textColor="hsl(var(--foreground))" minFontSize={36} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {isLogin ? (
              <LoginForm email={email} password={password} setEmail={setEmail} setPassword={setPassword} error={formError} isLoading={isLoading} />
            ) : step === 1 ? (
              <RegisterStep1 role={role} name={name} collegeName={collegeName} email={email} password={password} setRole={setRole} setName={setName} setCollegeName={setCollegeName} setEmail={setEmail} setPassword={setPassword} onNext={handleNextStep} errors={fieldErrors} />
            ) : (
              <RegisterStep2 country={country} state={state} district={district} setCountry={setCountry} setState={setState} setDistrict={setDistrict} onBack={() => setStep(1)} error={formError} isLoading={isLoading} />
            )}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button onClick={handleGoogleSignIn} disabled={isLoading} variant="outline" className="w-full">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.011 35.091 44 30.025 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter>
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="w-full" aria-label={isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}>
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};