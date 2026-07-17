import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

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
    AlertCircle,
    MapPin,
    Navigation,
    LoaderCircle,
    PlayCircle,
    StopCircle,
    CheckCircle2
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
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


function formatElapsedTime(totalSeconds) {

    const safeSeconds = Math.max(
        0,
        Math.floor(totalSeconds || 0)
    );

    const hours = Math.floor(
        safeSeconds / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
    );

    const seconds = safeSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");

}


function getLocationErrorMessage(error) {

    if (!error) {
        return "Konum bilgisi alınamadı.";
    }

    switch (error.code) {

        case 1:
            return (
                "Konum izni reddedildi. Tarayıcı ayarlarından " +
                "konum iznini açmalısınız."
            );

        case 2:
            return (
                "Konumunuz belirlenemedi. GPS veya internet " +
                "bağlantınızı kontrol edin."
            );

        case 3:
            return (
                "Konum alma işlemi zaman aşımına uğradı. " +
                "Tekrar deneyin."
            );

        default:
            return "Konum bilgisi alınamadı.";

    }

}


function getCurrentLocation() {

    return new Promise(
        (resolve, reject) => {

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
                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    });

                },

                (error) => {

                    reject({
                        isGeolocationError: true,
                        originalError: error,
                        message:
                            getLocationErrorMessage(error)
                    });

                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }

            );

        }
    );

}


function Dashboard() {

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [errorMessage, setErrorMessage] = useState("");

    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    const [locationStatus, setLocationStatus] =
        useState("Konum kontrolü bekleniyor");

    const [locationAccuracy, setLocationAccuracy] =
        useState(null);

    const [elapsedSeconds, setElapsedSeconds] =
        useState(0);


    const getDashboard = useCallback(

        async ({
            showLoading = false,
            showErrorToast = true
        } = {}) => {

            try {

                if (showLoading) {
                    setLoading(true);
                }

                setErrorMessage("");

                const response = await api.get(
                    "/dashboard/"
                );

                setData(response.data);

                return response.data;

            } catch (error) {

                console.error(
                    "Dashboard yüklenemedi:",
                    error.response?.data ||
                    error.message
                );

                const message =
                    error.response?.data?.detail ||
                    "Dashboard bilgileri yüklenemedi.";

                setErrorMessage(message);

                if (
                    showErrorToast &&
                    error.response?.status !== 401
                ) {

                    toast.error(message);

                }

                return null;

            } finally {

                if (showLoading) {
                    setLoading(false);
                }

            }

        },

        []

    );


    useEffect(() => {

        let isMounted = true;

        const loadDashboard = async () => {

            if (!isMounted) {
                return;
            }

            await getDashboard({
                showLoading: true
            });

        };

        loadDashboard();

        return () => {

            isMounted = false;

        };

    }, [getDashboard]);


    const hasCheckIn = Boolean(
        data?.check_in
    );

    const hasCheckOut = Boolean(
        data?.check_out
    );

    const isWorking =
        hasCheckIn && !hasCheckOut;

    const canCheckIn =
        !hasCheckIn && !attendanceLoading;

    const canCheckOut =
        isWorking && !attendanceLoading;

    const isCompleted =
        hasCheckIn && hasCheckOut;


    useEffect(() => {

        if (!isWorking || !data?.check_in) {

            setElapsedSeconds(0);

            return undefined;

        }

        const calculateElapsed = () => {

            const checkInDate = new Date(
                data.check_in
            );

            if (
                Number.isNaN(
                    checkInDate.getTime()
                )
            ) {

                setElapsedSeconds(0);

                return;

            }

            const difference = Math.floor(
                (
                    Date.now() -
                    checkInDate.getTime()
                ) / 1000
            );

            setElapsedSeconds(
                Math.max(0, difference)
            );

        };

        calculateElapsed();

        const intervalId = window.setInterval(
            calculateElapsed,
            1000
        );

        return () => {

            window.clearInterval(intervalId);

        };

    }, [
        isWorking,
        data?.check_in
    ]);


    useEffect(() => {

        if (!isWorking) {
            return undefined;
        }

        const refreshInterval = window.setInterval(
            () => {

                getDashboard({
                    showLoading: false,
                    showErrorToast: false
                });

            },
            60000
        );

        return () => {

            window.clearInterval(
                refreshInterval
            );

        };

    }, [
        isWorking,
        getDashboard
    ]);


    const liveDuration = useMemo(
        () => {

            if (isWorking) {

                return formatElapsedTime(
                    elapsedSeconds
                );

            }

            if (hasCheckIn) {

                return (
                    data?.work_duration ||
                    "0 saat 0 dakika"
                );

            }

            return "00:00:00";

        },
        [
            isWorking,
            elapsedSeconds,
            hasCheckIn,
            data?.work_duration
        ]
    );


    const handleAttendanceAction =
        async (action) => {

            if (attendanceLoading) {
                return;
            }

            const isCheckInAction =
                action === "check-in";

            try {

                setAttendanceLoading(true);

                setLocationStatus(
                    "Konumunuz alınıyor..."
                );

                const location =
                    await getCurrentLocation();

                setLocationAccuracy(
                    Math.round(
                        location.accuracy || 0
                    )
                );

                setLocationStatus(
                    "Konum alındı, iş yeri kontrol ediliyor..."
                );

                const response = await api.post(

                    `/attendance/${action}`,

                    {
                        latitude:
                            location.latitude,

                        longitude:
                            location.longitude
                    }

                );

                const responseData =
                    response.data || {};

                if (isCheckInAction) {

                    setLocationStatus(
                        "İş yeri konumu doğrulandı"
                    );

                    toast.success(
                        responseData.message ||
                        "Mesai başarıyla başlatıldı."
                    );

                    if (
                        responseData.late &&
                        responseData.late_minutes > 0
                    ) {

                        toast(
                            `${responseData.late_minutes} dakika geç giriş yaptınız.`,
                            {
                                icon: "⏰"
                            }
                        );

                    }

                } else {

                    setLocationStatus(
                        "Çıkış konumu doğrulandı"
                    );

                    toast.success(
                        responseData.message ||
                        "Mesai başarıyla bitirildi."
                    );

                }

                await getDashboard({
                    showLoading: false
                });

            } catch (error) {

                console.error(
                    "Mesai işlemi hatası:",
                    error
                );

                let message =
                    "Mesai işlemi gerçekleştirilemedi.";

                if (
                    error?.isGeolocationError
                ) {

                    message =
                        error.message;

                } else if (
                    error instanceof Error &&
                    !error.response
                ) {

                    message =
                        error.message;

                } else {

                    message =
                        error.response?.data?.detail ||
                        message;

                }

                setLocationStatus(
                    "Konum doğrulanamadı"
                );

                toast.error(message);

            } finally {

                setAttendanceLoading(false);

            }

        };


    const statusColor = hasCheckIn
        ? (
            hasCheckOut
                ? "text-blue-600"
                : "text-green-600"
        )
        : "text-orange-600";

    const statusBackground = hasCheckIn
        ? (
            hasCheckOut
                ? "bg-blue-100"
                : "bg-green-100"
        )
        : "bg-orange-100";


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
                        onClick={() => {
                            getDashboard({
                                showLoading: true
                            });
                        }}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
                    >

                        Tekrar Dene

                    </button>

                </div>

            </div>

        );

    }


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


            {/* ========================= */}
            {/* MESAİ İŞLEM KARTI */}
            {/* ========================= */}

            <div
                className={
                    `overflow-hidden rounded-3xl border shadow-lg ${isWorking
                        ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                        : isCompleted
                            ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                            : "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50"
                    }`
                }
            >

                <div className="grid grid-cols-1 gap-8 p-7 lg:grid-cols-[1.4fr_1fr] lg:p-9">

                    <div>

                        <div className="mb-5 flex flex-wrap items-center gap-3">

                            <div
                                className={
                                    `rounded-2xl p-3 ${isWorking
                                        ? "bg-green-600"
                                        : isCompleted
                                            ? "bg-blue-600"
                                            : "bg-orange-500"
                                    }`
                                }
                            >

                                {
                                    isWorking
                                        ? (
                                            <Timer
                                                size={30}
                                                className="text-white"
                                            />
                                        )
                                        : isCompleted
                                            ? (
                                                <CheckCircle2
                                                    size={30}
                                                    className="text-white"
                                                />
                                            )
                                            : (
                                                <Clock
                                                    size={30}
                                                    className="text-white"
                                                />
                                            )
                                }

                            </div>

                            <div>

                                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">

                                    Mesai Durumu

                                </p>

                                <h2
                                    className={
                                        `text-2xl font-bold ${isWorking
                                            ? "text-green-700"
                                            : isCompleted
                                                ? "text-blue-700"
                                                : "text-orange-700"
                                        }`
                                    }
                                >

                                    {
                                        data.status ||
                                        "Bugün giriş yapılmamış"
                                    }

                                </h2>

                            </div>

                        </div>


                        <div className="mb-6">

                            <p className="mb-1 text-sm font-medium text-gray-500">

                                {
                                    isWorking
                                        ? "Canlı Çalışma Süresi"
                                        : isCompleted
                                            ? "Bugünkü Toplam Süre"
                                            : "Mesai Sayacı"
                                }

                            </p>

                            <p className="font-mono text-4xl font-black tracking-wider text-gray-900 md:text-5xl">

                                {liveDuration}

                            </p>

                        </div>


                        <div className="flex flex-wrap gap-3 text-sm">

                            <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-3 shadow-sm">

                                <MapPin
                                    size={19}
                                    className="text-red-500"
                                />

                                <div>

                                    <p className="text-xs text-gray-500">

                                        Konum durumu

                                    </p>

                                    <p className="font-semibold text-gray-800">

                                        {locationStatus}

                                    </p>

                                </div>

                            </div>


                            {
                                locationAccuracy !== null && (

                                    <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-3 shadow-sm">

                                        <Navigation
                                            size={19}
                                            className="text-blue-600"
                                        />

                                        <div>

                                            <p className="text-xs text-gray-500">

                                                Konum hassasiyeti

                                            </p>

                                            <p className="font-semibold text-gray-800">

                                                Yaklaşık ±
                                                {locationAccuracy} metre

                                            </p>

                                        </div>

                                    </div>

                                )
                            }

                        </div>

                    </div>


                    <div className="flex flex-col justify-center rounded-2xl bg-white/90 p-6 shadow-sm">

                        {
                            !hasCheckIn && (

                                <>

                                    <h3 className="mb-2 text-xl font-bold text-gray-800">

                                        Mesainizi Başlatın

                                    </h3>

                                    <p className="mb-6 text-sm leading-6 text-gray-500">

                                        Mesai başlangıcında konumunuz
                                        iş yeri koordinatlarıyla
                                        karşılaştırılacaktır.

                                    </p>

                                    <button
                                        type="button"
                                        disabled={!canCheckIn}
                                        onClick={() => {
                                            handleAttendanceAction(
                                                "check-in"
                                            );
                                        }}
                                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >

                                        {
                                            attendanceLoading
                                                ? (
                                                    <LoaderCircle
                                                        size={25}
                                                        className="animate-spin"
                                                    />
                                                )
                                                : (
                                                    <PlayCircle
                                                        size={25}
                                                    />
                                                )
                                        }

                                        {
                                            attendanceLoading
                                                ? "Konum Kontrol Ediliyor..."
                                                : "Mesaiye Başla"
                                        }

                                    </button>

                                </>

                            )
                        }


                        {
                            isWorking && (

                                <>

                                    <h3 className="mb-2 text-xl font-bold text-green-700">

                                        Mesainiz Devam Ediyor

                                    </h3>

                                    <p className="mb-6 text-sm leading-6 text-gray-500">

                                        Mesaiyi tamamladığınızda
                                        çıkış butonuna basın. Çalışma
                                        süreniz otomatik hesaplanacaktır.

                                    </p>

                                    <button
                                        type="button"
                                        disabled={!canCheckOut}
                                        onClick={() => {
                                            handleAttendanceAction(
                                                "check-out"
                                            );
                                        }}
                                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >

                                        {
                                            attendanceLoading
                                                ? (
                                                    <LoaderCircle
                                                        size={25}
                                                        className="animate-spin"
                                                    />
                                                )
                                                : (
                                                    <StopCircle
                                                        size={25}
                                                    />
                                                )
                                        }

                                        {
                                            attendanceLoading
                                                ? "Konum Kontrol Ediliyor..."
                                                : "Mesaiyi Bitir"
                                        }

                                    </button>

                                </>

                            )
                        }


                        {
                            isCompleted && (

                                <div className="text-center">

                                    <CheckCircle2
                                        size={58}
                                        className="mx-auto mb-4 text-blue-600"
                                    />

                                    <h3 className="mb-2 text-xl font-bold text-blue-700">

                                        Bugünkü Mesai Tamamlandı

                                    </h3>

                                    <p className="text-sm leading-6 text-gray-500">

                                        Giriş ve çıkış bilgileriniz
                                        başarıyla kaydedildi.

                                    </p>

                                </div>

                            )
                        }

                    </div>

                </div>

            </div>
            {/* ========================= */}
            {/* ÖZET KARTLARI */}
            {/* ========================= */}

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
                                    ? (
                                        isWorking
                                            ? liveDuration
                                            : data.work_duration
                                    )
                                    : "Beklemede"
                            }

                        </h2>

                    </div>

                </div>

            </div>


            {/* ========================= */}
            {/* İŞ YERİ VE EKİP */}
            {/* ========================= */}

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


            {/* ========================= */}
            {/* BUGÜNKÜ MESAİ */}
            {/* ========================= */}

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
                                        ? (
                                            isWorking
                                                ? liveDuration
                                                : data.work_duration
                                        )
                                        : "-"
                                }

                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================= */}
            {/* MESAİ HESAPLAMALARI */}
            {/* ========================= */}

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

                    {
                        isWorking && (

                            <p className="mt-2 text-xs text-gray-400">

                                Mesai bitirildiğinde hesaplanır.

                            </p>

                        )
                    }

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

                    {
                        isWorking && (

                            <p className="mt-2 text-xs text-gray-400">

                                Mesai bitirildiğinde hesaplanır.

                            </p>

                        )
                    }

                </div>

            </div>

        </div>

    );

}


export default Dashboard;