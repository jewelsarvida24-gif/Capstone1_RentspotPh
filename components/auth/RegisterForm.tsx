'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '@/app/auth/actions';

const PASSWORD_RULES = {
  length: { regex: /.{8,}/, label: 'At least 8 characters' },
  uppercase: { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  lowercase: { regex: /[a-z]/, label: 'At least one lowercase letter' },
  number: { regex: /[0-9]/, label: 'At least one number' },
  special: { regex: /[^A-Za-z0-9]/, label: 'At least one special character' },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (pwd: string) =>
  Object.fromEntries(
    Object.entries(PASSWORD_RULES).map(([key, { regex }]) => [
      key,
      regex.test(pwd),
    ])
  );

const isPasswordComplete = (requirements: Record<string, boolean>) =>
  Object.values(requirements).every(Boolean);

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
}

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon,
  onIconClick,
}: InputFieldProps) => (
  <div>
    <label className="block text-sm font-semibold text-neutral-700 mb-1">
      {label}
    </label>

    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pr-11"
      />

      {icon && (
        <button
          type="button"
          onClick={onIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
          tabIndex={-1}
        >
          {icon}
        </button>
      )}
    </div>

    {error && (
      <p className="text-xs text-red-500 mt-1 italic">
        {error}
      </p>
    )}
  </div>
);

interface RequirementItemProps {
  met: boolean;
  label: string;
}

const RequirementItem = ({ met, label }: RequirementItemProps) => (
  <p
    className={`text-xs transition-colors ${
      met ? 'text-green-600' : 'text-red-500'
    }`}
  >
    {met ? '✓' : '✕'} {label}
  </p>
);

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const passwordRequirements = validatePassword(password);
  const isPasswordValid = isPasswordComplete(passwordRequirements);
  const isEmailValid = EMAIL_REGEX.test(email);

  const isFormComplete =
    fullName.trim() !== '' &&
    isEmailValid &&
    isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!isFormComplete) {
      setServerError('Please complete all fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (result.error) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      router.push('/auth/login?registered=true');
    } catch (error: any) {
      setServerError(
        error.message || 'An unexpected error occurred.'
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm italic">
          {serverError}
        </div>
      )}

      {/* Full Name */}
      <InputField
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Coco Martin"
      />

      {/* Email */}
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nn@example.com"
        error={
          email.length > 0 && !isEmailValid
            ? 'Please enter a valid email address.'
            : undefined
        }
      />

      {/* Password */}
      <InputField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={
          showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )
        }
        onIconClick={() => setShowPassword(!showPassword)}
      />

      {/* Password requirements */}
      {password.length > 0 && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg space-y-1.5">
          <p className="text-xs font-semibold text-neutral-700 mb-2">
            Password requirements:
          </p>

          {Object.entries(PASSWORD_RULES).map(
            ([key, { label }]) => (
              <RequirementItem
                key={key}
                met={
                  passwordRequirements[
                    key as keyof typeof passwordRequirements
                  ]
                }
                label={label}
              />
            )
          )}
        </div>
      )}

      {/* Create Account */}
      <button
        type="submit"
        disabled={!isFormComplete || isLoading}
        className={
          isFormComplete && !isLoading
            ? 'btn-primary w-full flex items-center justify-center'
            : 'w-full bg-brand-200 text-white font-semibold px-5 py-2.5 rounded-lg cursor-not-allowed opacity-60'
        }
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

    </form>
  );
}