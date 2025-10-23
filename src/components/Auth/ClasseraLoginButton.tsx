import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { School, Loader, CircleAlert as AlertCircle, Info } from 'lucide-react';

interface ClasseraLoginButtonProps {
  returnUrl?: string;
  className?: string;
}

export const ClasseraLoginButton: React.FC<ClasseraLoginButtonProps> = ({
  returnUrl = '/home',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check if backend server is running (in development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const checkServer = async () => {
        try {
          const response = await fetch('http://localhost:3001/health', {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
          });
          if (response.ok) {
            setServerStatus('online');
          } else {
            setServerStatus('offline');
          }
        } catch (err) {
          console.log('[ClasseraLoginButton] Backend server not responding');
          setServerStatus('offline');
        }
      };

      checkServer();
      const interval = setInterval(checkServer, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    } else {
      setServerStatus('online'); // Assume online in production
    }
  }, []);

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if server is offline in development
    if (import.meta.env.DEV && serverStatus === 'offline') {
      setError('الخادم الخلفي غير متصل. يرجى تشغيل الخادم أولاً.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[ClasseraLoginButton] Initiating LTI 1.3 login');

      // Determine API URL based on environment
      const apiUrl = import.meta.env.DEV
        // ? 'http://localhost:3001/api/lti/login'
        ? 'http://104.250.236.79:3001/api/lti/login'
        : '/api/lti/login';

      // Build target link URI for LTI launch
      const targetLinkUri = import.meta.env.DEV
        // ? 'http://localhost:3001/api/lti/launch'
        ? 'http://104.250.236.79:3001/api/lti/launch'
        : `${window.location.origin}/api/lti/launch`;

      // Build LTI login initiation request parameters
      const params = new URLSearchParams({
        iss: 'https://partners.classera.com',
        client_id: '5ee30a16-c764-47d1-8314-effae92c950a',
        target_link_uri: targetLinkUri,
        login_hint: 'user_login',
        lti_deployment_id: '27'
      });

      const loginUrl = `${apiUrl}?${params.toString()}`;

      console.log('[ClasseraLoginButton] Redirecting to LTI login:', loginUrl);

      // Redirect to backend LTI login endpoint
      window.location.href = loginUrl;
    } catch (err) {
      console.error('[ClasseraLoginButton] Login failed:', err);
      setError('حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Server Status Warning (Development Only) */}
      {import.meta.env.DEV && serverStatus === 'offline' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm"
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">الخادم الخلفي غير متصل</div>
              <div className="text-xs">
                لتسجيل الدخول عبر Classera، يجب تشغيل الخادم الخلفي أولاً:
                <br />
                <code className="bg-amber-100 px-2 py-1 rounded mt-1 inline-block">npm run server:dev</code>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {import.meta.env.DEV && serverStatus === 'checking' && (
        <div className="text-xs text-gray-500 text-center">
          جاري التحقق من حالة الخادم...
        </div>
      )}

      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        onClick={handleLogin}
        disabled={isLoading || (import.meta.env.DEV && serverStatus === 'offline')}
        className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>جاري تسجيل الدخول عبر Classera...</span>
          </>
        ) : (
          <>
            <School className="w-5 h-5" />
            <span>تسجيل الدخول عبر Classera</span>
          </>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        </motion.div>
      )}

      {!error && !isLoading && serverStatus === 'online' && (
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <School className="w-3 h-3" />
            <span>تسجيل دخول آمن باستخدام LTI 1.3</span>
          </div>
          <div className="text-green-600 font-medium">
            سيتم إعادة توجيهك إلى Classera
          </div>
        </div>
      )}
    </div>
  );
};
