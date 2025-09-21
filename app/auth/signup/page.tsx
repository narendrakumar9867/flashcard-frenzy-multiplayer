"use client";
import { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from "next/image";

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    username: string;
}

export default function SignupPage() {
    const [formData, setFormData] = useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
        username: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    
    const supabase = createClientComponentClient();
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.username) {
            setError("Please fill in all required fields");
            return false;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        if (formData.username.length < 3) {
            setError("Username must be at least 3 characters long");
            return false;
        }

        return true;
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        display_name: formData.username
                    }
                }
            });

            if (error) {
                setError(error.message);
            } else if (data.user) {
                if (data.user.email_confirmed_at) {
                    setSuccess("Account created successfully! Redirecting...");
                    setTimeout(() => {
                        router.push('/dashboard');
                        router.refresh();
                    }, 2000);
                } else {
                    setSuccess("Account created! Please check your email to confirm your account before signing in.");
                }
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`
                }
            });

            if (error) {
                setError(error.message);
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        router.push('/auth/login');
    };

    return (
        <>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
                <h2 className="text-2xl font-bold mb-4 text-center py-3">Create your account</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleEmailSignup}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                />

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 border disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <p className="flex flex-col items-center">or</p>

                <div className="mt-4">
                    <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="w-full py-2 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-50 transition-colors gap-2"
                    >
                    <Image
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        width={10}
                        height={10}
                        className="w-5 h-5"
                    />
                    Sign up with Google
                    </button>
                </div>
                </form>

                <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                    onClick={handleLoginRedirect}
                    className="text-black hover:underline"
                    >
                    Sign in here
                    </button>
                </p>
                </div>
            </div>
            </div>
        </>
    )
}