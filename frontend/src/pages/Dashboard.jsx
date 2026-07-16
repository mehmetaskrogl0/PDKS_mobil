import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";

import {
    User,
    Clock,
    CalendarCheck,
    LogIn,
    LogOut,
    Timer,
    Building2,
    Users,
    AlertCircle
} from "lucide-react";


function formatTime(date) {

    if (!date) {
        return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleTimeString(
        "tr-TR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function Dashboard() {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    useEffect(() => {

        let isMounted = true;


        const getDashboard = async () => {

            try {

                setLoading(true);
                setErrorMessage("");

                const response = await api.get(
                    "/dashboard/"
                );

                if (isMounted) {

                    setData(response.data);

                }

            } catch (error) {

                console.error(
                    "Dashboard yüklenemedi:",
                    error.response?.data ||
                    error.message
                );

                if (isMounted) {

                    const message =
                        error.response?.data?.detail ||
                        "Dashboard bilgileri yüklenemedi.";

                    setErrorMessage(message);

                    if (
                        error.response?.status !== 401
                    ) {

                        toast.error(message);

                    }

                }

            } finally {

                if (isMounted) {

                    setLoading(false);

                }

            }

        };


        getDashboard();


        return () => {

            isMounted = false;

        };

    }, []);


    if (loading) {

        return (

            <div className="flex min-h-[60vh] items-center justify-center">

                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />

                    <p className="text-gray-500">

                        Dashboard yükleniyor...

                    </p>

                </div>

            </div>

        );

    }


    if (errorMessage || !data) {

        return (

            <div className="flex min-h-[60vh] items-center justify-center">

                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">

                    <AlertCircle
                        size={48}
                        className="mx-auto mb-4 text-red-500"
                    />

                    <h2 className="mb-2 text-xl font-bold text-gray-800">

                        Dashboard yüklenemedi

                    </h2>

                    <p className="mb-6 text-gray-500">

                        {
                            errorMessage ||
                            "Sunucudan veri alınamadı."
                        }

                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
                    >

                        Tekrar Dene

                    </button>

                </div>

            </div>

        );

    }


    const hasCheckIn = Boolean(
        data.check_in
    );

    const statusColor = hasCheckIn
        ? (
            data.check_out
                ? "text-blue-600"
                : "text-green-600"
        )
        : "text-orange-600";

    const statusBackground = hasCheckIn
        ? (
            data.check_out
                ? "bg-blue-100"
                : "bg-green-100"
        )
        : "bg-orange-100";


    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-3xl font-bold text-gray-800">

                    PDKS Kontrol Paneli

                </h1>

                <p className="mt-2 text-gray-500">

                    Personel devam ve çalışma bilgileri

                </p>

            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div className="rounded-xl bg-blue-100 p-3">

                        <User
                            size={32}
                            className="text-blue-600"
                        />

                    </div>

                    <div className="min-w-0">

                        <p className="text-gray-500">

                            Personel

                        </p>

                        <h2 className="truncate text-xl font-bold text-gray-800">

                            {data.user || "-"}

                        </h2>

                    </div>

                </div>


                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div
                        className={
                            `${statusBackground} rounded-xl p-3`
                        }
                    >

                        <Clock
                            size={32}
                            className={statusColor}
                        />

                    </div>

                    <div className="min-w-0">

                        <p className="text-gray-500">

                            Durum

                        </p>

                        <h2
                            className={
                                `text-xl font-bold ${statusColor}`
                            }
                        >

                            {
                                data.status ||
                                "Durum bilinmiyor"
                            }

                        </h2>

                    </div>

                </div>


                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div className="rounded-xl bg-purple-100 p-3">

                        <CalendarCheck
                            size={32}
                            className="text-purple-600"
                        />

                    </div>

                    <div>

                        <p className="text-gray-500">

                            Onaylı İzin

                        </p>

                        <h2 className="text-xl font-bold text-gray-800">

                            {
                                data.approved_leave_count ?? 0
                            } Gün

                        </h2>

                    </div>

                </div>


                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div className="rounded-xl bg-orange-100 p-3">

                        <Timer
                            size={32}
                            className="text-orange-600"
                        />

                    </div>

                    <div>

                        <p className="text-gray-500">

                            Çalışma Süresi

                        </p>

                        <h2 className="text-xl font-bold text-gray-800">

                            {
                                hasCheckIn
                                    ? data.work_duration
                                    : "Beklemede"
                            }

                        </h2>

                    </div>

                </div>

            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div className="rounded-xl bg-cyan-100 p-3">

                        <Building2
                            size={30}
                            className="text-cyan-600"
                        />

                    </div>

                    <div>

                        <p className="text-gray-500">

                            İş Yeri

                        </p>

                        <h2 className="text-lg font-bold text-gray-800">

                            {
                                data.workplace_name ||
                                "Atanmamış"
                            }

                        </h2>

                    </div>

                </div>


                <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow">

                    <div className="rounded-xl bg-indigo-100 p-3">

                        <Users
                            size={30}
                            className="text-indigo-600"
                        />

                    </div>

                    <div>

                        <p className="text-gray-500">

                            Ekip

                        </p>

                        <h2 className="text-lg font-bold text-gray-800">

                            {
                                data.team_name ||
                                "Ekibe atanmamış"
                            }

                        </h2>

                    </div>

                </div>

            </div>


            <div className="rounded-2xl bg-white p-8 shadow">

                <h2 className="mb-6 text-xl font-bold text-gray-800">

                    Bugünkü Mesai

                </h2>


                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                    <div className="flex items-center gap-4">

                        <LogIn
                            size={35}
                            className="text-green-600"
                        />

                        <div>

                            <p className="text-gray-500">

                                Giriş

                            </p>

                            <p className="text-lg font-bold text-gray-800">

                                {
                                    formatTime(
                                        data.check_in
                                    )
                                }

                            </p>

                        </div>

                    </div>


                    <div className="flex items-center gap-4">

                        <LogOut
                            size={35}
                            className="text-red-600"
                        />

                        <div>

                            <p className="text-gray-500">

                                Çıkış

                            </p>

                            <p className="text-lg font-bold text-gray-800">

                                {
                                    hasCheckIn
                                        ? (
                                            data.check_out
                                                ? formatTime(
                                                    data.check_out
                                                )
                                                : "Devam ediyor"
                                        )
                                        : "-"
                                }

                            </p>

                        </div>

                    </div>


                    <div className="flex items-center gap-4">

                        <Timer
                            size={35}
                            className="text-blue-600"
                        />

                        <div>

                            <p className="text-gray-500">

                                Toplam Süre

                            </p>

                            <p className="text-lg font-bold text-gray-800">

                                {
                                    hasCheckIn
                                        ? data.work_duration
                                        : "-"
                                }

                            </p>

                        </div>

                    </div>

                </div>

            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                <div className="rounded-xl bg-white p-5 shadow">

                    <h3 className="mb-2 font-bold text-gray-800">

                        Geç Kalma

                    </h3>

                    <p
                        className={
                            data.late
                                ? "font-bold text-red-600"
                                : "font-bold text-green-600"
                        }
                    >

                        {
                            !hasCheckIn
                                ? "Henüz giriş yapılmadı"
                                : data.late
                                    ? `${data.late_minutes ?? 0} dakika geç kalındı`
                                    : "Zamanında giriş yapıldı"
                        }

                    </p>

                </div>


                <div className="rounded-xl bg-white p-5 shadow">

                    <h3 className="mb-2 font-bold text-gray-800">

                        Fazla Mesai

                    </h3>

                    <p className="font-bold text-blue-600">

                        {
                            data.overtime_minutes ?? 0
                        } dakika

                    </p>

                </div>


                <div className="rounded-xl bg-white p-5 shadow">

                    <h3 className="mb-2 font-bold text-gray-800">

                        Eksik Çalışma

                    </h3>

                    <p
                        className={
                            (data.missing_minutes ?? 0) > 0
                                ? "font-bold text-red-600"
                                : "font-bold text-green-600"
                        }
                    >

                        {
                            data.missing_minutes ?? 0
                        } dakika

                    </p>

                </div>

            </div>

        </div>

    );

}


export default Dashboard;