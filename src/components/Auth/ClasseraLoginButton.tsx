import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { School, Loader, CircleAlert as AlertCircle } from 'lucide-react';

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

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      setError(null);

      console.log('[ClasseraLoginButton] Initiating LTI 1.3 login');

      // Determine API URL based on environment
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/lti/login'
        : '/api/lti/login';

      // Build target link URI for LTI launch
      const targetLinkUri = import.meta.env.DEV
        ? 'http://localhost:3001/api/lti/launch'
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
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        onClick={handleLogin}
        disabled={isLoading}
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

      {!error && !isLoading && (
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
