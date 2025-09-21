"use client";
import { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from "next/image";

interface FormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [formData, setFormData] = useState<FormData>({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    
    const supabase = createClientComponentClient();
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");

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

    const handleSignUpRedirect = () => {
        router.push('/auth/signup');
    };

    return (
        <>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
                <h2 className="text-2xl font-bold mb-4 text-center py-3">Sign in to your account</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleEmailLogin}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 border disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Signing in...' : 'Submit'}
                </button>

                <p className="flex flex-col items-center">or</p>

                <div className="mt-4">
                    <button
                    type="button"
                    onClick={handleGoogleLogin}
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
                    Sign in with Google
                    </button>
                </div>
                </form>

                <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                    Do not have an account?{' '}
                    <button
                    onClick={handleSignUpRedirect}
                    className="text-black hover:underline"
                    >
                    Sign up here
                    </button>
                </p>
                </div>
            </div>
            </div>
        </>
    )
}
