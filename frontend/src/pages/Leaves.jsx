import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import {
    CalendarDays,
    FileText,
    Plus,
    RefreshCw,
    CircleCheck,
    CircleX,
    Clock3,
    Send,
    X
} from "lucide-react";


function Leaves() {

    const [leaves, setLeaves] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    const [showForm, setShowForm] = useState(false);



    const getLeaves = async (showErrorToast = true) => {

        try {

            const response = await api.get("/leave/my");

            if (Array.isArray(response.data)) {

                setLeaves(response.data);

            } else if (Array.isArray(response.data?.leaves)) {

                setLeaves(response.data.leaves);

            } else {

                setLeaves([]);

            }

        } catch (err) {

            console.log(err);

            setLeaves([]);

            if (showErrorToast) {

                toast.error(
                    err.response?.data?.detail ||
                    "İzin kayıtları alınamadı."
                );

            }

        }

    };



    const loadPage = async (showSuccessToast = false) => {

        setLoading(true);

        await getLeaves();

        setLoading(false);

        if (showSuccessToast) {

            toast.success(
                "İzin kayıtları yenilendi."
            );

        }

    };



    useEffect(() => {

        loadPage();

    }, []);



    const handleSubmit = async (event) => {

        event.preventDefault();


        if (!startDate || !endDate || !reason.trim()) {

            toast.error(
                "Başlangıç tarihi, bitiş tarihi ve izin nedeni zorunludur."
            );

            return;

        }


        if (
            new Date(endDate).getTime() <
            new Date(startDate).getTime()
        ) {

            toast.error(
                "Bitiş tarihi başlangıç tarihinden önce olamaz."
            );

            return;

        }


        setFormLoading(true);


        try {

            const response = await api.post(
                "/leave/",
                {
                    start_date: startDate,
                    end_date: endDate,
                    reason: reason.trim()
                }
            );


            toast.success(
                response.data?.message ||
                "İzin talebiniz başarıyla oluşturuldu."
            );


            setStartDate("");
            setEndDate("");
            setReason("");

            setShowForm(false);

            await getLeaves(false);

        } catch (err) {

            console.log(err);

            toast.error(
                err.response?.data?.detail ||
                "İzin talebi oluşturulamadı."
            );

        } finally {

            setFormLoading(false);

        }

    };



    const handleToggleForm = () => {

        setShowForm(
            (previousValue) =>
                !previousValue
        );

    };



    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {

            return dateValue;

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



    const calculateLeaveDays = (
        startDateValue,
        endDateValue
    ) => {

        if (!startDateValue || !endDateValue) {

            return 0;

        }

        const start = new Date(startDateValue);
        const end = new Date(endDateValue);


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

        return Math.floor(
            difference / 86400000
        ) + 1;

    };



    const getStatusInformation = (status) => {

        const normalizedStatus = String(
            status || ""
        ).toLowerCase();


        if (normalizedStatus === "approved") {

            return {
                text: "Onaylandı",
                className:
                    "bg-green-100 text-green-700 border-green-200",
                icon: CircleCheck
            };

        }


        if (normalizedStatus === "rejected") {

            return {
                text: "Reddedildi",
                className:
                    "bg-red-100 text-red-700 border-red-200",
                icon: CircleX
            };

        }


        return {
            text: "Bekliyor",
            className:
                "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: Clock3
        };

    };



    const approvedCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "approved"
    ).length;


    const pendingCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "pending"
    ).length;


    const rejectedCount = leaves.filter(
        (leave) =>
            String(leave.status).toLowerCase() ===
            "rejected"
    ).length;



    if (loading) {

        return (

            <div className="min-h-[400px] flex items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={22}
                        className="animate-spin"
                    />

                    <span>
                        İzin bilgileri yükleniyor...
                    </span>

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

                        İzin Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        İzin taleplerinizi oluşturabilir ve geçmiş taleplerinizi görüntüleyebilirsiniz.

                    </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={() => loadPage(true)}
                        disabled={loading || formLoading}
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


                    <button
                        type="button"
                        onClick={handleToggleForm}
                        disabled={formLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >

                        {showForm
                            ? <X size={19} />
                            : <Plus size={19} />
                        }

                        {showForm
                            ? "Formu Kapat"
                            : "Yeni İzin Talebi"
                        }

                    </button>

                </div>

            </div>



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



            {/* YENİ İZİN FORMU */}

            {showForm && (

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-6 flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                            <FileText size={22} />

                        </div>

                        <div>

                            <h2 className="text-xl font-bold text-gray-800">

                                Yeni İzin Talebi

                            </h2>

                            <p className="text-sm text-gray-500">

                                İzin tarihlerinizi ve talep nedeninizi girin.

                            </p>

                        </div>

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <div>

                                <label
                                    htmlFor="startDate"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    Başlangıç Tarihi

                                </label>

                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(event) =>
                                        setStartDate(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>


                            <div>

                                <label
                                    htmlFor="endDate"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    Bitiş Tarihi

                                </label>

                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(event) =>
                                        setEndDate(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>

                        </div>


                        <div>

                            <label
                                htmlFor="reason"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >

                                İzin Nedeni

                            </label>

                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(event) =>
                                    setReason(
                                        event.target.value
                                    )
                                }
                                rows={5}
                                maxLength={500}
                                placeholder="İzin talebinizin nedenini yazınız..."
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                required
                            />

                            <div className="mt-2 text-right text-xs text-gray-400">

                                {reason.length}/500

                            </div>

                        </div>


                        {startDate && endDate && (

                            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">

                                Talep edilen izin süresi:{" "}

                                <span className="font-bold">

                                    {calculateLeaveDays(
                                        startDate,
                                        endDate
                                    )} gün

                                </span>

                            </div>

                        )}


                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={handleToggleForm}
                                disabled={formLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                <X size={19} />

                                Vazgeç

                            </button>


                            <button
                                type="submit"
                                disabled={formLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >

                                {formLoading
                                    ? (
                                        <RefreshCw
                                            size={19}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <Send size={19} />
                                    )
                                }

                                {formLoading
                                    ? "Gönderiliyor..."
                                    : "Talebi Gönder"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            )}



            {/* İZİN LİSTESİ */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        İzin Taleplerim

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        Oluşturduğunuz tüm izin talepleri

                    </p>

                </div>


                {leaves.length === 0 ? (

                    <div className="p-12 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">

                            <CalendarDays size={30} />

                        </div>

                        <h3 className="mt-4 font-semibold text-gray-700">

                            Henüz izin talebiniz yok

                        </h3>

                        <p className="mt-1 text-sm text-gray-500">

                            Yeni İzin Talebi butonuyla ilk talebinizi oluşturabilirsiniz.

                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Başlangıç

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Bitiş

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

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {leaves.map(
                                    (leave, index) => {

                                        const statusInformation =
                                            getStatusInformation(
                                                leave.status
                                            );

                                        const StatusIcon =
                                            statusInformation.icon;

                                        return (

                                            <tr
                                                key={
                                                    leave.id ||
                                                    index
                                                }
                                                className="transition hover:bg-gray-50"
                                            >

                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800">

                                                    {formatDate(
                                                        leave.start_date
                                                    )}

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                    {formatDate(
                                                        leave.end_date
                                                    )}

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">

                                                    {calculateLeaveDays(
                                                        leave.start_date,
                                                        leave.end_date
                                                    )} gün

                                                </td>


                                                <td className="max-w-xs px-6 py-4 text-sm text-gray-600">

                                                    <p
                                                        className="truncate"
                                                        title={leave.reason}
                                                    >

                                                        {leave.reason || "-"}

                                                    </p>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusInformation.className}`}
                                                    >

                                                        <StatusIcon size={14} />

                                                        {statusInformation.text}

                                                    </span>

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


export default Leaves;