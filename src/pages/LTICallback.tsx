import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LTICallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const token = searchParams.get('token');
        const role = searchParams.get('role');

        if (!token) {
          throw new Error('Missing authentication token');
        }

        await signInWithCustomToken(auth, token);

        localStorage.setItem('ltiAuthenticated', 'true');
        if (role) {
          localStorage.setItem('ltiRole', role);
        }

        const redirectPath = role === 'teacher' || role === 'admin' ? '/home' : '/projects';
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('LTI authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    authenticateUser();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authenticating with Classera</h2>
          <p className="text-gray-600">Please wait while we sign you in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Authentication Failed</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
