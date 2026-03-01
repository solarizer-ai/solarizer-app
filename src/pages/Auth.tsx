import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HeroBackground from '@/components/HeroBackground';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import solarizerLogo from "@/assets/solarizer-logo.png";

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine mode from URL path
  const isSignupRoute = location.pathname === '/signup';
  const [isLogin, setIsLogin] = useState(!isSignupRoute);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  const triggerTermsWarning = () => {
    setShowTermsWarning(true);
    toast({
      variant: 'destructive',
      title: 'Terms required',
      description: 'Please accept the Terms of Service and Privacy Policy to continue.',
    });
    // Auto-clear after animation
    setTimeout(() => setShowTermsWarning(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    if (!isLogin && !acceptedTerms) {
      triggerTermsWarning();
      return;
    }
    
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Google sign-in failed',
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLogin && !acceptedTerms) {
      triggerTermsWarning();
      return;
    }
    
    setIsAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Apple sign-in failed',
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Apple sign-in failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Sync isLogin state with URL
  useEffect(() => {
    setIsLogin(location.pathname !== '/signup');
  }, [location.pathname]);

  // Redirect if already logged in
  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check terms acceptance for signup
    if (!isLogin && !acceptedTerms) {
      triggerTermsWarning();
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              variant: 'destructive',
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Login failed',
              description: error.message,
            });
          }
        } else {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: 'This email is already registered. Please sign in instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Solarizer. You are now signed in.',
          });
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMode = () => {
    setErrors({});
    setAcceptedTerms(false);
    setShowTermsWarning(false);
    navigate(isLogin ? '/signup' : '/login', { replace: true });
  };

  // Check if signup buttons should be disabled
  const isSignupDisabled = !isLogin && !acceptedTerms;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── Left Panel (Desktop Only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden flex-col items-center justify-center pb-20">
        <HeroBackground />

        <div className="relative z-20 flex flex-col items-center gap-6 px-12">
          <Link to="/">
            <img src={solarizerLogo} alt="Solarizer" className="w-16 h-16 rounded-xl" decoding="sync" />
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-gradient">Solarizer</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-[260px]">
              AI-powered smart contract security analysis
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="terminal-pill">vulnerability detection</span>
            <span className="terminal-pill">multi-model validation</span>
            <span className="terminal-pill">automated reporting</span>
          </div>
        </div>

        {/* Security badge at bottom */}
        <div className="absolute z-20 bottom-8 flex items-center gap-2 text-xs text-muted-foreground/60">
          <Shield className="w-3.5 h-3.5 text-primary/50" />
          <span className="font-mono tracking-wide">Encrypted authentication</span>
        </div>

        {/* Gradient divider on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/30 to-transparent" />
      </div>

      {/* ── Mobile Header (Below lg) ── */}
      <div className="flex lg:hidden flex-col items-center pt-10 pb-6 relative">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Link to="/">
            <img src={solarizerLogo} alt="Solarizer" className="w-12 h-12 rounded-xl" decoding="sync" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-gradient">Solarizer</h1>
          <p className="text-xs text-muted-foreground">AI-powered smart contract security</p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? 'Sign in to access your security dashboard'
                : 'Start securing your smart contracts today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Terms checkbox — above all buttons on signup */}
            {!isLogin && (
              <div className={`p-3 rounded-lg bg-foreground/[0.02] border transition-all duration-300 ${
                showTermsWarning ? 'border-primary/50' : 'border-border/20'
              }`}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(!!checked);
                      setShowTermsWarning(false);
                    }}
                    className={`mt-0.5 transition-all duration-300 ${
                      showTermsWarning
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse'
                        : ''
                    }`}
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm text-muted-foreground cursor-pointer leading-snug"
                  >
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
            )}

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-foreground/[0.03] border-border/30 focus-visible:ring-primary/30 focus-visible:border-primary/40"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 font-mono text-[11px] tracking-wider text-muted-foreground/50 uppercase">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Display Name (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 bg-foreground/[0.03] border-border/30 placeholder:text-muted-foreground/30 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`h-11 bg-foreground/[0.03] border-border/30 placeholder:text-muted-foreground/30 focus-visible:ring-primary/30 focus-visible:border-primary/40 ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`h-11 bg-foreground/[0.03] border-border/30 placeholder:text-muted-foreground/30 focus-visible:ring-primary/30 focus-visible:border-primary/40 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Remember Me (login only) */}
            {isLogin && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>

          {/* Mode toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-primary font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-primary font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>

          {/* Legal footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground/50">
            {isLogin ? (
              <>By signing in, you agree to our <Link to="/terms" className="text-primary/70 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary/70 hover:underline">Privacy Policy</Link>.</>
            ) : (
              <>Please review and accept our terms above to create your account.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
