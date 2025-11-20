"use client";

import React, { useEffect, useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost");

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogin = () => {
    setIsLoading(true);

    if (isDev) {
      // In development, redirect to mock OAuth page
      const redirectUri = `${window.location.origin}/api/auth/callback`;
      window.location.href = `/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
    } else {
      // In production, redirect to OAuth login
      window.location.href = "/api/auth/login";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-fadeIn">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-3 text-gray-900">
          需要登入
        </h2>
        <p className="text-center text-gray-600 mb-8">
          請先登入以繼續使用投票系統
        </p>

        {/* Description */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-primary-900">
                <strong>安全提示：</strong>
                {isDev ? (
                  <>您目前處於開發環境，將使用模擬 OAuth 登入頁面</>
                ) : (
                  <>您將被重定向到安全的 OAuth 認證頁面進行身份驗證</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              登入中...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              前往登入
            </span>
          )}
        </button>

        {/* Cancel Button (optional) */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-3 text-gray-600 hover:text-gray-900 font-medium py-2 px-6 rounded-xl transition"
          >
            取消
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
