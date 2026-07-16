import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import {
    CalendarCheck,
    CircleCheck,
    CircleX,
    Clock3,
    Mail,
    RefreshCw,
    Search,
    UserRound,
    CalendarDays,
    FileText,
    Filter
} from "lucide-react";


function AdminLeaves() {

    const [leaves, setLeaves] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] =
        useState(null);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("all");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");



    const getLeaves = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await api.get(
                "/leave/all"
            );

            if (Array.isArray(response.data)) {

                setLeaves(response.data);

            } else {

                setLeaves([]);

            }

        } catch (err) {

            console.log(err);

            if (err.response?.status === 403) {

                setError(
                    "İzin yönetimi için admin yetkisine sahip olmalısınız."
                );

            } else if (err.response?.status === 401) {

                setError(
                    "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın."
                );

            } else {

                setError(
                    err.response?.data?.detail ||
                    "İzin talepleri alınamadı."
                );

            }

        } finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        getLeaves();

    }, []);



    const handleApprove = async (leave) => {

        const confirmed = window.confirm(
            `${leave.personel} adlı personelin izin talebini onaylamak istediğinize emin misiniz?`
        );

        if (!confirmed) {

            return;

        }


        setActionLoadingId(leave.id);
        setMessage("");
        setError("");


        try {

            const response = await api.put(
                `/leave/${leave.id}/approve`
            );

            setMessage(
                response.data?.message ||
                "İzin başarıyla onaylandı."
            );

            await getLeaves();

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "İzin onaylanamadı."
            );

        } finally {

            setActionLoadingId(null);

        }

    };



    const handleReject = async (leave) => {

        const confirmed = window.confirm(
            `${leave.personel} adlı personelin izin talebini reddetmek istediğinize emin misiniz?`
        );

        if (!confirmed) {

            return;

        }


        setActionLoadingId(leave.id);
        setMessage("");
        setError("");


        try {

            const response = await api.put(
                `/leave/${leave.id}/reject`
            );

            setMessage(
                response.data?.message ||
                "İzin başarıyla reddedildi."
            );

            await getLeaves();

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "İzin reddedilemedi."
            );

        } finally {

            setActionLoadingId(null);

        }

    };



    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return String(dateValue);

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



    const formatDateTime = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return String(dateValue);

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



    const calculateLeaveDays = (
        startDate,
        endDate
    ) => {

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {

            return 0;

        }

        const difference = Math.max(
            0,
            end.getTime() - start.getTime()
        );

        return (
            Math.floor(
                difference / 86400000
            ) + 1
        );

    };



    const getStatusInformation = (status) => {

        const normalizedStatus = String(
            status || ""
        ).toLowerCase();


        if (normalizedStatus === "approved") {

            return {
                text: "Onaylandı",
                className:
                    "border-green-200 bg-green-100 text-green-700",
                icon: CircleCheck
            };

        }


        if (normalizedStatus === "rejected") {

            return {
                text: "Reddedildi",
                className:
                    "border-red-200 bg-red-100 text-red-700",
                icon: CircleX
            };

        }


        return {
            text: "Bekliyor",
            className:
                "border-yellow-200 bg-yellow-100 text-yellow-700",
            icon: Clock3
        };

    };



    const filteredLeaves = useMemo(() => {

        const normalizedSearch =
            searchText.trim().toLowerCase();


        return leaves.filter((leave) => {

            const normalizedStatus = String(
                leave.status || ""
            ).toLowerCase();


            const statusMatches =
                statusFilter === "all" ||
                normalizedStatus === statusFilter;


            const searchableText = [
                leave.personel,
                leave.email,
                leave.reason,
                leave.start_date,
                leave.end_date,
                leave.status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const searchMatches =
                !normalizedSearch ||
                searchableText.includes(
                    normalizedSearch
                );


            return (
                statusMatches &&
                searchMatches
            );

        });

    }, [
        leaves,
        searchText,
        statusFilter
    ]);



    const pendingCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "pending"
    ).length;


    const approvedCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "approved"
    ).length;


    const rejectedCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "rejected"
    ).length;



    if (loading) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={23}
                        className="animate-spin"
                    />

                    <span>
                        İzin talepleri yükleniyor...
                    </span>

                </div>

            </div>

        );

    }



    return (

        <div className="space-y-8">


            {/* BAŞLIK */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        İzin Onay Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Personellerin izin taleplerini görüntüleyebilir, onaylayabilir veya reddedebilirsiniz.

                    </p>

                </div>


                <button
                    type="button"
                    onClick={getLeaves}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    <RefreshCw size={18} />

                    Yenile

                </button>

            </div>



            {/* MESAJLAR */}

            {message && (

                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">

                    <CircleCheck size={21} />

                    <span>
                        {message}
                    </span>

                </div>

            )}


            {error && (

                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">

                    <CircleX size={21} />

                    <span>
                        {error}
                    </span>

                </div>

            )}



            {/* İSTATİSTİKLER */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Toplam Talep

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {leaves.length}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                            <CalendarDays size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Bekleyen

                            </p>

                            <p className="mt-2 text-3xl font-bold text-yellow-600">

                                {pendingCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">

                            <Clock3 size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Onaylanan

                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-600">

                                {approvedCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">

                            <CircleCheck size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Reddedilen

                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-600">

                                {rejectedCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">

                            <CircleX size={24} />

                        </div>

                    </div>

                </div>

            </div>



            {/* FİLTRELER */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">


                    <div className="relative">

                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(
                                    event.target.value
                                )
                            }
                            placeholder="Personel, e-posta, neden veya tarihe göre ara..."
                            className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                    </div>


                    <div className="relative">

                        <Filter
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >

                            <option value="all">

                                Tüm Durumlar

                            </option>

                            <option value="pending">

                                Bekleyenler

                            </option>

                            <option value="approved">

                                Onaylananlar

                            </option>

                            <option value="rejected">

                                Reddedilenler

                            </option>

                        </select>

                    </div>

                </div>

            </div>



            {/* İZİN TALEPLERİ */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        İzin Talepleri

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        {filteredLeaves.length} izin talebi gösteriliyor

                    </p>

                </div>


                {filteredLeaves.length === 0 ? (

                    <div className="p-12 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">

                            <CalendarCheck size={30} />

                        </div>

                        <h3 className="mt-4 font-semibold text-gray-700">

                            İzin talebi bulunamadı

                        </h3>

                        <p className="mt-1 text-sm text-gray-500">

                            Seçtiğiniz filtrelere uygun izin talebi bulunmuyor.

                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Personel

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Tarih Aralığı

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Süre

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Neden

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Durum

                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        İşlemler

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {filteredLeaves.map(
                                    (leave) => {

                                        const statusInformation =
                                            getStatusInformation(
                                                leave.status
                                            );

                                        const StatusIcon =
                                            statusInformation.icon;

                                        const isPending =
                                            String(
                                                leave.status
                                            ).toLowerCase() ===
                                            "pending";

                                        const isActionLoading =
                                            actionLoadingId ===
                                            leave.id;


                                        return (

                                            <tr
                                                key={leave.id}
                                                className="align-top transition hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-start gap-3">

                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 font-bold text-white">

                                                            {leave.personel
                                                                ?.charAt(0)
                                                                ?.toUpperCase() || "P"}

                                                        </div>

                                                        <div>

                                                            <div className="flex items-center gap-2 font-semibold text-gray-800">

                                                                <UserRound size={16} />

                                                                {leave.personel}

                                                            </div>

                                                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">

                                                                <Mail size={15} />

                                                                {leave.email}

                                                            </div>

                                                            <p className="mt-1 text-xs text-gray-400">

                                                                Talep: {formatDateTime(
                                                                    leave.created_at
                                                                )}

                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    <div className="flex items-start gap-2 text-sm text-gray-600">

                                                        <CalendarDays
                                                            size={17}
                                                            className="mt-0.5"
                                                        />

                                                        <div>

                                                            <p>

                                                                {formatDate(
                                                                    leave.start_date
                                                                )}

                                                            </p>

                                                            <p className="mt-1">

                                                                {formatDate(
                                                                    leave.end_date
                                                                )}

                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">

                                                        {calculateLeaveDays(
                                                            leave.start_date,
                                                            leave.end_date
                                                        )} gün

                                                    </span>

                                                </td>


                                                <td className="max-w-xs px-6 py-4">

                                                    <div className="flex items-start gap-2 text-sm text-gray-600">

                                                        <FileText
                                                            size={17}
                                                            className="mt-0.5 shrink-0"
                                                        />

                                                        <p
                                                            className="line-clamp-3"
                                                            title={leave.reason}
                                                        >

                                                            {leave.reason || "-"}

                                                        </p>

                                                    </div>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusInformation.className}`}
                                                    >

                                                        <StatusIcon size={14} />

                                                        {statusInformation.text}

                                                    </span>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    {isPending ? (

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        leave
                                                                    )
                                                                }
                                                                disabled={
                                                                    isActionLoading
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >

                                                                {isActionLoading
                                                                    ? (
                                                                        <RefreshCw
                                                                            size={16}
                                                                            className="animate-spin"
                                                                        />
                                                                    )
                                                                    : (
                                                                        <CircleCheck size={16} />
                                                                    )
                                                                }

                                                                Onayla

                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        leave
                                                                    )
                                                                }
                                                                disabled={
                                                                    isActionLoading
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >

                                                                {isActionLoading
                                                                    ? (
                                                                        <RefreshCw
                                                                            size={16}
                                                                            className="animate-spin"
                                                                        />
                                                                    )
                                                                    : (
                                                                        <CircleX size={16} />
                                                                    )
                                                                }

                                                                Reddet

                                                            </button>

                                                        </div>

                                                    ) : (

                                                        <div className="text-right text-sm text-gray-400">

                                                            İşlem tamamlandı

                                                        </div>

                                                    )}

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );

}


export default AdminLeaves;