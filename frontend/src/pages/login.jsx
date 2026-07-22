import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Mail,
    Lock,
    LoaderCircle
} from "lucide-react";

import toast from "react-hot-toast";

import api from "../api/axios";


function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (event) => {

        event.preventDefault();

        const normalizedEmail =
            email.trim();


        if (
            !normalizedEmail ||
            !password.trim()
        ) {

            toast.error(
                "E-posta ve şifre alanlarını doldurun."
            );

            return;

        }


        setLoading(true);


        try {

            localStorage.clear();


            const loginResponse = await api.post(
                "/auth/login",
                {
                    email: normalizedEmail,
                    password
                }
            );


            const accessToken =
                loginResponse.data?.access_token;


            if (!accessToken) {

                throw new Error(
                    "Sunucudan token alınamadı."
                );

            }


            // Önce token kaydediliyor.
            // Böylece /users/me isteğine otomatik eklenir.
            localStorage.setItem(
                "token",
                accessToken
            );


            // Kullanıcı ve rol bilgisi doğrudan backend'den alınır.
            const userResponse = await api.get(
                "/users/me"
            );


            const user =
                userResponse.data;


            const role = String(
                user?.role || "employee"
            )
                .trim()
                .toLowerCase();


            const storedUser = {
                ...user,
                role
            };


            localStorage.setItem(
                "role",
                role
            );


            localStorage.setItem(
                "user",
                JSON.stringify(storedUser)
            );


            toast.success(
                role === "admin"
                    ? "Yönetici girişi başarılı!"
                    : "Giriş başarılı!"
            );


            if (role === "admin") {

                navigate(
                    "/admin/dashboard",
                    {
                        replace: true
                    }
                );

            } else {

                navigate(
                    "/dashboard",
                    {
                        replace: true
                    }
                );

            }

        } catch (error) {

            console.error(
                "Giriş hatası:",
                error
            );


            localStorage.clear();


            toast.error(
                error.response?.data?.detail ||
                error.message ||
                "Giriş işlemi başarısız."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div
            className="
                flex min-h-screen
                items-center
                justify-center
                bg-gradient-to-br
                from-blue-700
                to-blue-950
                px-4
            "
        >

            <div
                className="
                    w-full
                    max-w-sm
                    rounded-2xl
                    bg-white
                    p-8
                    shadow-2xl
                "
            >

                <div className="mb-8 text-center">

                    <h1
                        className="
                            text-5xl
                            font-bold
                            text-blue-700
                        "
                    >
                        PDKS
                    </h1>

                    <p className="mt-2 text-gray-500">

                        Personel Devam Kontrol Sistemi

                    </p>

                </div>


                <form onSubmit={handleLogin}>

                    <div className="relative mb-5">

                        <Mail
                            size={20}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
                        />

                        <input
                            type="email"
                            placeholder="E-posta adresi"
                            value={email}
                            onChange={(event) => {

                                setEmail(
                                    event.target.value
                                );

                            }}
                            autoComplete="email"
                            disabled={loading}
                            required
                            className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                p-3
                                pl-10
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                                disabled:bg-gray-100
                            "
                        />

                    </div>


                    <div className="relative mb-6">

                        <Lock
                            size={20}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
                        />

                        <input
                            type="password"
                            placeholder="Şifre"
                            value={password}
                            onChange={(event) => {

                                setPassword(
                                    event.target.value
                                );

                            }}
                            autoComplete="current-password"
                            disabled={loading}
                            required
                            className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                p-3
                                pl-10
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                                disabled:bg-gray-100
                            "
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            flex w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-blue-700
                            py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-800
                            disabled:cursor-not-allowed
                            disabled:bg-blue-400
                        "
                    >

                        {
                            loading
                                ? (
                                    <>
                                        <LoaderCircle
                                            size={20}
                                            className="animate-spin"
                                        />

                                        Giriş yapılıyor...
                                    </>
                                )
                                : "Giriş Yap"
                        }

                    </button>

                </form>


                <p
                    className="
                        mt-6
                        text-center
                        text-sm
                        text-gray-400
                    "
                >
                    © 2026 PDKS Sistemi
                </p>

            </div>

        </div>

    );

}


export default Login;