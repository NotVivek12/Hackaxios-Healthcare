'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Heart, Mail, Lock, User, ArrowRight, Loader2, Stethoscope, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

type UserRole = 'patient' | 'provider';

export default function SignUpPage() {
    const router = useRouter();
    const t = useTranslations('Auth');
    const { success } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        specialty: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!selectedRole) {
            setError('Please select a role');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (selectedRole === 'provider' && !formData.specialty) {
            setError('Please enter your specialty');
            setIsLoading(false);
            return;
        }

        try {
            localStorage.setItem('userSession', JSON.stringify({ email: formData.email, name: formData.name, role: selectedRole, timestamp: Date.now() }));

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: selectedRole,
                    specialty: selectedRole === 'provider' ? formData.specialty : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                localStorage.removeItem('userSession');
                throw new Error(data.error || 'Registration failed');
            }

            success('Account created successfully! Signing you in...');

            await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            setTimeout(() => {
                // Let middleware handle role-based redirect
                window.location.href = '/';
            }, 800);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed');
            localStorage.removeItem('userSession');
            setIsLoading(false);
        }
    };

    // Role Selection Screen
    if (!selectedRole) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
                <div className="absolute inset-0 opacity-60" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.25), transparent 40%)'
                }} />

                <div className="relative z-10 min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center mb-6">
                        <Heart className="h-12 w-12 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.45)]" />
                    </div>

                    <Card className="w-full max-w-lg bg-white/90 dark:bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(14,165,233,0.15)]">
                        <CardHeader className="space-y-1 text-slate-900 dark:text-white">
                            <CardTitle className="text-2xl font-bold text-center">
                                Join AI Healthcare
                            </CardTitle>
                            <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                                Choose how you want to use the platform
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <button
                                onClick={() => setSelectedRole('patient')}
                                className="w-full p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-400 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/20"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                                        <UserCircle className="h-8 w-8" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                                            Patient / User
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Book consultations with healthcare providers
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 ml-auto text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedRole('provider')}
                                className="w-full p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-400 transition-all duration-300 group hover:shadow-lg hover:shadow-violet-500/20"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white">
                                        <Stethoscope className="h-8 w-8" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                            Doctor / Consultant
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Provide healthcare consultations to patients
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 ml-auto text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        </CardContent>

                        <CardFooter className="flex justify-center">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link
                                    href="/auth/signin"
                                    className="font-medium text-cyan-600 hover:text-cyan-500"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
            <div className="absolute inset-0 opacity-60" style={{
                backgroundImage: selectedRole === 'provider' 
                    ? 'radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(168, 85, 247, 0.25), transparent 40%)'
                    : 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.25), transparent 40%)'
            }} />

            <div className="relative z-10 min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center mb-6">
                    {selectedRole === 'provider' ? (
                        <Stethoscope className="h-12 w-12 text-violet-300 drop-shadow-[0_0_20px_rgba(139,92,246,0.45)]" />
                    ) : (
                        <Heart className="h-12 w-12 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.45)]" />
                    )}
                </div>

                <Card className="w-full max-w-md bg-white/90 dark:bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(14,165,233,0.15)]">
                    <CardHeader className="space-y-1 text-slate-900 dark:text-white">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => setSelectedRole(null)}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                ← Back
                            </button>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                                selectedRole === 'provider' 
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300'
                            }`}>
                                {selectedRole === 'provider' ? 'Doctor' : 'Patient'}
                            </span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">
                            Create Your Account
                        </CardTitle>
                        <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                            {selectedRole === 'provider' 
                                ? 'Register as a healthcare provider'
                                : 'Sign up to book consultations'}
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
                            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="pl-10"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {selectedRole === 'provider' && (
                            <div className="space-y-2">
                                <label htmlFor="specialty" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Medical Specialty
                                </label>
                                <div className="relative">
                                    <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="specialty"
                                        name="specialty"
                                        type="text"
                                        placeholder="e.g., General Practitioner, Cardiologist"
                                        className="pl-10"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Create a password (min 8 characters)"
                                    className="pl-10"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className={`w-full group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                                selectedRole === 'provider'
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                            }`}
                            disabled={isLoading}
                        >
                            <span className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-all duration-300"></span>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create {selectedRole === 'provider' ? 'Doctor' : 'Patient'} Account
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </form>

                    <CardFooter className="flex justify-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link
                                href="/auth/signin"
                                className="font-medium text-cyan-600 hover:text-cyan-500"
                            >
                                Sign In
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
