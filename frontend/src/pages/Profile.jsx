import { useEffect, useState } from "react";
import api from "../api/axios";

import {
    User,
    Mail,
    Shield,
    Building2,
    RefreshCw,
    CircleX,
    BadgeCheck
} from "lucide-react";


function Profile() {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const getProfile = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await api.get(
                "/users/me"
            );

            setUser(response.data);

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "Profil bilgileri alınamadı."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        getProfile();

    }, []);


    const getRoleText = (role) => {

        if (
            String(role).toLowerCase() === "admin"
        ) {

            return "Yönetici";

        }

        return "Personel";

    };


    if (loading) {

        return (

            <div className="flex min-h-[400px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={22}
                        className="animate-spin"
                    />

                    <span>
                        Profil bilgileri yükleniyor...
                    </span>

                </div>

            </div>

        );

    }


    if (error) {

        return (

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

                <div className="flex items-center gap-3">

                    <CircleX size={22} />

                    <span>
                        {error}
                    </span>

                </div>

            </div>

        );

    }


    return (

        <div className="space-y-8">


            {/* BAŞLIK */}

            <div>

                <h1 className="text-3xl font-bold text-gray-800">

                    Profilim

                </h1>

                <p className="mt-2 text-gray-500">

                    Kullanıcı ve çalışma bilgileriniz

                </p>

            </div>


            {/* PROFİL KARTI */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">


                <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 text-white">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">

                            {user?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "K"
                            }

                        </div>


                        <div>

                            <h2 className="text-2xl font-bold">

                                {user?.name} {user?.surname}

                            </h2>

                            <div className="mt-2 flex items-center gap-2 text-blue-100">

                                <BadgeCheck size={18} />

                                <span>

                                    {getRoleText(
                                        user?.role
                                    )}

                                </span>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">


                    {/* AD SOYAD */}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                <User size={22} />

                            </div>

                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    Ad Soyad

                                </p>

                                <p className="mt-1 font-bold text-gray-800">

                                    {user?.name} {user?.surname}

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* E-POSTA */}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">

                                <Mail size={22} />

                            </div>

                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    E-posta

                                </p>

                                <p className="mt-1 font-bold text-gray-800">

                                    {user?.email || "-"}

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ROL */}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">

                                <Shield size={22} />

                            </div>

                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    Kullanıcı Rolü

                                </p>

                                <p className="mt-1 font-bold text-gray-800">

                                    {getRoleText(
                                        user?.role
                                    )}

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* İŞ YERİ */}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">

                                <Building2 size={22} />

                            </div>

                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    Çalıştığı İş Yeri

                                </p>

                                <p className="mt-1 font-bold text-gray-800">

                                    {user?.workplace_name ||
                                        "İş yeri atanmamış"
                                    }

                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="border-t border-gray-100 px-6 py-4">

                    <p className="text-sm text-gray-500">

                        Kullanıcı numarası:{" "}

                        <span className="font-semibold text-gray-700">

                            {user?.id}

                        </span>

                    </p>

                </div>

            </div>

        </div>

    );

}


export default Profile;