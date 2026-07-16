import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import {
    Clock,
    LogIn,
    LogOut,
    MapPin,
    CalendarDays,
    RefreshCw
} from "lucide-react";


function Attendance() {

    const [dashboard, setDashboard] = useState(null);
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);



    const getDashboard = async () => {

        try {

            const response = await api.get("/dashboard");

            setDashboard(response.data);

        } catch (err) {

            console.log(err);

            toast.error(
                err.response?.data?.detail ||
                "Dashboard bilgileri alınamadı."
            );

        }

    };



    const getAttendanceRecords = async () => {

        try {

            const response = await api.get(
                "/attendance/my-attendance"
            );

            if (Array.isArray(response.data)) {

                setRecords(response.data);

            } else if (Array.isArray(response.data?.records)) {

                setRecords(response.data.records);

            } else {

                setRecords([]);

            }

        } catch (err) {

            console.log(err);

            setRecords([]);

            toast.error(
                err.response?.data?.detail ||
                "Mesai kayıtları alınamadı."
            );

        }

    };



    const loadPage = async () => {

        setLoading(true);

        await Promise.all([
            getDashboard(),
            getAttendanceRecords()
        ]);

        setLoading(false);

    };



    useEffect(() => {

        loadPage();

    }, []);



    const getLocation = () => {

        return new Promise((resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Tarayıcınız konum özelliğini desteklemiyor."
                    )
                );

                return;

            }

            navigator.geolocation.getCurrentPosition(

                (position) => {

                    resolve({

                        latitude: position.coords.latitude,

                        longitude: position.coords.longitude

                    });

                },

                (locationError) => {

                    if (locationError.code === 1) {

                        reject(
                            new Error(
                                "Konum izni reddedildi. Tarayıcıdan konum izni vermelisiniz."
                            )
                        );

                    } else if (locationError.code === 2) {

                        reject(
                            new Error(
                                "Konum bilgisi alınamadı."
                            )
                        );

                    } else {

                        reject(
                            new Error(
                                "Konum alınırken zaman aşımı oluştu."
                            )
                        );

                    }

                },

                {

                    enableHighAccuracy: true,

                    timeout: 15000,

                    maximumAge: 0

                }

            );

        });

    };



    const handleCheckIn = async () => {

        setActionLoading(true);

        try {

            const location = await getLocation();

            const response = await api.post(
                "/attendance/check-in",
                {

                    latitude: location.latitude,

                    longitude: location.longitude

                }
            );

            toast.success(
                response.data?.message ||
                "Mesai girişiniz başarıyla yapıldı."
            );

            await loadPage();

        } catch (err) {

            console.log(err);

            toast.error(
                err.response?.data?.detail ||
                err.message ||
                "Mesai girişi yapılamadı."
            );

        } finally {

            setActionLoading(false);

        }

    };



    const handleCheckOut = async () => {

        setActionLoading(true);

        try {

            const location = await getLocation();

            const response = await api.post(
                "/attendance/check-out",
                {

                    latitude: location.latitude,

                    longitude: location.longitude

                }
            );

            toast.success(
                response.data?.message ||
                "Mesai çıkışınız başarıyla yapıldı."
            );

            await loadPage();

        } catch (err) {

            console.log(err);

            toast.error(
                err.response?.data?.detail ||
                err.message ||
                "Mesai çıkışı yapılamadı."
            );

        } finally {

            setActionLoading(false);

        }

    };



    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return "-";

        }

        return date.toLocaleDateString(
            "tr-TR",
            {

                day: "2-digit",

                month: "2-digit",

                year: "numeric"

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



    const calculateDuration = (
        checkIn,
        checkOut
    ) => {

        if (!checkIn) {

            return "-";

        }

        const start = new Date(checkIn);

        const end = checkOut
            ? new Date(checkOut)
            : new Date();

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {

            return "-";

        }

        const difference = Math.max(
            0,
            end.getTime() - start.getTime()
        );

        const totalMinutes = Math.floor(
            difference / 60000
        );

        const hours = Math.floor(
            totalMinutes / 60
        );

        const minutes = totalMinutes % 60;

        return `${hours} saat ${minutes} dakika`;

    };



    const isWorking = dashboard?.status === "Çalışıyor";



    if (loading) {

        return (

            <div className="min-h-[400px] flex items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={22}
                        className="animate-spin"
                    />

                    <span>
                        Mesai bilgileri yükleniyor...
                    </span>

                </div>

            </div>

        );

    }



    return (

        <div className="space-y-8">


            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Mesai İşlemleri

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Günlük giriş ve çıkış işlemlerinizi buradan yönetebilirsiniz.

                    </p>

                </div>


                <button
                    type="button"
                    onClick={loadPage}
                    disabled={loading || actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >

                    <RefreshCw
                        size={18}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Yenile

                </button>

            </div>



            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">


                        <div className="flex items-center gap-4">

                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isWorking
                                    ? "bg-green-100 text-green-600"
                                    : "bg-gray-100 text-gray-500"
                                    }`}
                            >

                                <Clock size={28} />

                            </div>


                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    Güncel mesai durumu

                                </p>

                                <div className="mt-1 flex items-center gap-2">

                                    <span
                                        className={`h-3 w-3 rounded-full ${isWorking
                                            ? "bg-green-500"
                                            : "bg-gray-400"
                                            }`}
                                    />

                                    <h2 className="text-2xl font-bold text-gray-800">

                                        {dashboard?.status ||
                                            "Durum bilinmiyor"}

                                    </h2>

                                </div>

                            </div>

                        </div>



                        <div className="flex flex-col gap-3 sm:flex-row">

                            <button
                                type="button"
                                onClick={handleCheckIn}
                                disabled={
                                    actionLoading ||
                                    isWorking
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >

                                {actionLoading
                                    ? (
                                        <RefreshCw
                                            size={19}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <LogIn size={19} />
                                    )
                                }

                                Giriş Yap

                            </button>


                            <button
                                type="button"
                                onClick={handleCheckOut}
                                disabled={
                                    actionLoading ||
                                    !isWorking
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >

                                {actionLoading
                                    ? (
                                        <RefreshCw
                                            size={19}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <LogOut size={19} />
                                    )
                                }

                                Çıkış Yap

                            </button>

                        </div>

                    </div>

                </div>



                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">


                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <LogIn size={17} />

                            Giriş Saati

                        </div>

                        <p className="mt-3 text-xl font-bold text-gray-800">

                            {formatTime(
                                dashboard?.check_in
                            )}

                        </p>

                    </div>



                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <LogOut size={17} />

                            Çıkış Saati

                        </div>

                        <p className="mt-3 text-xl font-bold text-gray-800">

                            {formatTime(
                                dashboard?.check_out
                            )}

                        </p>

                    </div>



                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <Clock size={17} />

                            Çalışma Süresi

                        </div>

                        <p className="mt-3 text-xl font-bold text-gray-800">

                            {dashboard?.work_duration ||
                                "0 saat 0 dakika"}

                        </p>

                    </div>



                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <MapPin size={17} />

                            Konum Kontrolü

                        </div>

                        <p className="mt-3 text-xl font-bold text-gray-800">

                            Aktif

                        </p>

                    </div>

                </div>

            </div>



            {dashboard?.late && (

                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

                    <h3 className="font-semibold text-orange-800">

                        Geç Giriş Bilgisi

                    </h3>

                    <p className="mt-1 text-orange-700">

                        Bugün işe{" "}

                        <span className="font-bold">

                            {dashboard.late_minutes || 0} dakika

                        </span>{" "}

                        geç giriş yaptınız.

                    </p>

                </div>

            )}



            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-100 p-6">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            Son Mesai Kayıtları

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            Geçmiş giriş ve çıkış kayıtlarınız

                        </p>

                    </div>

                    <CalendarDays
                        size={24}
                        className="text-gray-400"
                    />

                </div>


                {records.length === 0 ? (

                    <div className="p-10 text-center text-gray-500">

                        Henüz mesai kaydı bulunmuyor.

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tarih
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Giriş
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Çıkış
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Süre
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Durum
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {records.map(
                                    (record, index) => (

                                        <tr
                                            key={
                                                record.id ||
                                                index
                                            }
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800">

                                                {formatDate(
                                                    record.check_in
                                                )}

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                {formatTime(
                                                    record.check_in
                                                )}

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                {formatTime(
                                                    record.check_out
                                                )}

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                {record.duration ||
                                                    calculateDuration(
                                                        record.check_in,
                                                        record.check_out
                                                    )}

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                {record.check_out ? (

                                                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                                                        Tamamlandı

                                                    </span>

                                                ) : (

                                                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

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

                )}

            </div>

        </div>

    );

}


export default Attendance;