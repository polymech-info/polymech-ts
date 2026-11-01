import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Defer navigation to next tick to avoid setState during render
          setTimeout(() => navigate("/app/tetris"), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse">
            404
          </h1>
          <p className="text-2xl text-gray-300">Oops! Page not found</p>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-gray-400">
            Don't worry, we'll redirect you to something fun...
          </p>

          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="text-6xl font-bold text-cyan-400 animate-bounce">
                {countdown}
              </div>
              <div className="absolute inset-0 text-6xl font-bold text-cyan-400 blur-xl opacity-50 animate-pulse">
                {countdown}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Redirecting to Tetris in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Return to Home
          </a>
          <a
            href="/app/tetris"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Play Tetris Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
