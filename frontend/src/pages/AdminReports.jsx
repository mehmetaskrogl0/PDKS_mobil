import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../api/axios";
import toast from "react-hot-toast";

import {
    Activity,
    AlertTriangle,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    FileSpreadsheet,
    Filter,
    RefreshCw,
    Search,
    Timer,
    TrendingDown,
    TrendingUp,
    Users,
    UserRound,
    X
} from "lucide-react";


const PAGE_SIZE = 10;


function AdminReports() {

    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] =
        useState(false);

    const [error, setError] = useState("");

    const [searchText, setSearchText] =
        useState("");

    const [selectedUserId, setSelectedUserId] =
        useState("");

    const [
        selectedWorkplaceId,
        setSelectedWorkplaceId
    ] = useState("");

    const [selectedTeamId, setSelectedTeamId] =
        useState("");

    const [selectedStatus, setSelectedStatus] =
        useState("");

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);


    const buildQueryParams = useCallback(() => {

        const params = {
            skip: 0,
            limit: 500
        };

        if (selectedUserId) {

            params.user_id =
                Number(selectedUserId);

        }

        if (selectedWorkplaceId) {

            params.workplace_id =
                Number(selectedWorkplaceId);

        }

        if (selectedTeamId) {

            params.team_id =
                Number(selectedTeamId);

        }

        if (selectedStatus) {

            params.status =
                selectedStatus;

        }

        if (startDate) {

            params.start_date =
                startDate;

        }

        if (endDate) {

            params.end_date =
                endDate;

        }

        return params;

    }, [
        selectedUserId,
        selectedWorkplaceId,
        selectedTeamId,
        selectedStatus,
        startDate,
        endDate
    ]);


    const getReportRecords =
        useCallback(async () => {

            setLoading(true);
            setError("");

            try {

                const response = await api.get(
                    "/reports/admin/attendance",
                    {
                        params:
                            buildQueryParams()
                    }
                );

                const responseRecords =
                    Array.isArray(
                        response.data?.records
                    )
                        ? response.data.records
                        : [];

                setRecords(responseRecords);

                setCurrentPage(1);

            } catch (requestError) {

                console.error(
                    "Admin raporları alınamadı:",
                    requestError
                );

                setRecords([]);

                if (
                    requestError.response?.status ===
                    403
                ) {

                    setError(
                        "Bu raporları görüntülemek için admin yetkisine sahip olmalısınız."
                    );

                } else if (
                    requestError.response?.status ===
                    401
                ) {

                    setError(
                        "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın."
                    );

                } else {

                    setError(
                        requestError.response?.data
                            ?.detail ||
                        "Mesai raporları alınamadı."
                    );

                }

            } finally {

                setLoading(false);

            }

        }, [buildQueryParams]);


    useEffect(() => {

        getReportRecords();

    }, [getReportRecords]);


    useEffect(() => {

        setCurrentPage(1);

    }, [searchText]);


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


    const formatMinutes = (minutesValue) => {

        const totalMinutes = Math.max(
            0,
            Number(minutesValue || 0)
        );

        const hours = Math.floor(
            totalMinutes / 60
        );

        const minutes =
            totalMinutes % 60;

        if (hours === 0) {

            return `${minutes} dk`;

        }

        return `${hours} sa ${minutes} dk`;

    };


    const users = useMemo(() => {

        const userMap = new Map();

        records.forEach((record) => {

            if (
                record.user_id &&
                !userMap.has(record.user_id)
            ) {

                userMap.set(
                    record.user_id,
                    {
                        id: record.user_id,
                        name:
                            record.personel ||
                            "Bilinmeyen personel"
                    }
                );

            }

        });

        return Array.from(
            userMap.values()
        ).sort((first, second) => {

            return first.name.localeCompare(
                second.name,
                "tr"
            );

        });

    }, [records]);


    const workplaces = useMemo(() => {

        const workplaceMap = new Map();

        records.forEach((record) => {

            if (
                record.workplace_id &&
                record.workplace &&
                !workplaceMap.has(
                    record.workplace_id
                )
            ) {

                workplaceMap.set(
                    record.workplace_id,
                    {
                        id:
                            record.workplace_id,

                        name:
                            record.workplace
                    }
                );

            }

        });

        return Array.from(
            workplaceMap.values()
        ).sort((first, second) => {

            return first.name.localeCompare(
                second.name,
                "tr"
            );

        });

    }, [records]);


    const teams = useMemo(() => {

        const teamMap = new Map();

        records.forEach((record) => {

            if (
                record.team_id &&
                record.team &&
                !teamMap.has(record.team_id)
            ) {

                teamMap.set(
                    record.team_id,
                    {
                        id: record.team_id,
                        name: record.team
                    }
                );

            }

        });

        return Array.from(
            teamMap.values()
        ).sort((first, second) => {

            return first.name.localeCompare(
                second.name,
                "tr"
            );

        });

    }, [records]);


    const searchedRecords = useMemo(() => {

        const normalizedSearch =
            searchText
                .trim()
                .toLocaleLowerCase("tr-TR");

        if (!normalizedSearch) {

            return records;

        }

        return records.filter((record) => {

            const searchableText = [

                record.personel,

                record.email,

                record.workplace,

                record.team,

                record.status_text,

                formatDate(record.check_in),

                formatTime(record.check_in),

                formatTime(record.check_out)

            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase("tr-TR");

            return searchableText.includes(
                normalizedSearch
            );

        });

    }, [
        records,
        searchText
    ]);


    const statistics = useMemo(() => {

        return searchedRecords.reduce(
            (summary, record) => {

                summary.totalRecords += 1;

                summary.totalWorkMinutes +=
                    Number(
                        record.duration_minutes ||
                        0
                    );

                summary.totalLateMinutes +=
                    Number(
                        record.late_minutes ||
                        0
                    );

                summary.totalOvertimeMinutes +=
                    Number(
                        record.overtime_minutes ||
                        0
                    );

                summary.totalMissingMinutes +=
                    Number(
                        record.missing_minutes ||
                        0
                    );

                if (
                    record.status === "working"
                ) {

                    summary.activeRecords += 1;

                }

                return summary;

            },
            {
                totalRecords: 0,
                totalWorkMinutes: 0,
                totalLateMinutes: 0,
                totalOvertimeMinutes: 0,
                totalMissingMinutes: 0,
                activeRecords: 0
            }
        );

    }, [searchedRecords]);


    const totalPages = Math.max(
        1,
        Math.ceil(
            searchedRecords.length /
            PAGE_SIZE
        )
    );


    const currentPageRecords = useMemo(() => {

        const safePage = Math.min(
            currentPage,
            totalPages
        );

        const startIndex =
            (safePage - 1) * PAGE_SIZE;

        return searchedRecords.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );

    }, [
        searchedRecords,
        currentPage,
        totalPages
    ]);


    useEffect(() => {

        if (currentPage > totalPages) {

            setCurrentPage(totalPages);

        }

    }, [
        currentPage,
        totalPages
    ]);


    const getStatusText = (record) => {

        if (record.status_text) {

            return record.status_text;

        }

        const statusTexts = {

            working:
                "Çalışıyor",

            completed:
                "Tamamlandı",

            late:
                "Geç giriş",

            overtime:
                "Fazla mesai",

            missing:
                "Eksik çalışma"

        };

        return (
            statusTexts[record.status] ||
            "Bilinmiyor"
        );

    };


    const getStatusClass = (status) => {

        if (status === "working") {

            return (
                "bg-green-100 text-green-700"
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

        if (status === "missing") {

            return (
                "bg-red-100 text-red-700"
            );

        }

        return (
            "bg-blue-100 text-blue-700"
        );

    };


    const resetFilters = () => {

        setSearchText("");

        setSelectedUserId("");

        setSelectedWorkplaceId("");

        setSelectedTeamId("");

        setSelectedStatus("");

        setStartDate("");

        setEndDate("");

        setCurrentPage(1);

    };


    const handleExcelExport = async () => {

        setExportLoading(true);

        const loadingToast = toast.loading(
            "Excel raporu hazırlanıyor..."
        );

        try {

            const params =
                buildQueryParams();

            delete params.skip;
            delete params.limit;

            const response = await api.get(
                "/reports/admin/attendance/excel",
                {
                    params,
                    responseType: "blob"
                }
            );

            const contentDisposition =
                response.headers[
                "content-disposition"
                ];

            let fileName =
                "pdks_admin_mesai_raporu.xlsx";

            if (contentDisposition) {

                const fileNameMatch =
                    contentDisposition.match(
                        /filename="?([^"]+)"?/
                    );

                if (fileNameMatch?.[1]) {

                    fileName =
                        fileNameMatch[1];

                }

            }

            const fileUrl =
                window.URL.createObjectURL(
                    new Blob(
                        [response.data],
                        {
                            type:
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        }
                    )
                );

            const downloadLink =
                document.createElement("a");

            downloadLink.href =
                fileUrl;

            downloadLink.setAttribute(
                "download",
                fileName
            );

            document.body.appendChild(
                downloadLink
            );

            downloadLink.click();

            document.body.removeChild(
                downloadLink
            );

            window.URL.revokeObjectURL(
                fileUrl
            );

            toast.success(
                "Excel raporu başarıyla indirildi.",
                {
                    id: loadingToast
                }
            );

        } catch (requestError) {

            console.error(
                "Excel raporu indirilemedi:",
                requestError
            );

            let errorMessage =
                "Excel raporu indirilemedi.";

            if (
                requestError.response?.data
                instanceof Blob
            ) {

                try {

                    const errorText =
                        await requestError
                            .response
                            .data
                            .text();

                    const parsedError =
                        JSON.parse(errorText);

                    errorMessage =
                        parsedError.detail ||
                        errorMessage;

                } catch {

                    errorMessage =
                        "Excel raporu indirilemedi.";

                }

            } else {

                errorMessage =
                    requestError.response?.data
                        ?.detail ||
                    errorMessage;

            }

            toast.error(
                errorMessage,
                {
                    id: loadingToast
                }
            );

        } finally {

            setExportLoading(false);

        }

    };


    const statisticCards = [

        {
            title: "Toplam Kayıt",
            value:
                statistics.totalRecords,

            description:
                "Filtrelenen mesai kaydı",

            icon: Activity,

            iconClass:
                "bg-blue-100 text-blue-600",

            valueClass:
                "text-gray-800"
        },

        {
            title: "Toplam Çalışma",
            value: formatMinutes(
                statistics.totalWorkMinutes
            ),

            description:
                "Toplam çalışma süresi",

            icon: Timer,

            iconClass:
                "bg-cyan-100 text-cyan-600",

            valueClass:
                "text-cyan-700"
        },

        {
            title: "Geç Kalma",
            value: formatMinutes(
                statistics.totalLateMinutes
            ),

            description:
                "Toplam gecikme süresi",

            icon: Clock3,

            iconClass:
                "bg-orange-100 text-orange-600",

            valueClass:
                "text-orange-600"
        },

        {
            title: "Fazla Mesai",
            value: formatMinutes(
                statistics.totalOvertimeMinutes
            ),

            description:
                "Toplam fazla mesai",

            icon: TrendingUp,

            iconClass:
                "bg-purple-100 text-purple-600",

            valueClass:
                "text-purple-600"
        },

        {
            title: "Eksik Çalışma",
            value: formatMinutes(
                statistics.totalMissingMinutes
            ),

            description:
                "Toplam eksik süre",

            icon: TrendingDown,

            iconClass:
                "bg-red-100 text-red-600",

            valueClass:
                "text-red-600"
        }

    ];


    if (
        loading &&
        records.length === 0
    ) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={24}
                        className="animate-spin"
                    />

                    <span>

                        Mesai raporları yükleniyor...

                    </span>

                </div>

            </div>

        );

    }


    if (
        error &&
        records.length === 0
    ) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">

                        <AlertTriangle
                            size={32}
                        />

                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-800">

                        Mesai Raporları Açılamadı

                    </h2>

                    <p className="mt-2 text-gray-600">

                        {error}

                    </p>

                    <button
                        type="button"
                        onClick={getReportRecords}
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

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Mesai Raporları

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Personel, ekip ve iş yeri bazlı mesai kayıtlarını inceleyin.

                    </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={handleExcelExport}
                        disabled={
                            exportLoading ||
                            searchedRecords.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >

                        {
                            exportLoading
                                ? (
                                    <RefreshCw
                                        size={19}
                                        className="animate-spin"
                                    />
                                )
                                : (
                                    <FileSpreadsheet
                                        size={19}
                                    />
                                )
                        }

                        Excel'e Aktar

                    </button>


                    <button
                        type="button"
                        onClick={getReportRecords}
                        disabled={loading}
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


            {/* İSTATİSTİKLER */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">

                {
                    statisticCards.map(
                        (item) => {

                            const Icon =
                                item.icon;

                            return (

                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >

                                    <div className="flex items-start justify-between gap-4">

                                        <div className="min-w-0">

                                            <p className="text-sm font-medium text-gray-500">

                                                {item.title}

                                            </p>

                                            <p
                                                className={
                                                    `mt-2 break-words text-2xl font-bold ${item.valueClass}`
                                                }
                                            >

                                                {item.value}

                                            </p>

                                            <p className="mt-2 text-xs text-gray-400">

                                                {
                                                    item.description
                                                }

                                            </p>

                                        </div>


                                        <div
                                            className={
                                                `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`
                                            }
                                        >

                                            <Icon size={22} />

                                        </div>

                                    </div>

                                </div>

                            );

                        }
                    )
                }

            </div>


            {/* FİLTRELER */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2">

                        <Filter
                            size={21}
                            className="text-blue-600"
                        />

                        <div>

                            <h2 className="text-lg font-bold text-gray-800">

                                Rapor Filtreleri

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                Filtreleri seçtikten sonra Raporu Getir butonuna basın.

                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >

                        <X size={17} />

                        Filtreleri Temizle

                    </button>

                </div>


                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                    <div className="xl:col-span-2">

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Kayıtlarda Ara

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
                                placeholder="Personel, e-posta, ekip veya iş yeri ara..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Personel

                        </label>

                        <div className="relative">

                            <UserRound
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <select
                                value={selectedUserId}
                                onChange={(event) => {

                                    setSelectedUserId(
                                        event.target.value
                                    );

                                }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">

                                    Tüm personeller

                                </option>

                                {
                                    users.map(
                                        (user) => (

                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >

                                                {user.name}

                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Durum

                        </label>

                        <select
                            value={selectedStatus}
                            onChange={(event) => {

                                setSelectedStatus(
                                    event.target.value
                                );

                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >

                            <option value="">

                                Tüm durumlar

                            </option>

                            <option value="working">

                                Çalışıyor

                            </option>

                            <option value="completed">

                                Tamamlandı

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

                            İş Yeri

                        </label>

                        <div className="relative">

                            <Building2
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <select
                                value={
                                    selectedWorkplaceId
                                }
                                onChange={(event) => {

                                    setSelectedWorkplaceId(
                                        event.target.value
                                    );

                                }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">

                                    Tüm iş yerleri

                                </option>

                                {
                                    workplaces.map(
                                        (workplace) => (

                                            <option
                                                key={
                                                    workplace.id
                                                }
                                                value={
                                                    workplace.id
                                                }
                                            >

                                                {
                                                    workplace.name
                                                }

                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Ekip

                        </label>

                        <div className="relative">

                            <Users
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <select
                                value={selectedTeamId}
                                onChange={(event) => {

                                    setSelectedTeamId(
                                        event.target.value
                                    );

                                }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">

                                    Tüm ekipler

                                </option>

                                {
                                    teams.map(
                                        (team) => (

                                            <option
                                                key={team.id}
                                                value={team.id}
                                            >

                                                {team.name}

                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Başlangıç Tarihi

                        </label>

                        <div className="relative">

                            <CalendarDays
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => {

                                    setStartDate(
                                        event.target.value
                                    );

                                }}
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-600">

                            Bitiş Tarihi

                        </label>

                        <div className="relative">

                            <CalendarDays
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="date"
                                value={endDate}
                                min={
                                    startDate ||
                                    undefined
                                }
                                onChange={(event) => {

                                    setEndDate(
                                        event.target.value
                                    );

                                }}
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>

                </div>


                <div className="mt-5 flex justify-end">

                    <button
                        type="button"
                        onClick={getReportRecords}
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                    >

                        {
                            loading
                                ? (
                                    <RefreshCw
                                        size={19}
                                        className="animate-spin"
                                    />
                                )
                                : (
                                    <Filter
                                        size={19}
                                    />
                                )
                        }

                        Raporu Getir

                    </button>

                </div>

            </div>


            {/* RAPOR TABLOSU */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            Personel Mesai Kayıtları

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            {
                                searchedRecords.length
                            } kayıt görüntüleniyor

                        </p>

                    </div>


                    <Download
                        size={24}
                        className="text-gray-400"
                    />

                </div>


                {
                    currentPageRecords.length === 0
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

                                    Seçilen filtrelere uygun bir mesai kaydı bulunmuyor.

                                </p>

                            </div>

                        )
                        : (

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Personel

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                İş Yeri / Ekip

                                            </th>

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

                                                Geç

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Fazla

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Eksik

                                            </th>

                                            <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                Durum

                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-gray-100">

                                        {
                                            currentPageRecords.map(
                                                (record) => (

                                                    <tr
                                                        key={record.id}
                                                        className="transition hover:bg-gray-50"
                                                    >

                                                        <td className="whitespace-nowrap px-5 py-4">

                                                            <div>

                                                                <p className="font-semibold text-gray-800">

                                                                    {
                                                                        record.personel ||
                                                                        "-"
                                                                    }

                                                                </p>

                                                                <p className="mt-1 text-xs text-gray-500">

                                                                    {
                                                                        record.email ||
                                                                        "-"
                                                                    }

                                                                </p>

                                                            </div>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <p className="font-medium text-gray-700">

                                                                {
                                                                    record.workplace ||
                                                                    "İş yeri atanmamış"
                                                                }

                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-500">

                                                                {
                                                                    record.team ||
                                                                    "Ekip atanmamış"
                                                                }

                                                            </p>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">

                                                            {
                                                                formatDate(
                                                                    record.check_in
                                                                )
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-green-700">

                                                            {
                                                                formatTime(
                                                                    record.check_in
                                                                )
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-red-700">

                                                            {
                                                                record.check_out
                                                                    ? formatTime(
                                                                        record.check_out
                                                                    )
                                                                    : "Devam ediyor"
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">

                                                            {
                                                                record.duration ||
                                                                formatMinutes(
                                                                    record.duration_minutes
                                                                )
                                                            }

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    Number(
                                                                        record.late_minutes ||
                                                                        0
                                                                    ) > 0
                                                                        ? "font-semibold text-orange-600"
                                                                        : "text-gray-400"
                                                                }
                                                            >

                                                                {
                                                                    record.late_minutes ||
                                                                    0
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    Number(
                                                                        record.overtime_minutes ||
                                                                        0
                                                                    ) > 0
                                                                        ? "font-semibold text-purple-600"
                                                                        : "text-gray-400"
                                                                }
                                                            >

                                                                {
                                                                    record.overtime_minutes ||
                                                                    0
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-sm">

                                                            <span
                                                                className={
                                                                    Number(
                                                                        record.missing_minutes ||
                                                                        0
                                                                    ) > 0
                                                                        ? "font-semibold text-red-600"
                                                                        : "text-gray-400"
                                                                }
                                                            >

                                                                {
                                                                    record.missing_minutes ||
                                                                    0
                                                                } dk

                                                            </span>

                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4">

                                                            <span
                                                                className={
                                                                    `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                        record.status
                                                                    )}`
                                                                }
                                                            >

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


                {
                    searchedRecords.length > 0 && (

                        <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <p className="text-sm text-gray-500">

                                Sayfa{" "}

                                <span className="font-semibold text-gray-700">

                                    {currentPage}

                                </span>{" "}

                                /{" "}

                                <span className="font-semibold text-gray-700">

                                    {totalPages}

                                </span>

                            </p>


                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() => {

                                        setCurrentPage(
                                            (previousPage) =>
                                                Math.max(
                                                    1,
                                                    previousPage -
                                                    1
                                                )
                                        );

                                    }}
                                    disabled={
                                        currentPage === 1
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >

                                    <ChevronLeft
                                        size={18}
                                    />

                                    Önceki

                                </button>


                                <button
                                    type="button"
                                    onClick={() => {

                                        setCurrentPage(
                                            (previousPage) =>
                                                Math.min(
                                                    totalPages,
                                                    previousPage +
                                                    1
                                                )
                                        );

                                    }}
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >

                                    Sonraki

                                    <ChevronRight
                                        size={18}
                                    />

                                </button>

                            </div>

                        </div>

                    )
                }

            </div>

        </div>

    );

}


export default AdminReports;