import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import {
    CalendarDays,
    Clock,
    Coffee,
    MapPin,
    Users,
    User,
    Moon,
    AlertCircle,
    CalendarCheck,
    CalendarClock,
    History,
    RefreshCw
} from "lucide-react";


function formatDate(dateValue) {

    if (!dateValue) {
        return "Süresiz";
    }

    return new Date(
        `${dateValue}T00:00:00`
    ).toLocaleDateString(
        "tr-TR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


function getStatusInfo(status) {

    if (status === "active") {

        return {
            text: "Aktif Vardiya",
            badgeClass: (
                "bg-green-100 text-green-700 "
                + "border-green-200"
            ),
            cardClass: (
                "border-green-200 "
                + "bg-gradient-to-br "
                + "from-green-50 to-white"
            )
        };

    }

    if (status === "upcoming") {

        return {
            text: "Yaklaşan",
            badgeClass: (
                "bg-blue-100 text-blue-700 "
                + "border-blue-200"
            ),
            cardClass: (
                "border-blue-200 "
                + "bg-gradient-to-br "
                + "from-blue-50 to-white"
            )
        };

    }

    if (status === "past") {

        return {
            text: "Geçmiş",
            badgeClass: (
                "bg-gray-100 text-gray-600 "
                + "border-gray-200"
            ),
            cardClass: (
                "border-gray-200 bg-white"
            )
        };

    }

    return {
        text: "Pasif",
        badgeClass: (
            "bg-red-100 text-red-700 "
            + "border-red-200"
        ),
        cardClass: (
            "border-red-200 "
            + "bg-gradient-to-br "
            + "from-red-50 to-white"
        )
    };

}


function ShiftCard({ shift }) {

    const statusInfo = getStatusInfo(
        shift.period_status
    );

    const assignmentSourceText = (
        shift.assignment_source === "personel"
            ? "Bireysel Atama"
            : "Ekip Ataması"
    );

    return (

        <div
            className={`
                rounded-2xl border p-5 shadow-sm
                transition duration-200
                hover:-translate-y-1 hover:shadow-md
                ${statusInfo.cardClass}
            `}
        >

            <div
                className="
                    flex flex-col gap-4
                    sm:flex-row sm:items-start
                    sm:justify-between
                "
            >

                <div className="min-w-0">

                    <div
                        className="
                            flex flex-wrap items-center
                            gap-2
                        "
                    >

                        <h3
                            className="
                                text-xl font-bold
                                text-gray-800
                            "
                        >
                            {shift.shift_name}
                        </h3>

                        {shift.is_overnight && (

                            <span
                                className="
                                    inline-flex items-center
                                    gap-1 rounded-full
                                    border border-indigo-200
                                    bg-indigo-100 px-2.5
                                    py-1 text-xs
                                    font-semibold
                                    text-indigo-700
                                "
                            >
                                <Moon size={13} />
                                Gece Vardiyası
                            </span>

                        )}

                    </div>

                    {shift.shift_description && (

                        <p
                            className="
                                mt-2 text-sm
                                leading-6 text-gray-600
                            "
                        >
                            {shift.shift_description}
                        </p>

                    )}

                </div>

                <span
                    className={`
                        w-fit rounded-full border
                        px-3 py-1 text-xs
                        font-bold
                        ${statusInfo.badgeClass}
                    `}
                >
                    {statusInfo.text}
                </span>

            </div>


            <div
                className="
                    mt-5 grid gap-3
                    sm:grid-cols-2
                "
            >

                <div
                    className="
                        flex items-center gap-3
                        rounded-xl border
                        border-gray-100
                        bg-white/80 p-3
                    "
                >

                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl bg-indigo-100
                            text-indigo-600
                        "
                    >
                        <Clock size={20} />
                    </div>

                    <div>

                        <p
                            className="
                                text-xs font-medium
                                text-gray-500
                            "
                        >
                            Çalışma Saati
                        </p>

                        <p
                            className="
                                mt-0.5 font-bold
                                text-gray-800
                            "
                        >
                            {shift.start_time_text}
                            {" - "}
                            {shift.end_time_text}
                        </p>

                    </div>

                </div>


                <div
                    className="
                        flex items-center gap-3
                        rounded-xl border
                        border-gray-100
                        bg-white/80 p-3
                    "
                >

                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl bg-amber-100
                            text-amber-600
                        "
                    >
                        <Coffee size={20} />
                    </div>

                    <div>

                        <p
                            className="
                                text-xs font-medium
                                text-gray-500
                            "
                        >
                            Mola Süresi
                        </p>

                        <p
                            className="
                                mt-0.5 font-bold
                                text-gray-800
                            "
                        >
                            {shift.break_minutes || 0} dakika
                        </p>

                    </div>

                </div>


                <div
                    className="
                        flex items-center gap-3
                        rounded-xl border
                        border-gray-100
                        bg-white/80 p-3
                    "
                >

                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl bg-emerald-100
                            text-emerald-600
                        "
                    >
                        <CalendarDays size={20} />
                    </div>

                    <div>

                        <p
                            className="
                                text-xs font-medium
                                text-gray-500
                            "
                        >
                            Geçerlilik Tarihi
                        </p>

                        <p
                            className="
                                mt-0.5 text-sm
                                font-bold text-gray-800
                            "
                        >
                            {formatDate(
                                shift.start_date
                            )}
                        </p>

                        <p
                            className="
                                text-xs text-gray-500
                            "
                        >
                            {shift.end_date
                                ? `${formatDate(
                                    shift.end_date
                                )} tarihine kadar`
                                : "Bitiş tarihi bulunmuyor"
                            }
                        </p>

                    </div>

                </div>


                <div
                    className="
                        flex items-center gap-3
                        rounded-xl border
                        border-gray-100
                        bg-white/80 p-3
                    "
                >

                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl bg-purple-100
                            text-purple-600
                        "
                    >

                        {shift.assignment_source
                            === "personel"
                            ? <User size={20} />
                            : <Users size={20} />
                        }

                    </div>

                    <div>

                        <p
                            className="
                                text-xs font-medium
                                text-gray-500
                            "
                        >
                            Atama Şekli
                        </p>

                        <p
                            className="
                                mt-0.5 font-bold
                                text-gray-800
                            "
                        >
                            {assignmentSourceText}
                        </p>

                        {shift.assigned_name && (

                            <p
                                className="
                                    text-xs text-gray-500
                                "
                            >
                                {shift.assigned_name}
                            </p>

                        )}

                    </div>

                </div>

            </div>


            <div
                className="
                    mt-4 grid gap-3
                    sm:grid-cols-2
                    lg:grid-cols-3
                "
            >

                <div
                    className="
                        rounded-xl bg-gray-50
                        px-4 py-3
                    "
                >
                    <p
                        className="
                            text-xs font-medium
                            text-gray-500
                        "
                    >
                        Geç Kalma Toleransı
                    </p>

                    <p
                        className="
                            mt-1 font-bold
                            text-gray-800
                        "
                    >
                        {shift.late_tolerance_minutes || 0}
                        {" dakika"}
                    </p>
                </div>


                <div
                    className="
                        rounded-xl bg-gray-50
                        px-4 py-3
                    "
                >
                    <p
                        className="
                            text-xs font-medium
                            text-gray-500
                        "
                    >
                        Erken Giriş İzni
                    </p>

                    <p
                        className="
                            mt-1 font-bold
                            text-gray-800
                        "
                    >
                        {shift.early_check_in_minutes || 0}
                        {" dakika"}
                    </p>
                </div>


                <div
                    className="
                        rounded-xl bg-gray-50
                        px-4 py-3
                    "
                >
                    <p
                        className="
                            text-xs font-medium
                            text-gray-500
                        "
                    >
                        Fazla Mesai Toleransı
                    </p>

                    <p
                        className="
                            mt-1 font-bold
                            text-gray-800
                        "
                    >
                        {
                            shift
                                .overtime_tolerance_minutes
                            || 0
                        }
                        {" dakika"}
                    </p>
                </div>

            </div>


            {shift.workplace_name && (

                <div
                    className="
                        mt-4 flex items-center
                        gap-2 rounded-xl
                        bg-slate-50 px-4 py-3
                        text-sm font-medium
                        text-slate-600
                    "
                >
                    <MapPin size={17} />

                    <span>
                        {shift.workplace_name}
                    </span>
                </div>

            )}


            {shift.notes && (

                <div
                    className="
                        mt-4 rounded-xl
                        border border-yellow-200
                        bg-yellow-50 p-4
                    "
                >

                    <div
                        className="
                            flex items-start gap-2
                        "
                    >

                        <AlertCircle
                            size={18}
                            className="
                                mt-0.5 shrink-0
                                text-yellow-600
                            "
                        />

                        <div>

                            <p
                                className="
                                    text-sm font-bold
                                    text-yellow-800
                                "
                            >
                                Yönetici Notu
                            </p>

                            <p
                                className="
                                    mt-1 text-sm
                                    leading-6
                                    text-yellow-700
                                "
                            >
                                {shift.notes}
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


function EmptyState({ title, description }) {

    return (

        <div
            className="
                rounded-2xl border
                border-dashed border-gray-300
                bg-white px-6 py-14
                text-center
            "
        >

            <div
                className="
                    mx-auto flex h-14 w-14
                    items-center justify-center
                    rounded-full bg-gray-100
                    text-gray-500
                "
            >
                <CalendarDays size={28} />
            </div>

            <h3
                className="
                    mt-4 text-lg font-bold
                    text-gray-800
                "
            >
                {title}
            </h3>

            <p
                className="
                    mx-auto mt-2 max-w-md
                    text-sm leading-6
                    text-gray-500
                "
            >
                {description}
            </p>

        </div>

    );

}


function MyShifts() {

    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTab, setSelectedTab] = useState(
        "all"
    );


    const getMyShifts = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                "/shifts/my"
            );

            setShifts(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (requestError) {

            console.error(requestError);

            setError(
                requestError.response?.data?.detail
                || "Vardiya bilgileri alınamadı."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        getMyShifts();

    }, []);


    const activeShifts = useMemo(
        () => shifts.filter(
            (shift) => (
                shift.period_status === "active"
            )
        ),
        [shifts]
    );


    const upcomingShifts = useMemo(
        () => shifts.filter(
            (shift) => (
                shift.period_status === "upcoming"
            )
        ),
        [shifts]
    );


    const pastShifts = useMemo(
        () => shifts.filter(
            (shift) => (
                shift.period_status === "past"
                || shift.period_status === "passive"
            )
        ),
        [shifts]
    );


    const visibleShifts = useMemo(
        () => {

            if (selectedTab === "active") {
                return activeShifts;
            }

            if (selectedTab === "upcoming") {
                return upcomingShifts;
            }

            if (selectedTab === "past") {
                return pastShifts;
            }

            return shifts;

        },
        [
            selectedTab,
            shifts,
            activeShifts,
            upcomingShifts,
            pastShifts
        ]
    );


    const tabs = [
        {
            id: "all",
            title: "Tümü",
            count: shifts.length,
            icon: CalendarDays
        },
        {
            id: "active",
            title: "Aktif",
            count: activeShifts.length,
            icon: CalendarCheck
        },
        {
            id: "upcoming",
            title: "Yaklaşan",
            count: upcomingShifts.length,
            icon: CalendarClock
        },
        {
            id: "past",
            title: "Geçmiş",
            count: pastShifts.length,
            icon: History
        }
    ];


    if (loading) {

        return (

            <div
                className="
                    flex min-h-[400px]
                    items-center justify-center
                "
            >

                <div className="text-center">

                    <div
                        className="
                            mx-auto h-12 w-12
                            animate-spin rounded-full
                            border-4 border-gray-200
                            border-t-indigo-600
                        "
                    />

                    <p
                        className="
                            mt-4 font-medium
                            text-gray-500
                        "
                    >
                        Vardiyalar yükleniyor...
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div className="space-y-6">

            <div
                className="
                    flex flex-col gap-4
                    lg:flex-row lg:items-center
                    lg:justify-between
                "
            >

                <div>

                    <h1
                        className="
                            text-3xl font-bold
                            text-gray-800
                        "
                    >
                        Vardiyalarım
                    </h1>

                    <p
                        className="
                            mt-2 text-gray-500
                        "
                    >
                        Aktif, yaklaşan ve geçmiş
                        vardiya atamalarınızı takip edin.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={getMyShifts}
                    className="
                        inline-flex w-fit
                        items-center gap-2
                        rounded-xl bg-indigo-600
                        px-4 py-2.5
                        font-semibold text-white
                        shadow-sm transition
                        hover:bg-indigo-700
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                    disabled={loading}
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


            {error && (

                <div
                    className="
                        flex items-start gap-3
                        rounded-2xl
                        border border-red-200
                        bg-red-50 p-4
                        text-red-700
                    "
                >
                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>

                        <p className="font-bold">
                            Vardiyalar yüklenemedi
                        </p>

                        <p className="mt-1 text-sm">
                            {error}
                        </p>

                    </div>

                </div>

            )}


            <div
                className="
                    grid gap-4
                    sm:grid-cols-2
                    xl:grid-cols-4
                "
            >

                <div
                    className="
                        rounded-2xl border
                        border-gray-100
                        bg-white p-5
                        shadow-sm
                    "
                >

                    <div
                        className="
                            flex items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-sm font-medium
                                    text-gray-500
                                "
                            >
                                Toplam Atama
                            </p>

                            <p
                                className="
                                    mt-2 text-3xl
                                    font-bold text-gray-800
                                "
                            >
                                {shifts.length}
                            </p>

                        </div>

                        <div
                            className="
                                flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-indigo-100
                                text-indigo-600
                            "
                        >
                            <CalendarDays size={24} />
                        </div>

                    </div>

                </div>


                <div
                    className="
                        rounded-2xl border
                        border-green-100
                        bg-green-50 p-5
                        shadow-sm
                    "
                >

                    <div
                        className="
                            flex items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-sm font-medium
                                    text-green-700
                                "
                            >
                                Aktif Vardiya
                            </p>

                            <p
                                className="
                                    mt-2 text-3xl
                                    font-bold text-green-800
                                "
                            >
                                {activeShifts.length}
                            </p>

                        </div>

                        <div
                            className="
                                flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-green-100
                                text-green-600
                            "
                        >
                            <CalendarCheck size={24} />
                        </div>

                    </div>

                </div>


                <div
                    className="
                        rounded-2xl border
                        border-blue-100
                        bg-blue-50 p-5
                        shadow-sm
                    "
                >

                    <div
                        className="
                            flex items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-sm font-medium
                                    text-blue-700
                                "
                            >
                                Yaklaşan Vardiya
                            </p>

                            <p
                                className="
                                    mt-2 text-3xl
                                    font-bold text-blue-800
                                "
                            >
                                {upcomingShifts.length}
                            </p>

                        </div>

                        <div
                            className="
                                flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-blue-100
                                text-blue-600
                            "
                        >
                            <CalendarClock size={24} />
                        </div>

                    </div>

                </div>


                <div
                    className="
                        rounded-2xl border
                        border-gray-200
                        bg-gray-50 p-5
                        shadow-sm
                    "
                >

                    <div
                        className="
                            flex items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-sm font-medium
                                    text-gray-600
                                "
                            >
                                Geçmiş Vardiya
                            </p>

                            <p
                                className="
                                    mt-2 text-3xl
                                    font-bold text-gray-800
                                "
                            >
                                {pastShifts.length}
                            </p>

                        </div>

                        <div
                            className="
                                flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-gray-200
                                text-gray-600
                            "
                        >
                            <History size={24} />
                        </div>

                    </div>

                </div>

            </div>


            <div
                className="
                    overflow-x-auto
                    rounded-2xl border
                    border-gray-100
                    bg-white p-2
                    shadow-sm
                "
            >

                <div
                    className="
                        flex min-w-max gap-2
                    "
                >

                    {tabs.map((tab) => {

                        const Icon = tab.icon;

                        const isSelected = (
                            selectedTab === tab.id
                        );

                        return (

                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => (
                                    setSelectedTab(tab.id)
                                )}
                                className={`
                                    inline-flex items-center
                                    gap-2 rounded-xl
                                    px-4 py-2.5
                                    text-sm font-semibold
                                    transition
                                    ${isSelected
                                        ? (
                                            "bg-indigo-600 "
                                            + "text-white "
                                            + "shadow-sm"
                                        )
                                        : (
                                            "text-gray-600 "
                                            + "hover:bg-gray-100"
                                        )
                                    }
                                `}
                            >

                                <Icon size={17} />

                                {tab.title}

                                <span
                                    className={`
                                        rounded-full px-2
                                        py-0.5 text-xs
                                        ${isSelected
                                            ? "bg-white/20"
                                            : "bg-gray-100"
                                        }
                                    `}
                                >
                                    {tab.count}
                                </span>

                            </button>

                        );

                    })}

                </div>

            </div>


            {visibleShifts.length === 0 ? (

                <EmptyState
                    title="Vardiya bulunamadı"
                    description={
                        selectedTab === "all"
                            ? (
                                "Henüz size veya ekibinize "
                                + "atanmış bir vardiya yok."
                            )
                            : (
                                "Seçilen kategoride "
                                + "vardiya ataması bulunmuyor."
                            )
                    }
                />

            ) : (

                <div
                    className="
                        grid gap-5
                        xl:grid-cols-2
                    "
                >

                    {visibleShifts.map(
                        (shift) => (

                            <ShiftCard
                                key={shift.id}
                                shift={shift}
                            />

                        )
                    )}

                </div>

            )}

        </div>

    );

}


export default MyShifts;