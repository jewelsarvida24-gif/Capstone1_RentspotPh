"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

import { registerUser } from "@/app/auth/action";

const PASSWORD_RULES = {
  length: { regex: /.{8,}/, label: "At least 8 characters" },
  uppercase: { regex: /[A-Z]/, label: "At least one uppercase letter" },
  lowercase: { regex: /[a-z]/, label: "At least one lowercase letter" },
  number: { regex: /[0-9]/, label: "At least one number" },
  special: {
    regex: /[^A-Za-z0-9]/,
    label: "At least one special character",
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^(09|\+639)\d{9}$/;

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
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon,
  onIconClick,
}: InputFieldProps) => (
  <div>
    <label className="mb-1 block text-sm font-semibold text-neutral-700">
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600"
          tabIndex={-1}
        >
          {icon}
        </button>
      )}
    </div>

    {error && (
      <p className="mt-1 text-xs italic text-red-500">
        {error}
      </p>
    )}
  </div>
);

interface RequirementItemProps {
  met: boolean;
  label: string;
}

const RequirementItem = ({
  met,
  label,
}: RequirementItemProps) => (
  <p
    className={`text-xs transition-colors ${
      met ? "text-green-600" : "text-red-500"
    }`}
  >
    {met ? "✓" : "✕"} {label}
  </p>
);

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordRequirements = validatePassword(password);
  const isPasswordValid = isPasswordComplete(passwordRequirements);

  const isEmailValid = EMAIL_REGEX.test(email);
  const isMobileValid = MOBILE_REGEX.test(mobileNumber);

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const isFormComplete =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isEmailValid &&
    isMobileValid &&
    isPasswordValid &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setServerError("");

    if (!isFormComplete) {
      setServerError("Please complete all fields correctly.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        confirmPassword,
      });

      if (result.error) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch (error: any) {
      setServerError(
        error.message || "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm italic text-red-700">
          {serverError}
        </div>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* First Name */}
        <InputField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Coco"
        />

        {/* Last Name */}
        <InputField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Martin"
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
              ? "Please enter a valid email address."
              : undefined
          }
        />

        {/* Mobile Number */}
        <InputField
          label="Mobile Number"
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="09XXXXXXXXX"
          error={
            mobileNumber.length > 0 && !isMobileValid
              ? "Please enter a valid PH mobile number (e.g. 09XXXXXXXXX)."
              : undefined
          }
        />
      </div>

      {/* Password */}
      <InputField
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={
          showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )
        }
        onIconClick={() => setShowPassword(!showPassword)}
      />

      {/* Password Requirements */}
      {password.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-neutral-50 p-3">
          <p className="mb-2 text-xs font-semibold text-neutral-700">
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

      {/* Confirm Password */}
      <InputField
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        icon={
          showConfirmPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )
        }
        onIconClick={() =>
          setShowConfirmPassword(!showConfirmPassword)
        }
        error={
          confirmPassword.length > 0 && !passwordsMatch
            ? "Passwords do not match."
            : undefined
        }
      />

      {/* Create Account */}
      <button
        type="submit"
        disabled={!isFormComplete || isLoading}
        className={
          isFormComplete && !isLoading
            ? "btn-primary flex w-full items-center justify-center"
            : "w-full cursor-not-allowed rounded-lg bg-brand-200 px-5 py-2.5 font-semibold text-white opacity-60"
        }
      >
        {isLoading
          ? "Creating Account..."
          : "Create Account"}
      </button>

    </form>
  );
}