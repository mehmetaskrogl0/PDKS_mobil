import { useEffect, useState } from "react";
import api from "../api/axios";

import {
    Users,
    Building2,
    LogIn,
    LogOut,
    UserCheck,
    UserX,
    Clock3,
    CalendarClock,
    CircleCheck,
    CircleX,
    RefreshCw,
    Timer,
    AlertTriangle,
    BriefcaseBusiness
} from "lucide-react";


function AdminDashboard() {

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");



    const getAdminDashboard = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await api.get(
                "/dashboard/admin"
            );

            setData(response.data);

        } catch (err) {

            console.log(err);

            if (err.response?.status === 403) {

                setError(
                    "Bu sayfayı görüntülemek için admin yetkisine sahip olmalısınız."
                );

            } else if (err.response?.status === 401) {

                setError(
                    "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın."
                );

            } else {

                setError(
                    err.response?.data?.detail ||
                    "Admin dashboard bilgileri alınamadı."
                );

            }

        } finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        getAdminDashboard();

    }, []);



    const formatDateTime = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return "-";

        }

        return date.toLocaleString(
            "tr-TR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };



    const formatTime = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return "-";

        }

        return date.toLocaleTimeString(
            "tr-TR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };



    const statistics = [

        {
            title: "Toplam Personel",
            value: data?.total_employees || 0,
            icon: Users,
            iconClass: "bg-blue-100 text-blue-600"
        },

        {
            title: "Toplam İş Yeri",
            value: data?.total_workplaces || 0,
            icon: Building2,
            iconClass: "bg-purple-100 text-purple-600"
        },

        {
            title: "Bugün Giriş Yapan",
            value: data?.today_checkins || 0,
            icon: LogIn,
            iconClass: "bg-green-100 text-green-600"
        },

        {
            title: "Bugün Çıkış Yapan",
            value: data?.today_checkouts || 0,
            icon: LogOut,
            iconClass: "bg-orange-100 text-orange-600"
        },

        {
            title: "Aktif Personel",
            value: data?.active_employees || 0,
            icon: UserCheck,
            iconClass: "bg-emerald-100 text-emerald-600"
        },

        {
            title: "Bugün Gelmeyen",
            value: data?.today_absent || 0,
            icon: UserX,
            iconClass: "bg-red-100 text-red-600"
        },

        {
            title: "Geç Kalan",
            value: data?.late_today || 0,
            icon: Clock3,
            iconClass: "bg-yellow-100 text-yellow-600"
        },

        {
            title: "Bekleyen İzin",
            value: data?.pending_leaves || 0,
            icon: CalendarClock,
            iconClass: "bg-cyan-100 text-cyan-600"
        }

    ];



    if (loading) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={24}
                        className="animate-spin"
                    />

                    <span>
                        Admin paneli yükleniyor...
                    </span>

                </div>

            </div>

        );

    }



    if (error) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">

                        <CircleX size={32} />

                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-800">

                        Admin Paneli Açılamadı

                    </h2>

                    <p className="mt-2 text-gray-600">

                        {error}

                    </p>

                    <button
                        type="button"
                        onClick={getAdminDashboard}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >

                        <RefreshCw size={18} />

                        Tekrar Dene

                    </button>

                </div>

            </div>

        );

    }



    return (

        <div className="space-y-8">


            {/* BAŞLIK */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Admin Kontrol Paneli

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Personel, mesai, izin ve iş yeri durumlarını buradan takip edebilirsiniz.

                    </p>

                </div>


                <button
                    type="button"
                    onClick={getAdminDashboard}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >

                    <RefreshCw size={18} />

                    Yenile

                </button>

            </div>



            {/* İSTATİSTİK KARTLARI */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                {statistics.map(
                    (item, index) => {

                        const Icon = item.icon;

                        return (

                            <div
                                key={index}
                                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm font-medium text-gray-500">

                                            {item.title}

                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-800">

                                            {item.value}

                                        </p>

                                    </div>


                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconClass}`}
                                    >

                                        <Icon size={24} />

                                    </div>

                                </div>

                            </div>

                        );

                    }
                )}

            </div>



            {/* İZİN DURUMLARI */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="font-medium text-yellow-700">

                                Bekleyen İzinler

                            </p>

                            <p className="mt-2 text-3xl font-bold text-yellow-800">

                                {data?.pending_leaves || 0}

                            </p>

                        </div>

                        <CalendarClock
                            size={32}
                            className="text-yellow-600"
                        />

                    </div>

                </div>


                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="font-medium text-green-700">

                                Onaylanan İzinler

                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-800">

                                {data?.approved_leaves || 0}

                            </p>

                        </div>

                        <CircleCheck
                            size={32}
                            className="text-green-600"
                        />

                    </div>

                </div>


                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="font-medium text-red-700">

                                Reddedilen İzinler

                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-800">

                                {data?.rejected_leaves || 0}

                            </p>

                        </div>

                        <CircleX
                            size={32}
                            className="text-red-600"
                        />

                    </div>

                </div>

            </div>



            {/* ÇALIŞMA İSTATİSTİKLERİ */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        Çalışma İstatistikleri

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        Tüm mesai kayıtlarından hesaplanan toplam değerler

                    </p>

                </div>


                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                    <div className="rounded-xl bg-blue-50 p-5">

                        <div className="flex items-center gap-3 text-blue-700">

                            <Timer size={22} />

                            <span className="font-semibold">

                                Fazla Mesai

                            </span>

                        </div>

                        <p className="mt-3 text-2xl font-bold text-blue-800">

                            {data?.work_statistics
                                ?.total_overtime_minutes || 0} dakika

                        </p>

                    </div>


                    <div className="rounded-xl bg-red-50 p-5">

                        <div className="flex items-center gap-3 text-red-700">

                            <AlertTriangle size={22} />

                            <span className="font-semibold">

                                Eksik Çalışma

                            </span>

                        </div>

                        <p className="mt-3 text-2xl font-bold text-red-800">

                            {data?.work_statistics
                                ?.total_missing_minutes || 0} dakika

                        </p>

                    </div>


                    <div className="rounded-xl bg-yellow-50 p-5">

                        <div className="flex items-center gap-3 text-yellow-700">

                            <Clock3 size={22} />

                            <span className="font-semibold">

                                Toplam Geç Kalma

                            </span>

                        </div>

                        <p className="mt-3 text-2xl font-bold text-yellow-800">

                            {data?.work_statistics
                                ?.total_late_minutes || 0} dakika

                        </p>

                    </div>

                </div>

            </div>



            {/* AKTİF PERSONELLER VE GEÇ KALANLAR */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">


                {/* AKTİF PERSONELLER */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-gray-100 p-6">

                        <div>

                            <h2 className="text-xl font-bold text-gray-800">

                                Aktif Personeller

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                Şu anda mesaisi devam eden çalışanlar

                            </p>

                        </div>

                        <UserCheck
                            size={25}
                            className="text-green-600"
                        />

                    </div>


                    {data?.active_employee_list?.length > 0 ? (

                        <div className="divide-y divide-gray-100">

                            {data.active_employee_list.map(
                                (employee, index) => (

                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
                                    >

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">

                                                {employee.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "P"}

                                            </div>

                                            <div>

                                                <p className="font-semibold text-gray-800">

                                                    {employee.name}

                                                </p>

                                                <p className="text-sm text-gray-500">

                                                    Mesai başlangıcı

                                                </p>

                                            </div>

                                        </div>

                                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">

                                            {formatTime(
                                                employee.check_in
                                            )}

                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="p-10 text-center text-gray-500">

                            Şu anda aktif personel bulunmuyor.

                        </div>

                    )}

                </div>



                {/* GEÇ KALAN PERSONELLER */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-gray-100 p-6">

                        <div>

                            <h2 className="text-xl font-bold text-gray-800">

                                Bugün Geç Kalanlar

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                Bugün geç giriş yapan çalışanlar

                            </p>

                        </div>

                        <Clock3
                            size={25}
                            className="text-yellow-600"
                        />

                    </div>


                    {data?.late_employee_list?.length > 0 ? (

                        <div className="divide-y divide-gray-100">

                            {data.late_employee_list.map(
                                (employee, index) => (

                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
                                    >

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-700">

                                                {employee.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "P"}

                                            </div>

                                            <p className="font-semibold text-gray-800">

                                                {employee.name}

                                            </p>

                                        </div>

                                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">

                                            {employee.late_minutes || 0} dakika

                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="p-10 text-center text-gray-500">

                            Bugün geç kalan personel bulunmuyor.

                        </div>

                    )}

                </div>

            </div>



            {/* SON MESAİ HAREKETLERİ */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-100 p-6">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            Son Mesai Hareketleri

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            Sistemdeki son 10 giriş ve çıkış kaydı

                        </p>

                    </div>

                    <BriefcaseBusiness
                        size={25}
                        className="text-gray-400"
                    />

                </div>


                {data?.recent_attendance?.length > 0 ? (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Personel

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Giriş

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Çıkış

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Durum

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {data.recent_attendance.map(
                                    (record, index) => (

                                        <tr
                                            key={index}
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-800">

                                                {record.name}

                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                {formatDateTime(
                                                    record.check_in
                                                )}

                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                {formatDateTime(
                                                    record.check_out
                                                )}

                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4">

                                                {record.check_out ? (

                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                                                        Tamamlandı

                                                    </span>

                                                ) : (

                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                        Çalışıyor

                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <div className="p-10 text-center text-gray-500">

                        Henüz mesai hareketi bulunmuyor.

                    </div>

                )}

            </div>



            {/* İŞ YERİ DURUMLARI */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        İş Yeri Durumları

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        İş yerlerindeki toplam ve aktif personel sayıları

                    </p>

                </div>


                {data?.workplace_status?.length > 0 ? (

                    <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">

                        {data.workplace_status.map(
                            (workplace, index) => (

                                <div
                                    key={index}
                                    className="rounded-xl border border-gray-200 p-5"
                                >

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">

                                            <Building2 size={22} />

                                        </div>

                                        <div>

                                            <h3 className="font-bold text-gray-800">

                                                {workplace.workplace}

                                            </h3>

                                            <p className="text-sm text-gray-500">

                                                İş yeri bilgisi

                                            </p>

                                        </div>

                                    </div>


                                    <div className="mt-5 grid grid-cols-2 gap-3">

                                        <div className="rounded-lg bg-gray-50 p-3">

                                            <p className="text-xs text-gray-500">

                                                Toplam

                                            </p>

                                            <p className="mt-1 text-xl font-bold text-gray-800">

                                                {workplace.total_employee || 0}

                                            </p>

                                        </div>


                                        <div className="rounded-lg bg-green-50 p-3">

                                            <p className="text-xs text-green-600">

                                                Aktif

                                            </p>

                                            <p className="mt-1 text-xl font-bold text-green-700">

                                                {workplace.active_employee || 0}

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <div className="p-10 text-center text-gray-500">

                        İş yeri bilgisi bulunmuyor.

                    </div>

                )}

            </div>

        </div>

    );

}


export default AdminDashboard;