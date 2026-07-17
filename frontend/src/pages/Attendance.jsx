import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../api/axios";
import toast from "react-hot-toast";

import {
    Clock,
    LogIn,
    LogOut,
    MapPin,
    CalendarDays,
    RefreshCw,
    Filter,
    Search,
    Download,
    Timer,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    X,
    FileSpreadsheet
} from "lucide-react";


function Attendance() {

    const [dashboard, setDashboard] = useState(null);

    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [searchText, setSearchText] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [liveSeconds, setLiveSeconds] =
        useState(0);


    const getDashboard = useCallback(async () => {

        try {

            const response = await api.get(
                "/dashboard"
            );

            setDashboard(response.data);

        } catch (error) {

            console.error(
                "Dashboard bilgileri alınamadı:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Dashboard bilgileri alınamadı."
            );

        }

    }, []);


    const getAttendanceRecords =
        useCallback(async () => {

            try {

                const response = await api.get(
                    "/attendance/my-attendance"
                );

                let attendanceData = [];

                if (Array.isArray(response.data)) {

                    attendanceData =
                        response.data;

                } else if (
                    Array.isArray(
                        response.data?.records
                    )
                ) {

                    attendanceData =
                        response.data.records;

                }

                const sortedRecords = [
                    ...attendanceData
                ].sort((firstRecord, secondRecord) => {

                    const firstDate = new Date(
                        firstRecord.check_in || 0
                    ).getTime();

                    const secondDate = new Date(
                        secondRecord.check_in || 0
                    ).getTime();

                    return secondDate - firstDate;

                });

                setRecords(sortedRecords);

            } catch (error) {

                console.error(
                    "Mesai kayıtları alınamadı:",
                    error
                );

                setRecords([]);

                toast.error(
                    error.response?.data?.detail ||
                    "Mesai kayıtları alınamadı."
                );

            }

        }, []);


    const loadPage = useCallback(async () => {

        setLoading(true);

        await Promise.all([
            getDashboard(),
            getAttendanceRecords()
        ]);

        setLoading(false);

    }, [
        getDashboard,
        getAttendanceRecords
    ]);


    useEffect(() => {

        loadPage();

    }, [loadPage]);


    const isWorking =
        dashboard?.status === "Çalışıyor" ||
        (
            Boolean(dashboard?.check_in) &&
            !dashboard?.check_out
        );


    useEffect(() => {

        if (
            !isWorking ||
            !dashboard?.check_in
        ) {

            setLiveSeconds(0);

            return undefined;

        }

        const calculateLiveSeconds = () => {

            const checkInDate = new Date(
                dashboard.check_in
            );

            if (
                Number.isNaN(
                    checkInDate.getTime()
                )
            ) {

                setLiveSeconds(0);

                return;

            }

            const difference = Math.floor(
                (
                    Date.now() -
                    checkInDate.getTime()
                ) / 1000
            );

            setLiveSeconds(
                Math.max(0, difference)
            );

        };

        calculateLiveSeconds();

        const intervalId = window.setInterval(
            calculateLiveSeconds,
            1000
        );

        return () => {

            window.clearInterval(intervalId);

        };

    }, [
        isWorking,
        dashboard?.check_in
    ]);


    const getLocation = () => {

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

                    (locationError) => {

                        if (
                            locationError.code === 1
                        ) {

                            reject(
                                new Error(
                                    "Konum izni reddedildi. Tarayıcı ayarlarından konum izni vermelisiniz."
                                )
                            );

                        } else if (
                            locationError.code === 2
                        ) {

                            reject(
                                new Error(
                                    "Konum bilgisi alınamadı. GPS ve internet bağlantınızı kontrol edin."
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

            }
        );

    };


    const handleCheckIn = async () => {

        if (actionLoading) {
            return;
        }

        setActionLoading(true);

        const loadingToast = toast.loading(
            "Konumunuz kontrol ediliyor..."
        );

        try {

            const location =
                await getLocation();

            const response = await api.post(
                "/attendance/check-in",
                {
                    latitude:
                        location.latitude,

                    longitude:
                        location.longitude
                }
            );

            toast.success(
                response.data?.message ||
                "Mesai girişiniz başarıyla yapıldı.",
                {
                    id: loadingToast
                }
            );

            await loadPage();

        } catch (error) {

            console.error(
                "Mesai giriş hatası:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.message ||
                "Mesai girişi yapılamadı.",
                {
                    id: loadingToast
                }
            );

        } finally {

            setActionLoading(false);

        }

    };


    const handleCheckOut = async () => {

        if (actionLoading) {
            return;
        }

        setActionLoading(true);

        const loadingToast = toast.loading(
            "Çıkış konumunuz kontrol ediliyor..."
        );

        try {

            const location =
                await getLocation();

            const response = await api.post(
                "/attendance/check-out",
                {
                    latitude:
                        location.latitude,

                    longitude:
                        location.longitude
                }
            );

            toast.success(
                response.data?.message ||
                "Mesai çıkışınız başarıyla yapıldı.",
                {
                    id: loadingToast
                }
            );

            await loadPage();

        } catch (error) {

            console.error(
                "Mesai çıkış hatası:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.message ||
                "Mesai çıkışı yapılamadı.",
                {
                    id: loadingToast
                }
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

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
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

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
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


    const formatLiveDuration = (
        totalSeconds
    ) => {

        const safeSeconds = Math.max(
            0,
            Math.floor(totalSeconds || 0)
        );

        const hours = Math.floor(
            safeSeconds / 3600
        );

        const minutes = Math.floor(
            (
                safeSeconds % 3600
            ) / 60
        );

        const seconds =
            safeSeconds % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0")
        ].join(":");

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
            Number.isNaN(
                start.getTime()
            ) ||
            Number.isNaN(
                end.getTime()
            )
        ) {

            return "-";

        }

        const difference = Math.max(
            0,
            end.getTime() -
            start.getTime()
        );

        const totalMinutes = Math.floor(
            difference / 60000
        );

        const hours = Math.floor(
            totalMinutes / 60
        );

        const minutes =
            totalMinutes % 60;

        return `${hours} saat ${minutes} dakika`;

    };


    const getLateMinutes = (record) => {

        return Number(
            record.late_minutes ??
            record.late ??
            0
        );

    };


    const getOvertimeMinutes = (record) => {

        return Number(
            record.overtime_minutes ??
            record.overtime ??
            0
        );

    };


    const getMissingMinutes = (record) => {

        return Number(
            record.missing_minutes ??
            record.missing ??
            0
        );

    };


    const getRecordStatus = (record) => {

        if (!record.check_out) {
            return "working";
        }

        if (
            getMissingMinutes(record) > 0
        ) {
            return "missing";
        }

        if (
            getLateMinutes(record) > 0
        ) {
            return "late";
        }

        if (
            getOvertimeMinutes(record) > 0
        ) {
            return "overtime";
        }

        return "completed";

    };


    const getStatusText = (record) => {

        const status =
            getRecordStatus(record);

        if (status === "working") {
            return "Çalışıyor";
        }

        if (status === "missing") {
            return "Eksik çalışma";
        }

        if (status === "late") {
            return "Geç giriş";
        }

        if (status === "overtime") {
            return "Fazla mesai";
        }

        return "Tamamlandı";

    };


    const getStatusClass = (record) => {

        const status =
            getRecordStatus(record);

        if (status === "working") {

            return (
                "bg-green-100 text-green-700"
            );

        }

        if (status === "missing") {

            return (
                "bg-red-100 text-red-700"
            );

        }

        if (status === "late") {

            return (
                "bg-orange-100 text-orange-700"
            );

        }

        if (status === "overtime") {

            return (
                "bg-purple-100 text-purple-700"
            );

        }

        return "bg-blue-100 text-blue-700";

    };


    const filteredRecords = useMemo(() => {

        return records.filter((record) => {

            const recordDate = record.check_in
                ? new Date(record.check_in)
                : null;

            if (
                recordDate &&
                Number.isNaN(
                    recordDate.getTime()
                )
            ) {
                return false;
            }

            if (startDate && recordDate) {

                const filterStart =
                    new Date(
                        `${startDate}T00:00:00`
                    );

                if (
                    recordDate < filterStart
                ) {
                    return false;
                }

            }

            if (endDate && recordDate) {

                const filterEnd =
                    new Date(
                        `${endDate}T23:59:59`
                    );

                if (
                    recordDate > filterEnd
                ) {
                    return false;
                }

            }

            if (statusFilter !== "all") {

                const recordStatus =
                    getRecordStatus(record);

                if (
                    recordStatus !==
                    statusFilter
                ) {
                    return false;
                }

            }

            if (searchText.trim()) {

                const searchableText = [
                    formatDate(record.check_in),
                    formatTime(record.check_in),
                    formatTime(record.check_out),
                    getStatusText(record)
                ]
                    .join(" ")
                    .toLocaleLowerCase("tr-TR");

                if (
                    !searchableText.includes(
                        searchText
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            )
                    )
                ) {
                    return false;
                }

            }

            return true;

        });

    }, [
        records,
        startDate,
        endDate,
        statusFilter,
        searchText
    ]);


    const statistics = useMemo(() => {

        return filteredRecords.reduce(
            (summary, record) => {

                summary.total += 1;

                summary.lateMinutes +=
                    getLateMinutes(record);

                summary.overtimeMinutes +=
                    getOvertimeMinutes(record);

                summary.missingMinutes +=
                    getMissingMinutes(record);

                if (!record.check_out) {
                    summary.active += 1;
                }

                return summary;

            },
            {
                total: 0,
                lateMinutes: 0,
                overtimeMinutes: 0,
                missingMinutes: 0,
                active: 0
            }
        );

    }, [filteredRecords]);


    const resetFilters = () => {

        setSearchText("");
        setStatusFilter("all");
        setStartDate("");
        setEndDate("");

    };


    const escapeCsvValue = (value) => {

        const stringValue =
            String(value ?? "");

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;

    };


    const exportToCsv = () => {

        if (
            filteredRecords.length === 0
        ) {

            toast.error(
                "Dışa aktarılacak mesai kaydı bulunamadı."
            );

            return;

        }

        const headers = [
            "Tarih",
            "Giriş Saati",
            "Çıkış Saati",
            "Çalışma Süresi",
            "Geç Kalma (Dakika)",
            "Fazla Mesai (Dakika)",
            "Eksik Çalışma (Dakika)",
            "Durum"
        ];

        const rows = filteredRecords.map(
            (record) => {

                return [
                    formatDate(
                        record.check_in
                    ),
                    formatTime(
                        record.check_in
                    ),
                    formatTime(
                        record.check_out
                    ),
                    record.duration ||
                    record.work_duration ||
                    calculateDuration(
                        record.check_in,
                        record.check_out
                    ),
                    getLateMinutes(record),
                    getOvertimeMinutes(record),
                    getMissingMinutes(record),
                    getStatusText(record)
                ];

            }
        );

        const csvContent = [
            headers,
            ...rows
        ]
            .map((row) => {

                return row
                    .map(escapeCsvValue)
                    .join(";");

            })
            .join("\n");

        const blob = new Blob(
            [
                "\uFEFF",
                csvContent
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        const currentDate =
            new Date()
                .toISOString()
                .slice(0, 10);

        link.href = url;

        link.download =
            `mesai-kayitlari-${currentDate}.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        toast.success(
            "Mesai kayıtları Excel uyumlu CSV olarak indirildi."
        );

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

                        Mesai bilgileri yükleniyor...

                    </span>

                </div>

            </div>

        );

    }


    return (

        <div className="space-y-8">

            {/* Sayfa Başlığı */}

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Mesai Takibi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Günlük mesai işlemlerinizi ve geçmiş çalışma kayıtlarınızı yönetin.

                    </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={exportToCsv}
                        disabled={
                            filteredRecords.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >

                        <FileSpreadsheet
                            size={19}
                        />

                        Excel'e Aktar

                    </button>


                    <button
                        type="button"
                        onClick={loadPage}
                        disabled={
                            loading ||
                            actionLoading
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        <RefreshCw
                            size={19}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Yenile

                    </button>

                </div>

            </div>


            {/* Mesai İşlem Kartı */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-4">

                            <div
                                className={
                                    `flex h-14 w-14 items-center justify-center rounded-2xl ${isWorking
                                        ? "bg-green-100 text-green-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`
                                }
                            >

                                <Clock size={28} />

                            </div>


                            <div>

                                <p className="text-sm font-medium text-gray-500">

                                    Güncel mesai durumu

                                </p>

                                <div className="mt-1 flex items-center gap-2">

                                    <span
                                        className={
                                            `h-3 w-3 rounded-full ${isWorking
                                                ? "animate-pulse bg-green-500"
                                                : "bg-gray-400"
                                            }`
                                        }
                                    />

                                    <h2 className="text-2xl font-bold text-gray-800">

                                        {
                                            dashboard?.status ||
                                            "Durum bilinmiyor"
                                        }

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
                                    isWorking ||
                                    Boolean(
                                        dashboard?.check_in
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >

                                {
                                    actionLoading
                                        ? (
                                            <RefreshCw
                                                size={19}
                                                className="animate-spin"
                                            />
                                        )
                                        : (
                                            <LogIn
                                                size={19}
                                            />
                                        )
                                }

                                Mesaiye Başla

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

                                {
                                    actionLoading
                                        ? (
                                            <RefreshCw
                                                size={19}
                                                className="animate-spin"
                                            />
                                        )
                                        : (
                                            <LogOut
                                                size={19}
                                            />
                                        )
                                }

                                Mesaiyi Bitir

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

                            {
                                formatTime(
                                    dashboard?.check_in
                                )
                            }

                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <LogOut size={17} />

                            Çıkış Saati

                        </div>

                        <p className="mt-3 text-xl font-bold text-gray-800">

                            {
                                isWorking
                                    ? "Devam ediyor"
                                    : formatTime(
                                        dashboard?.check_out
                                    )
                            }

                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <Timer size={17} />

                            Çalışma Süresi

                        </div>

                        <p className="mt-3 font-mono text-xl font-bold text-gray-800">

                            {
                                isWorking
                                    ? formatLiveDuration(
                                        liveSeconds
                                    )
                                    : (
                                        dashboard?.work_duration ||
                                        "0 saat 0 dakika"
                                    )
                            }

                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">

                            <MapPin size={17} />

                            Konum Kontrolü

                        </div>

                        <p className="mt-3 text-xl font-bold text-green-600">

                            Aktif

                        </p>

                    </div>

                </div>

            </div>


            {/* İstatistik Kartları */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Toplam Kayıt

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {statistics.total}

                            </p>

                        </div>

                        <div className="rounded-xl bg-blue-100 p-3">

                            <CalendarDays
                                size={25}
                                className="text-blue-600"
                            />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Geç Kalma

                            </p>

                            <p className="mt-2 text-3xl font-bold text-orange-600">

                                {
                                    statistics.lateMinutes
                                }

                                <span className="ml-1 text-sm font-medium">

                                    dk

                                </span>

                            </p>

                        </div>

                        <div className="rounded-xl bg-orange-100 p-3">

                            <AlertTriangle
                                size={25}
                                className="text-orange-600"
                            />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Fazla Mesai

                            </p>

                            <p className="mt-2 text-3xl font-bold text-purple-600">

                                {
                                    statistics.overtimeMinutes
                                }

                                <span className="ml-1 text-sm font-medium">

                                    dk

                                </span>

                            </p>

                        </div>

                        <div className="rounded-xl bg-purple-100 p-3">

                            <TrendingUp
                                size={25}
                                className="text-purple-600"
                            />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Eksik Çalışma

                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-600">

                                {
                                    statistics.missingMinutes
                                }

                                <span className="ml-1 text-sm font-medium">

                                    dk

                                </span>

                            </p>

                        </div>

                        <div className="rounded-xl bg-red-100 p-3">

                            <TrendingDown
                                size={25}
                                className="text-red-600"
                            />

                        </div>

                    </div>

                </div>

            </div>


            {/* Filtreler */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                        <Filter
                            size={21}
                            className="text-blue-600"
                        />

                        <h2 className="text-lg font-bold text-gray-800">

                            Kayıt Filtreleri

                        </h2>

                    </div>


                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >

                        <X size={17} />

                        Temizle

                    </button>

                </div>


                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Arama

                        </label>

                        <div className="relative">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => {
                                    setSearchText(
                                        event.target.value
                                    );
                                }}
                                placeholder="Tarih veya durum ara..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Durum

                        </label>

                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value
                                );
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >

                            <option value="all">

                                Tüm durumlar

                            </option>

                            <option value="completed">

                                Tamamlandı

                            </option>

                            <option value="working">

                                Çalışıyor

                            </option>

                            <option value="late">

                                Geç giriş

                            </option>

                            <option value="overtime">

                                Fazla mesai

                            </option>

                            <option value="missing">

                                Eksik çalışma

                            </option>

                        </select>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Başlangıç Tarihi

                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => {
                                setStartDate(
                                    event.target.value
                                );
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Bitiş Tarihi

                        </label>

                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(event) => {
                                setEndDate(
                                    event.target.value
                                );
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                    </div>

                </div>

            </div>


            {/* Mesai Tablosu */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            Mesai Kayıtları

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            {
                                filteredRecords.length
                            } kayıt görüntüleniyor

                        </p>

                    </div>

                    <Download
                        size={24}
                        className="text-gray-400"
                    />

                </div>


                {
                    filteredRecords.length === 0
                        ? (

                            <div className="p-12 text-center">

                                <CalendarDays
                                    size={52}
                                    className="mx-auto mb-4 text-gray-300"
                                />

                                <h3 className="text-lg font-bold text-gray-700">

                                    Mesai kaydı bulunamadı

                                </h3>

                                <p className="mt-2 text-gray-500">

                                    Seçilen filtrelere uygun bir kayıt bulunmuyor.

                                </p>

                            </div>

                        )
                        : (

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Tarih

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Giriş

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Çıkış

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Süre

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Geç Kalma

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Fazla Mesai

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Eksik Çalışma

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Durum

                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-gray-100">

                                        {
                                            filteredRecords.map(
                                                (
                                                    record,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            record.id ||
                                                            index
                                                        }
                                                        className="transition hover:bg-gray-50"
                                                    >

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800">

                                                            {
                                                                formatDate(
                                                                    record.check_in
                                                                )
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">

                                                            <div className="flex items-center gap-2">

                                                                <LogIn
                                                                    size={16}
                                                                    className="text-green-600"
                                                                />

                                                                {
                                                                    formatTime(
                                                                        record.check_in
                                                                    )
                                                                }

                                                            </div>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">

                                                            <div className="flex items-center gap-2">

                                                                <LogOut
                                                                    size={16}
                                                                    className="text-red-600"
                                                                />

                                                                {
                                                                    record.check_out
                                                                        ? formatTime(
                                                                            record.check_out
                                                                        )
                                                                        : "Devam ediyor"
                                                                }

                                                            </div>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">

                                                            {
                                                                record.duration ||
                                                                record.work_duration ||
                                                                calculateDuration(
                                                                    record.check_in,
                                                                    record.check_out
                                                                )
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    getLateMinutes(
                                                                        record
                                                                    ) > 0
                                                                        ? "font-semibold text-orange-600"
                                                                        : "text-gray-500"
                                                                }
                                                            >

                                                                {
                                                                    getLateMinutes(
                                                                        record
                                                                    )
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    getOvertimeMinutes(
                                                                        record
                                                                    ) > 0
                                                                        ? "font-semibold text-purple-600"
                                                                        : "text-gray-500"
                                                                }
                                                            >

                                                                {
                                                                    getOvertimeMinutes(
                                                                        record
                                                                    )
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    getMissingMinutes(
                                                                        record
                                                                    ) > 0
                                                                        ? "font-semibold text-red-600"
                                                                        : "text-gray-500"
                                                                }
                                                            >

                                                                {
                                                                    getMissingMinutes(
                                                                        record
                                                                    )
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4">

                                                            <span
                                                                className={
                                                                    `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                        record
                                                                    )
                                                                    }`
                                                                }
                                                            >

                                                                {
                                                                    record.check_out
                                                                        ? (
                                                                            <CheckCircle2
                                                                                size={14}
                                                                            />
                                                                        )
                                                                        : (
                                                                            <Clock
                                                                                size={14}
                                                                            />
                                                                        )
                                                                }

                                                                {
                                                                    getStatusText(
                                                                        record
                                                                    )
                                                                }

                                                            </span>

                                                        </td>

                                                    </tr>

                                                )
                                            )
                                        }

                                    </tbody>

                                </table>

                            </div>

                        )
                }

            </div>

        </div>

    );

}


export default Attendance;