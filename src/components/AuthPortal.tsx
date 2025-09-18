import React, { useState } from 'react';
import { Role } from '../types';

interface AuthPortalProps {
  onLogin: (email: string, pass: string) => Promise<string | null>;
  onRegister: (name: string, email: string, pass: string, role: Role) => Promise<string | null>;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
     <input {...props} className={`w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
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

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const resetFormState = () => {
    setError('');
    setMessage('');
    setFormErrors({ name: '', email: '', password: '' });
    setTouched({ name: false, email: false, password: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name: fieldName, value } = e.target;

    if (fieldName === 'name') setName(value);
    else if (fieldName === 'email') setEmail(value);
    else if (fieldName === 'password') setPassword(value);
    
    if (error) setError('');
    if (message) setMessage('');

    let errorMessage = '';
    switch(fieldName) {
      case 'name':
        if (!isLogin && !value.trim()) errorMessage = 'Full name is required.';
        break;
      case 'email':
        if (value && !/\S+@\S+\.\S+/.test(value)) errorMessage = 'Please enter a valid email address.';
        break;
      case 'password':
        if (value && value.length < 6) errorMessage = 'Password must be at least 6 characters.';
        break;
    }
    setFormErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setTouched({ name: true, email: true, password: true });

    const nameError = !isLogin && !name.trim() ? 'Full name is required.' : '';
    const emailError = !email.trim() ? 'Email is required.' : !/\S+@\S+\.\S+/.test(email) ? 'Please enter a valid email address.' : '';
    const passwordError = !password.trim() ? 'Password is required.' : password.length < 6 ? 'Password must be at least 6 characters.' : '';
    
    const newErrors = { name: nameError, email: emailError, password: passwordError };
    setFormErrors(newErrors);

    if (Object.values(newErrors).some(err => err)) {
        return;
    }

    setIsLoading(true);

    let result = null;
    if (isLogin) {
      result = await onLogin(email, password);
    } else {
      result = await onRegister(name, email, password, role);
      if (!result) {
        setMessage("Registration successful! Please check your email to verify your account before logging in.");
        setIsLogin(true);
        setName('');
        setEmail('');
        setPassword('');
      }
    }

    if (result) {
        setError(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => { setIsLogin(true); resetFormState(); }} className={`w-1/2 py-3 font-semibold ${isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            Login
          </button>
          <button onClick={() => { setIsLogin(false); resetFormState(); }} className={`w-1/2 py-3 font-semibold ${!isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            Register
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
                  <RoleSelector selectedRole={role} onSelectRole={setRole} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <Input type="text" name="name" value={name} onChange={handleInputChange} onBlur={handleBlur} required placeholder="e.g. Jane Doe" />
                {touched.name && formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <Input type="email" name="email" value={email} onChange={handleInputChange} onBlur={handleBlur} required placeholder="you@example.com" />
            {touched.email && formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <Input type="password" name="password" value={password} onChange={handleInputChange} onBlur={handleBlur} required placeholder="••••••••" />
            {touched.password && formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};