'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Heart, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function SignUpPage() {
    const router = useRouter();
    const t = useTranslations('Auth');
    const { success } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            // Pre-store session information to make subsequent loads faster
            localStorage.setItem('userSession', JSON.stringify({ email: formData.email, name: formData.name, timestamp: Date.now() }));

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                localStorage.removeItem('userSession'); // Clear on error
                throw new Error(data.error || 'Registration failed');
            }

            // Show success message
            success('Account created successfully! Signing you in...');

            // Sign in the user after successful registration
            await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            // Set a small delay for feedback before redirecting
            setTimeout(() => {
                router.push('/dashboard');
            }, 800);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed');
            localStorage.removeItem('userSession'); // Clear on error
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center mb-6">
                <Heart className="h-12 w-12 text-blue-600" />
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {t('signUp.title')}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {t('signUp.subtitle')}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                {t('signUp.nameLabel')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder={t('signUp.namePlaceholder')}
                                    className="pl-10"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                {t('signUp.emailLabel')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder={t('signUp.emailPlaceholder')}
                                    className="pl-10"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                {t('signUp.passwordLabel')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder={t('signUp.passwordPlaceholder')}
                                    className="pl-10"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">
                                {t('signUp.confirmPasswordLabel')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder={t('signUp.confirmPasswordPlaceholder')}
                                    className="pl-10"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300" disabled={isLoading}>
                            <span className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-all duration-300"></span>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('signUp.creating')}
                                </>
                            ) : (
                                <>
                                    {t('signUp.submit')}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                                </>
                            )}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">
                                    {t('signUp.orContinue')}
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
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
                            {t('signUp.continueWithGoogle')}
                        </Button>
                    </CardContent>
                </form>

                <CardFooter className="flex justify-center">
                    <div className="text-sm text-gray-600">
                        {t('signUp.alreadyHaveAccount')}{' '}
                        <Link
                            href="/auth/signin"
                            className="font-medium text-blue-600 hover:text-blue-800"
                        >
                            {t('signUp.signIn')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
