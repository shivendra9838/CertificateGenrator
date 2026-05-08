import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthForm } from './components/AuthForm';
import { CertificateForm } from './components/CertificateForm';
import { CertificateList } from './components/CertificateList';
import { Dashboard } from './pages/Dashboard';
import {
  clearAuthToken,
  getAuthToken,
  getCurrentUser,
  setAuthToken,
  signIn,
  signUp,
} from './services/api';
import type { SignInInput, SignUpInput, UserProfile } from './types/certificate';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(getAuthToken()));

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    let isMounted = true;

    getCurrentUser()
      .then((response) => {
        if (isMounted) {
          setUser(response.user);
        }
      })
      .catch(() => {
        clearAuthToken();
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignIn = async (input: SignInInput) => {
    const response = await signIn(input);
    setAuthToken(response.token);
    setUser(response.user);
  };

  const handleSignUp = async (input: SignUpInput) => {
    const response = await signUp(input);
    setAuthToken(response.token);
    setUser(response.user);
  };

  const handleSignOut = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>Certificate Generator</h1>
          </div>
          {user ? (
            <div className="header-actions">
              <nav aria-label="Primary navigation">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/certificates">Certificates</NavLink>
                <NavLink to="/generate">Generate</NavLink>
              </nav>
              <div className="user-chip">
                <span>{user.name}</span>
                <button className="secondary-button" type="button" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : null}
        </header>
        <main>
          {isCheckingSession ? (
            <section className="panel state-panel">Checking session</section>
          ) : user ? (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/certificates" element={<CertificateList />} />
              <Route path="/generate" element={<CertificateForm />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          ) : (
            <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
