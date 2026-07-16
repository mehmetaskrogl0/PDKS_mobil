import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/axios";


function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {

        e.preventDefault();

        if (!email.trim() || !password.trim()) {

            toast.error(
                "E-posta ve şifre alanlarını doldurun."
            );

            return;

        }

        setLoading(true);

        try {

            const response = await api.post(
                "/auth/login",
                {
                    email: email.trim(),
                    password
                }
            );

            const accessToken =
                response.data?.access_token;

            if (!accessToken) {

                throw new Error(
                    "Sunucudan erişim anahtarı alınamadı."
                );

            }

            localStorage.setItem(
                "token",
                accessToken
            );

            toast.success(
                "Giriş başarılı!"
            );

            navigate(
                "/dashboard",
                {
                    replace: true
                }
            );

        } catch (error) {

            console.error(
                "Giriş hatası:",
                error
            );

            localStorage.removeItem(
                "token"
            );

            toast.error(
                error.response?.data?.detail ||
                error.message ||
                "Giriş başarısız!"
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center px-4">

            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8">

                <div className="text-center mb-8">

                    <h1 className="text-5xl font-bold text-blue-700">
                        PDKS
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Personel Devam Kontrol Sistemi
                    </p>

                </div>


                <form onSubmit={handleLogin}>

                    <div className="relative mb-5">

                        <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />

                        <input
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            type="email"
                            placeholder="E-posta adresi"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="email"
                            required
                            disabled={loading}
                        />

                    </div>


                    <div className="relative mb-6">

                        <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />

                        <input
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            type="password"
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {
                            loading
                                ? "Giriş yapılıyor..."
                                : "Giriş Yap"
                        }
                    </button>

                </form>


                <p className="text-center text-gray-400 text-sm mt-6">
                    © 2026 PDKS Sistemi
                </p>

            </div>

        </div>

    );

}


export default Login;