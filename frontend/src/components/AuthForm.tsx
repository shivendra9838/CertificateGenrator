import { FormEvent, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import type { SignInInput, SignUpInput } from '../types/certificate';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
  onSignIn: (input: SignInInput) => Promise<void>;
  onSignUp: (input: SignUpInput) => Promise<void>;
}

const initialSignUpForm: SignUpInput = {
  name: '',
  companyName: '',
  email: '',
  password: '',
};

const initialSignInForm: SignInInput = {
  email: '',
  password: '',
};

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signUpForm, setSignUpForm] = useState<SignUpInput>(initialSignUpForm);
  const [signInForm, setSignInForm] = useState<SignInInput>(initialSignInForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await onSignUp(signUpForm);
      } else {
        await onSignIn(signInForm);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="panel auth-panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          </div>
          <div className="segmented-control" aria-label="Authentication mode">
            <button
              type="button"
              className={!isSignUp ? 'active' : ''}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={isSignUp ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="form-grid auth-grid">
          {isSignUp ? (
            <>
              <label>
                <span>Name</span>
                <input
                  value={signUpForm.name}
                  onChange={(event) =>
                    setSignUpForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                <span>Your Company Name</span>
                <input
                  value={signUpForm.companyName}
                  onChange={(event) =>
                    setSignUpForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            </>
          ) : null}

          <label className="span-2">
            <span>Email ID</span>
            <input
              type="email"
              value={isSignUp ? signUpForm.email : signInForm.email}
              onChange={(event) => {
                const email = event.target.value;
                if (isSignUp) {
                  setSignUpForm((current) => ({ ...current, email }));
                } else {
                  setSignInForm((current) => ({ ...current, email }));
                }
              }}
              required
            />
          </label>

          <label className="span-2">
            <span>Password</span>
            <input
              type="password"
              minLength={isSignUp ? 8 : undefined}
              value={isSignUp ? signUpForm.password : signInForm.password}
              onChange={(event) => {
                const password = event.target.value;
                if (isSignUp) {
                  setSignUpForm((current) => ({ ...current, password }));
                } else {
                  setSignInForm((current) => ({ ...current, password }));
                }
              }}
              required
            />
          </label>
        </div>

        <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
