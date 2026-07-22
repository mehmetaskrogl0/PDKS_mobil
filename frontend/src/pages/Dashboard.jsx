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
    LoaderCircle,
    PlayCircle,
    StopCircle,
    CheckCircle2
} from "lucide-react";


function formatTime(dateValue) {

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

    const seconds =
        safeSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");

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

                    let message =
                        "Konum bilgisi alınamadı.";

                    if (error.code === 1) {

                        message =
                            "Konum izni reddedildi. Tarayıcı ayarlarından konum izni vermelisiniz.";

                    } else if (error.code === 2) {

                        message =
                            "Konum belirlenemedi. GPS ve internet bağlantınızı kontrol edin.";

                    } else if (error.code === 3) {

                        message =
                            "Konum alma işlemi zaman aşımına uğradı.";

                    }

                    reject(
                        new Error(message)
                    );

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

    const [data, setData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [
        attendanceLoading,
        setAttendanceLoading
    ] = useState(false);

    const [
        elapsedSeconds,
        setElapsedSeconds
    ] = useState(0);

    const [
        locationText,
        setLocationText
    ] = useState(
        "Mesai başlangıcında kontrol edilir"
    );


    const getDashboard = useCallback(
        async (showLoading = false) => {

            try {

                if (showLoading) {
                    setLoading(true);
                }

                setErrorMessage("");

                const response = await api.get(
                    "/dashboard"
                );

                setData(response.data);

                return response.data;

            } catch (error) {

                console.error(
                    "Dashboard yükleme hatası:",
                    error
                );

                const message =
                    error.response?.data?.detail ||
                    "Dashboard bilgileri yüklenemedi.";

                setErrorMessage(message);

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

        getDashboard(true);

    }, [getDashboard]);


    const hasCheckIn =
        Boolean(data?.check_in);

    const hasCheckOut =
        Boolean(data?.check_out);

    const isWorking =
        hasCheckIn && !hasCheckOut;

    const isCompleted =
        hasCheckIn && hasCheckOut;


    useEffect(() => {

        if (!isWorking || !data?.check_in) {

            setElapsedSeconds(0);

            return undefined;

        }

        const updateElapsedTime = () => {

            const checkInDate =
                new Date(data.check_in);

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


        updateElapsedTime();

        const intervalId =
            window.setInterval(
                updateElapsedTime,
                1000
            );


        return () => {

            window.clearInterval(intervalId);

        };

    }, [
        isWorking,
        data?.check_in
    ]);


    const workDuration = useMemo(
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


    const handleAttendance = async (action) => {

        if (attendanceLoading) {
            return;
        }

        const isCheckIn =
            action === "check-in";

        const loadingToast = toast.loading(
            isCheckIn
                ? "Konumunuz kontrol ediliyor..."
                : "Çıkış konumunuz kontrol ediliyor..."
        );

        try {

            setAttendanceLoading(true);

            setLocationText(
                "Konum alınıyor..."
            );

            const location =
                await getCurrentLocation();

            setLocationText(
                `Konum alındı, yaklaşık ±${Math.round(
                    location.accuracy || 0
                )} metre`
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

            setLocationText(
                "İş yeri konumu doğrulandı"
            );

            toast.success(
                response.data?.message ||
                (
                    isCheckIn
                        ? "Mesai başlatıldı."
                        : "Mesai bitirildi."
                ),
                {
                    id: loadingToast
                }
            );

            await getDashboard(false);

        } catch (error) {

            console.error(
                "Mesai işlemi hatası:",
                error
            );

            setLocationText(
                "Konum doğrulanamadı"
            );

            toast.error(
                error.response?.data?.detail ||
                error.message ||
                "Mesai işlemi gerçekleştirilemedi.",
                {
                    id: loadingToast
                }
            );

        } finally {

            setAttendanceLoading(false);

        }

    };


    if (loading) {

        return (

            <div
                className="
                    flex min-h-[500px]
                    items-center
                    justify-center
                "
            >

                <div className="text-center">

                    <LoaderCircle
                        size={42}
                        className="
                            mx-auto
                            animate-spin
                            text-blue-600
                        "
                    />

                    <p className="mt-4 text-slate-500">

                        Kontrol paneli yükleniyor...

                    </p>

                </div>

            </div>

        );

    }


    if (errorMessage || !data) {

        return (

            <div
                className="
                    flex min-h-[500px]
                    items-center
                    justify-center
                "
            >

                <div
                    className="
                        w-full
                        max-w-md
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-8
                        text-center
                        shadow-sm
                    "
                >

                    <AlertCircle
                        size={48}
                        className="
                            mx-auto
                            text-red-500
                        "
                    />

                    <h2
                        className="
                            mt-4
                            text-xl
                            font-bold
                            text-slate-800
                        "
                    >
                        Dashboard yüklenemedi
                    </h2>

                    <p className="mt-2 text-slate-500">

                        {
                            errorMessage ||
                            "Sunucudan veri alınamadı."
                        }

                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            getDashboard(true);
                        }}
                        className="
                            mt-6
                            rounded-xl
                            bg-blue-600
                            px-5 py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                    >
                        Tekrar Dene
                    </button>

                </div>

            </div>

        );

    }


    const statusText =

        data.status ||

        (
            isWorking
                ? "Çalışıyor"
                : isCompleted
                    ? "Mesai tamamlandı"
                    : "Bugün giriş yapılmamış"
        );


    return (

        <div className="space-y-6">

            {/* Başlık */}

            <div>

                <h1
                    className="
                        text-2xl
                        font-bold
                        text-slate-800
                        sm:text-3xl
                    "
                >
                    PDKS Kontrol Paneli
                </h1>

                <p className="mt-2 text-slate-500">

                    Personel devam ve çalışma bilgileri

                </p>

            </div>


            {/* Üst kartlar */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-5
                    sm:grid-cols-2
                    xl:grid-cols-4
                "
            >

                <InfoCard
                    title="Personel"
                    value={data.user || "-"}
                    icon={User}
                    iconClass="bg-blue-100 text-blue-600"
                />

                <InfoCard
                    title="Durum"
                    value={statusText}
                    icon={Clock}
                    iconClass={
                        isWorking
                            ? "bg-green-100 text-green-600"
                            : isCompleted
                                ? "bg-blue-100 text-blue-600"
                                : "bg-orange-100 text-orange-600"
                    }
                />

                <InfoCard
                    title="Onaylı İzin"
                    value={
                        `${data.approved_leave_count ?? 0} Gün`
                    }
                    icon={CalendarCheck}
                    iconClass="bg-purple-100 text-purple-600"
                />

                <InfoCard
                    title="Çalışma Süresi"
                    value={
                        hasCheckIn
                            ? workDuration
                            : "Beklemede"
                    }
                    icon={Timer}
                    iconClass="bg-orange-100 text-orange-600"
                />

            </div>


            {/* Mesai işlemi */}

            <div
                className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >

                <div
                    className="
                        flex flex-col
                        gap-5
                        border-b
                        border-slate-100
                        p-6
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                    "
                >

                    <div className="flex items-center gap-4">

                        <div
                            className={`
                                flex h-14 w-14
                                items-center
                                justify-center
                                rounded-2xl
                                ${isWorking
                                    ? "bg-green-100 text-green-600"
                                    : isCompleted
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-orange-100 text-orange-600"
                                }
                            `}
                        >

                            {
                                isWorking
                                    ? <Timer size={28} />
                                    : isCompleted
                                        ? <CheckCircle2 size={28} />
                                        : <Clock size={28} />
                            }

                        </div>


                        <div>

                            <p
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-500
                                "
                            >
                                Güncel mesai durumu
                            </p>

                            <h2
                                className="
                                    mt-1
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                {statusText}
                            </h2>

                        </div>

                    </div>


                    <div
                        className="
                            flex flex-col
                            gap-3
                            sm:flex-row
                        "
                    >

                        <button
                            type="button"
                            disabled={
                                attendanceLoading ||
                                hasCheckIn
                            }
                            onClick={() => {
                                handleAttendance(
                                    "check-in"
                                );
                            }}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-green-600
                                px-6 py-3
                                font-semibold
                                text-white
                                transition
                                hover:bg-green-700
                                disabled:cursor-not-allowed
                                disabled:bg-slate-300
                            "
                        >

                            {
                                attendanceLoading
                                    ? (
                                        <LoaderCircle
                                            size={20}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <PlayCircle size={20} />
                                    )
                            }

                            Mesaiye Başla

                        </button>


                        <button
                            type="button"
                            disabled={
                                attendanceLoading ||
                                !isWorking
                            }
                            onClick={() => {
                                handleAttendance(
                                    "check-out"
                                );
                            }}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-red-600
                                px-6 py-3
                                font-semibold
                                text-white
                                transition
                                hover:bg-red-700
                                disabled:cursor-not-allowed
                                disabled:bg-slate-300
                            "
                        >

                            {
                                attendanceLoading
                                    ? (
                                        <LoaderCircle
                                            size={20}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <StopCircle size={20} />
                                    )
                            }

                            Mesaiyi Bitir

                        </button>

                    </div>

                </div>


                <div
                    className="
                        grid
                        grid-cols-1
                        gap-4
                        p-6
                        sm:grid-cols-2
                        xl:grid-cols-4
                    "
                >

                    <DetailCard
                        title="Giriş Saati"
                        value={formatTime(data.check_in)}
                        icon={LogIn}
                        iconClass="text-green-600"
                    />

                    <DetailCard
                        title="Çıkış Saati"
                        value={
                            isWorking
                                ? "Devam ediyor"
                                : formatTime(
                                    data.check_out
                                )
                        }
                        icon={LogOut}
                        iconClass="text-red-600"
                    />

                    <DetailCard
                        title="Çalışma Süresi"
                        value={workDuration}
                        icon={Timer}
                        iconClass="text-blue-600"
                        mono
                    />

                    <DetailCard
                        title="Konum Kontrolü"
                        value={locationText}
                        icon={MapPin}
                        iconClass="text-purple-600"
                    />

                </div>

            </div>


            {/* İş yeri ve ekip */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-5
                    lg:grid-cols-2
                "
            >

                <InfoCard
                    title="İş Yeri"
                    value={
                        data.workplace_name ||
                        "Atanmamış"
                    }
                    icon={Building2}
                    iconClass="bg-cyan-100 text-cyan-600"
                />

                <InfoCard
                    title="Ekip"
                    value={
                        data.team_name ||
                        "Ekibe atanmamış"
                    }
                    icon={Users}
                    iconClass="bg-indigo-100 text-indigo-600"
                />

            </div>


            {/* Hesaplamalar */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-5
                    md:grid-cols-3
                "
            >

                <CalculationCard
                    title="Geç Kalma"
                    value={
                        !hasCheckIn
                            ? "Henüz giriş yapılmadı"
                            : data.late
                                ? `${data.late_minutes ?? 0} dakika`
                                : "Zamanında giriş"
                    }
                    valueClass={
                        data.late
                            ? "text-red-600"
                            : "text-green-600"
                    }
                />

                <CalculationCard
                    title="Fazla Mesai"
                    value={
                        `${data.overtime_minutes ?? 0} dakika`
                    }
                    valueClass="text-blue-600"
                />

                <CalculationCard
                    title="Eksik Çalışma"
                    value={
                        `${data.missing_minutes ?? 0} dakika`
                    }
                    valueClass={
                        (data.missing_minutes ?? 0) > 0
                            ? "text-red-600"
                            : "text-green-600"
                    }
                />

            </div>

        </div>

    );

}


function InfoCard({
    title,
    value,
    icon: Icon,
    iconClass
}) {

    return (

        <div
            className="
                flex min-h-32
                items-center
                gap-4
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
            "
        >

            <div
                className={`
                    flex h-14 w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    ${iconClass}
                `}
            >

                <Icon size={28} />

            </div>


            <div className="min-w-0">

                <p className="text-sm text-slate-500">

                    {title}

                </p>

                <h2
                    className="
                        mt-1
                        truncate
                        text-lg
                        font-bold
                        text-slate-800
                    "
                >

                    {value}

                </h2>

            </div>

        </div>

    );

}


function DetailCard({
    title,
    value,
    icon: Icon,
    iconClass,
    mono = false
}) {

    return (

        <div
            className="
                rounded-xl
                bg-slate-50
                p-4
            "
        >

            <div
                className="
                    flex items-center
                    gap-2
                    text-sm
                    font-medium
                    text-slate-500
                "
            >

                <Icon
                    size={18}
                    className={iconClass}
                />

                {title}

            </div>

            <p
                className={`
                    mt-3
                    font-bold
                    text-slate-800
                    ${mono
                        ? "font-mono text-xl"
                        : "text-base"
                    }
                `}
            >

                {value}

            </p>

        </div>

    );

}


function CalculationCard({
    title,
    value,
    valueClass
}) {

    return (

        <div
            className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
            "
        >

            <h3
                className="
                    text-sm
                    font-semibold
                    text-slate-500
                "
            >

                {title}

            </h3>

            <p
                className={`
                    mt-3
                    text-lg
                    font-bold
                    ${valueClass}
                `}
            >

                {value}

            </p>

        </div>

    );

}


export default Dashboard;