import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import orionLogo from "/orion_logo.png";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { decodeJWT } from "@/lib/jwt";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, login } = useAuth();
  const { toast } = useToast();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Check if user has already been onboarded
  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const onboardedFlag = localStorage.getItem('orion_onboarded');
        if (onboardedFlag === 'true') {
          setHasOnboarded(true);
        }
      } catch (error) {
        console.warn('[Welcome] Failed to check onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Memoize user display name
  const userDisplayName = useMemo(() => {
    if (!user?.email) return null;
    return user.email;
  }, [user?.email]);

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/v1/auth/onboard');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[Welcome] Onboarding successful');

      // Mark as onboarded in localStorage
      try {
        localStorage.setItem('orion_onboarded', 'true');
        setHasOnboarded(true);
      } catch (error) {
        console.warn('[Welcome] Failed to save onboarding status:', error);
      }

      // If server returned a new token, update auth context
      if (data.token) {
        console.log('[Welcome] Received updated token from server');
        login(data.token);

        // Use JWT utility to safely decode token
        const payload = decodeJWT(data.token);
        if (payload) {
          console.log('[Welcome] Updated token userId:', payload.userId);
        }

        toast({
          title: "Authentication updated",
          description: "Your session has been refreshed with your account.",
        });
      }

      setLocation("/projects");
    },
    onError: (error: any) => {
      console.error('[Welcome] Onboarding failed:', error);

      // Enhanced error handling with specific error types
      const errorMessage = error?.message || String(error);
      const statusCode = error?.status || error?.statusCode;

      let title = "Onboarding failed";
      let description = "Please try again or contact support.";

      if (statusCode === 401 || statusCode === 403 || errorMessage.includes('Authentication required')) {
        title = "Session expired";
        description = "Your authentication session has expired. Please refresh the page to continue.";
      } else if (statusCode === 500) {
        title = "Server error";
        description = "Our servers are experiencing issues. Please try again in a moment.";
      } else if (statusCode === 429) {
        title = "Too many requests";
        description = "Please wait a moment before trying again.";
      } else if (!navigator.onLine) {
        title = "No internet connection";
        description = "Please check your connection and try again.";
      }

      toast({
        title,
        description,
        variant: "destructive",
      });

      setIsOnboarding(false);
    },
  });

  // Optimize handleEnter with useCallback
  const handleEnter = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please authenticate to continue.",
        variant: "destructive",
      });
      return;
    }

    // Skip onboarding API call if already onboarded
    if (hasOnboarded) {
      console.log('[Welcome] User already onboarded, skipping API call');
      setLocation("/projects");
      return;
    }

    setIsOnboarding(true);
    onboardMutation.mutate();
  }, [isAuthenticated, hasOnboarded, toast, onboardMutation, setLocation]);

  // Memoize button text
  const buttonText = useMemo(() => {
    if (isOnboarding) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Setting up...
        </span>
      );
    }
    return hasOnboarded ? "Continue" : "Get Started";
  }, [isOnboarding, hasOnboarded]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] flex flex-col items-center justify-center font-['SF_Pro_Display','Helvetica_Neue',Arial,sans-serif] text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>

      {/* Main content with entrance animation */}
      <div className="flex flex-col items-center text-center max-w-5xl px-8 py-20 relative z-10 animate-fade-in-up">
        {/* ORION Logo - Increased size with hover effect */}
        <div className="mb-12 transition-transform duration-500 hover:scale-105 hover:-translate-y-2">
          <img
            src={orionLogo}
            alt="ORION"
            className="w-48 h-48 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Main Title - Enhanced typography */}
        <h1 className="text-7xl md:text-8xl font-semibold tracking-tight text-white mb-6 leading-tight">
          ORION
        </h1>

        {/* Subtitle - Refined hierarchy */}
        <h2 className="text-xl md:text-2xl font-normal text-white/60 mb-16 max-w-2xl leading-relaxed">
          AI-powered Strategic Foresight & Innovation
        </h2>

        {/* Auth Status - More subtle */}
        {isAuthenticated && userDisplayName && (
          <p className="text-sm text-white/40 mb-8">
            Welcome, {userDisplayName}
          </p>
        )}

        {/* Enter Button - Apple-style prominent CTA */}
        <Button
          onClick={handleEnter}
          disabled={!isAuthenticated || isOnboarding}
          className="
            bg-white text-black
            hover:bg-white/90
            font-semibold text-lg
            px-12 py-4
            rounded-full
            transition-all duration-300
            shadow-2xl shadow-white/20
            hover:shadow-white/30
            hover:scale-105
            active:scale-[0.95]
            disabled:opacity-40
            disabled:cursor-not-allowed
            disabled:hover:scale-100
            min-w-[200px]
          "
          data-testid="button-enter"
        >
          {buttonText}
        </Button>

        {/* Development Login Link - Hidden in production */}
        {!isAuthenticated && process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <a
              href="/login"
              className="text-sm text-white/40 hover:text-white/60 transition-colors underline"
            >
              Development Login
            </a>
          </div>
        )}
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
