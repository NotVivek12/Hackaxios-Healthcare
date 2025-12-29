"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Link } from '@/navigation';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Heart, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('Auth');
    const { success } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Pre-store session information to make subsequent loads faster
            localStorage.setItem('userSession', JSON.stringify({ email, timestamp: Date.now() }));

            const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
                localStorage.removeItem('userSession'); // Clear on error
                return;
            }

            // Show success message
            success('Sign in successful! Redirecting to dashboard...');

            // Set a small delay for feedback before redirecting
            setTimeout(() => {
                // If callbackUrl is absolute, let the browser handle it; else use locale-aware router
                try {
                    const url = new URL(callbackUrl, window.location.origin);
                    const isSameOrigin = url.origin === window.location.origin;
                    if (isSameOrigin) {
                        router.push(url.pathname + url.search + url.hash);
                    } else {
                        window.location.href = url.toString();
                    }
                } catch {
                    router.push(callbackUrl || '/dashboard');
                }
            }, 500);
        } catch (err) {
            console.error('Sign in error:', err);
            setError('An unexpected error occurred.');
            setIsLoading(false);
            localStorage.removeItem('userSession'); // Clear on error
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
            <div className="absolute inset-0 opacity-60" style={{
                backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.25), transparent 40%)'
            }} />
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`
            }} />

            <div className="relative z-10 min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center mb-6">
                    <Heart className="h-12 w-12 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.45)]" />
                </div>

                <Card className="w-full max-w-md bg-white/90 dark:bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(14,165,233,0.15)]">
                    <CardHeader className="space-y-1 text-slate-900 dark:text-white">
                        <CardTitle className="text-2xl font-bold text-center">
                        {t('signIn.title')}
                    </CardTitle>
                        <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                        {t('signIn.subtitle')}
                    </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSignIn}>
                        <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                {t('signIn.emailLabel')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('signIn.emailPlaceholder')}
                                    className="pl-10 bg-white/90 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">
                                    {t('signIn.passwordLabel')}
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    {t('signIn.forgotPassword')}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={t('signIn.passwordPlaceholder')}
                                    className="pl-10 bg-white/90 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300" disabled={isLoading}>
                            <span className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-all duration-300"></span>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('signIn.signingIn')}
                                </>
                            ) : (
                                <>
                                    {t('signIn.submit')}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                                </>
                            )}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white/90 dark:bg-slate-900/80 px-2 text-gray-500 dark:text-slate-300">
                                    {t('signIn.orContinue')}
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60"
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 mr-2"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            {t('signIn.continueWithGoogle')}
                        </Button>
                        </CardContent>
                    </form>

                    <CardFooter className="flex justify-center">
                        <div className="text-sm text-gray-600 dark:text-slate-300">
                            {t('signIn.noAccount')}{' '}
                            <Link
                                href="/auth/signup"
                                className="font-medium text-blue-600 hover:text-blue-400"
                            >
                                {t('signIn.createAccount')}
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
