import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { countries, states, districts } from '../services/locationData'; 

interface AuthPortalProps {
  onLogin: (email: string, pass: string) => Promise<string | null>;
  onRegister: (name: string, email: string, pass: string, role: Role, collegeName: string, country: string, state: string, district: string) => Promise<{ success: boolean; error?: string; email?: string }>;
  onGoogleSignIn: () => Promise<{ error?: string }>;
  onRegistrationSuccess: (email: string) => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
     <input {...props} className={`w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
);

const RoleSelector: React.FC<{ selectedRole: Role; onSelectRole: (role: Role) => void }> = ({ selectedRole, onSelectRole }) => (
  <div className="grid grid-cols-2 gap-4">
    <button
      type="button"
      onClick={() => onSelectRole(Role.Student)}
      className={`py-3 rounded-lg border-2 font-medium transition ${selectedRole === Role.Student ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
    >
      Student
    </button>
    <button
      type="button"
      onClick={() => onSelectRole(Role.Faculty)}
      className={`py-3 rounded-lg border-2 font-medium transition ${selectedRole === Role.Faculty ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
    >
      Faculty
    </button>
  </div>
);

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, onRegister, onGoogleSignIn, onRegistrationSuccess }) => {
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset state when country changes
    setState('');
    setDistrict('');
  }, [country]);

  useEffect(() => {
    // Reset district when state changes
    setDistrict('');
  }, [state]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error: signInError } = await onGoogleSignIn();
    if (signInError) setError(signInError);
    setIsLoading(false);
  };

  const validateStep1 = () => {
    if (!name.trim() || !collegeName.trim() || !email.trim() || !password.trim()) {
      setError("All fields in this step are required.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setError('');
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (isLogin) {
      const result = await onLogin(email, password);
      if (result) setError(result);
    } else {
      if (!country || !state || !district) {
        setError("Please complete your location details.");
        setIsLoading(false);
        return;
      }
      const result = await onRegister(name, email, password, role, collegeName, country, state, district);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.email) {
        onRegistrationSuccess(result.email);
      }
    }
    setIsLoading(false);
  };

  const renderRegisterForm = () => {
    if (step === 1) {
      return (
        <>
          <div><label className="block text-sm font-medium mb-2">I am a...</label><RoleSelector selectedRole={role} onSelectRole={setRole} /></div>
          <div><label className="block text-sm font-medium mb-2">Full Name</label><Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" /></div>
          <div><label className="block text-sm font-medium mb-2">College/School Name</label><Input type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)} placeholder="e.g. State University" /></div>
          <div><label className="block text-sm font-medium mb-2">Email Address</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><label className="block text-sm font-medium mb-2">Password</label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="button" onClick={handleNextStep} className="w-full py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">Next: Location Details</button>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <div><label className="block text-sm font-medium mb-2">Country</label><Select value={country} onChange={e => setCountry(e.target.value)}><option value="">Select Country</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
          <div><label className="block text-sm font-medium mb-2">State / Province</label><Select value={state} onChange={e => setState(e.target.value)} disabled={!country}><option value="">Select State</option>{states[country]?.map(s => <option key={s} value={s}>{s}</option>)}</Select></div>
          <div><label className="block text-sm font-medium mb-2">District / County</label><Select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}><option value="">Select District</option>{districts[state]?.map(d => <option key={d} value={d}>{d}</option>)}</Select></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(1)} className="w-1/2 py-3 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold">Back</button>
            <button type="submit" disabled={isLoading} className="w-1/2 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">{isLoading ? 'Registering...' : 'Create Account'}</button>
          </div>
        </>
      );
    }
    return null;
  };
  
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <img src="/App-logo.png" alt="Quizly AI Logo" className="w-16 h-16 mx-auto mb-2" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{isLogin ? 'Welcome to Quizly AI' : 'Create Your Account'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isLogin ? (
            <>
              <div><label className="block text-sm font-medium mb-2">Email Address</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><label className="block text-sm font-medium mb-2">Password</label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400">{isLoading ? 'Logging in...' : 'Login'}</button>
            </>
          ) : (
            renderRegisterForm()
          )}
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300 dark:border-gray-600" />
          <span className="mx-4 text-xs text-gray-500 uppercase">Or</span>
          <hr className="flex-grow border-gray-300 dark:border-gray-600" />
        </div>

        <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.011 35.091 44 30.025 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
          Sign in with Google
        </button>
        
        <div className="text-center mt-6">
          <button onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }} className="text-sm text-blue-600 hover:underline">
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};