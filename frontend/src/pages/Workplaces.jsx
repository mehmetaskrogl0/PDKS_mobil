import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    CircleCheck,
    CircleX,
    Save,
    X,
    Search,
    MapPin,
    Clock3,
    Radius,
    Navigation,
    LocateFixed
} from "lucide-react";


const initialForm = {
    name: "",
    latitude: "",
    longitude: "",
    radius: "100",
    start_time: "09:00"
};


function Workplaces() {

    const [workplaces, setWorkplaces] = useState([]);

    const [form, setForm] = useState(initialForm);

    const [editingWorkplace, setEditingWorkplace] =
        useState(null);

    const [showForm, setShowForm] = useState(false);

    const [searchText, setSearchText] = useState("");

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [locationLoading, setLocationLoading] =
        useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");



    const getWorkplaces = async () => {

        const response = await api.get(
            "/workplaces/"
        );

        if (Array.isArray(response.data)) {

            setWorkplaces(response.data);

        } else {

            setWorkplaces([]);

        }

    };



    const loadPage = async () => {

        setLoading(true);
        setError("");

        try {

            await getWorkplaces();

        } catch (err) {

            console.log(err);

            if (err.response?.status === 403) {

                setError(
                    "İş yeri yönetimi için admin yetkisine sahip olmalısınız."
                );

            } else if (err.response?.status === 401) {

                setError(
                    "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın."
                );

            } else {

                setError(
                    err.response?.data?.detail ||
                    "İş yeri bilgileri alınamadı."
                );

            }

        } finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        loadPage();

    }, []);



    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setForm((previousForm) => ({

            ...previousForm,

            [name]: value

        }));

    };



    const resetForm = () => {

        setForm(initialForm);

        setEditingWorkplace(null);

        setShowForm(false);

    };



    const openCreateForm = () => {

        setMessage("");
        setError("");

        setEditingWorkplace(null);

        setForm(initialForm);

        setShowForm(true);

    };



    const formatTimeForInput = (timeValue) => {

        if (!timeValue) {

            return "09:00";

        }

        const textValue = String(timeValue);

        if (textValue.length >= 5) {

            return textValue.slice(0, 5);

        }

        return textValue;

    };



    const openEditForm = (workplace) => {

        setMessage("");
        setError("");

        setEditingWorkplace(workplace);

        setForm({

            name:
                workplace.name || "",

            latitude:
                workplace.latitude !== null &&
                    workplace.latitude !== undefined
                    ? String(workplace.latitude)
                    : "",

            longitude:
                workplace.longitude !== null &&
                    workplace.longitude !== undefined
                    ? String(workplace.longitude)
                    : "",

            radius:
                workplace.radius !== null &&
                    workplace.radius !== undefined
                    ? String(workplace.radius)
                    : "100",

            start_time:
                formatTimeForInput(
                    workplace.start_time
                )

        });

        setShowForm(true);

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };



    const getCurrentLocation = () => {

        setMessage("");
        setError("");

        if (!navigator.geolocation) {

            setError(
                "Tarayıcınız konum özelliğini desteklemiyor."
            );

            return;

        }

        setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(

            (position) => {

                setForm((previousForm) => ({

                    ...previousForm,

                    latitude:
                        position.coords.latitude.toFixed(7),

                    longitude:
                        position.coords.longitude.toFixed(7)

                }));

                setMessage(
                    "Mevcut konum koordinatları forma aktarıldı."
                );

                setLocationLoading(false);

            },

            (locationError) => {

                console.log(locationError);

                if (locationError.code === 1) {

                    setError(
                        "Konum izni reddedildi. Tarayıcı ayarlarından konum izni vermelisiniz."
                    );

                } else if (
                    locationError.code === 2
                ) {

                    setError(
                        "Konum bilgisi alınamadı."
                    );

                } else {

                    setError(
                        "Konum alınırken zaman aşımı oluştu."
                    );

                }

                setLocationLoading(false);

            },

            {

                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0

            }

        );

    };



    const validateForm = () => {

        if (!form.name.trim()) {

            setError(
                "İş yeri adı zorunludur."
            );

            return false;

        }


        if (
            form.latitude === "" ||
            form.longitude === ""
        ) {

            setError(
                "Enlem ve boylam alanları zorunludur."
            );

            return false;

        }


        const latitude =
            Number(form.latitude);

        const longitude =
            Number(form.longitude);

        const radius =
            Number(form.radius);


        if (
            Number.isNaN(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {

            setError(
                "Enlem değeri -90 ile 90 arasında olmalıdır."
            );

            return false;

        }


        if (
            Number.isNaN(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {

            setError(
                "Boylam değeri -180 ile 180 arasında olmalıdır."
            );

            return false;

        }


        if (
            Number.isNaN(radius) ||
            radius <= 0
        ) {

            setError(
                "İzin verilen yarıçap sıfırdan büyük olmalıdır."
            );

            return false;

        }


        if (!form.start_time) {

            setError(
                "Mesai başlangıç saati zorunludur."
            );

            return false;

        }


        return true;

    };



    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");


        if (!validateForm()) {

            return;

        }


        setFormLoading(true);


        const requestData = {

            name:
                form.name.trim(),

            latitude:
                Number(form.latitude),

            longitude:
                Number(form.longitude),

            radius:
                Number(form.radius),

            start_time:
                form.start_time

        };


        try {

            if (editingWorkplace) {

                const response = await api.put(

                    `/workplaces/${editingWorkplace.id}`,

                    requestData

                );

                setMessage(
                    response.data?.message ||
                    "İş yeri başarıyla güncellendi."
                );

            } else {

                const response = await api.post(

                    "/workplaces/",

                    requestData

                );

                setMessage(
                    response.data?.message ||
                    "İş yeri başarıyla oluşturuldu."
                );

            }


            resetForm();

            await getWorkplaces();

        } catch (err) {

            console.log(err);

            const detail =
                err.response?.data?.detail;


            if (Array.isArray(detail)) {

                setError(
                    detail
                        .map(
                            (item) =>
                                item.msg
                        )
                        .join(", ")
                );

            } else {

                setError(
                    detail ||
                    "İş yeri kaydedilemedi."
                );

            }

        } finally {

            setFormLoading(false);

        }

    };



    const handleDelete = async (workplace) => {

        const confirmed = window.confirm(

            `${workplace.name} adlı iş yerini silmek istediğinize emin misiniz?`

        );


        if (!confirmed) {

            return;

        }


        setDeletingId(workplace.id);

        setMessage("");
        setError("");


        try {

            const response = await api.delete(

                `/workplaces/${workplace.id}`

            );

            setMessage(
                response.data?.message ||
                "İş yeri başarıyla silindi."
            );

            await getWorkplaces();

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "İş yeri silinemedi. Bu iş yerine bağlı kullanıcılar olabilir."
            );

        } finally {

            setDeletingId(null);

        }

    };



    const formatCoordinate = (value) => {

        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {

            return "-";

        }

        return numberValue.toFixed(6);

    };



    const formatStartTime = (timeValue) => {

        if (!timeValue) {

            return "-";

        }

        return String(timeValue).slice(0, 5);

    };



    const filteredWorkplaces = useMemo(() => {

        const normalizedSearch =
            searchText.trim().toLowerCase();


        if (!normalizedSearch) {

            return workplaces;

        }


        return workplaces.filter(
            (workplace) => {

                const searchableText = [

                    workplace.name,

                    workplace.latitude,

                    workplace.longitude,

                    workplace.radius,

                    workplace.start_time

                ]
                    .filter(
                        (item) =>
                            item !== null &&
                            item !== undefined
                    )
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    normalizedSearch
                );

            }
        );

    }, [
        workplaces,
        searchText
    ]);



    const averageRadius = useMemo(() => {

        if (workplaces.length === 0) {

            return 0;

        }

        const total = workplaces.reduce(

            (sum, workplace) => {

                return (
                    sum +
                    Number(
                        workplace.radius || 0
                    )
                );

            },

            0

        );

        return Math.round(
            total / workplaces.length
        );

    }, [workplaces]);



    const largestRadius = useMemo(() => {

        if (workplaces.length === 0) {

            return 0;

        }

        return Math.max(

            ...workplaces.map(
                (workplace) =>
                    Number(
                        workplace.radius || 0
                    )
            )

        );

    }, [workplaces]);



    const earliestStartTime = useMemo(() => {

        const times = workplaces
            .map(
                (workplace) =>
                    workplace.start_time
            )
            .filter(Boolean)
            .map(
                (timeValue) =>
                    String(timeValue).slice(0, 5)
            )
            .sort();


        return times.length > 0
            ? times[0]
            : "-";

    }, [workplaces]);



    if (loading) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={23}
                        className="animate-spin"
                    />

                    <span>

                        İş yerleri yükleniyor...

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

                        İş Yeri Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        İş yerlerini, koordinatlarını ve mesai ayarlarını yönetebilirsiniz.

                    </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={loadPage}
                        disabled={
                            loading ||
                            formLoading
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <RefreshCw size={18} />

                        Yenile

                    </button>


                    <button
                        type="button"
                        onClick={
                            showForm
                                ? resetForm
                                : openCreateForm
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >

                        {showForm
                            ? <X size={19} />
                            : <Plus size={19} />
                        }

                        {showForm
                            ? "Formu Kapat"
                            : "Yeni İş Yeri"
                        }

                    </button>

                </div>

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



            {/* İSTATİSTİK KARTLARI */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Toplam İş Yeri

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {workplaces.length}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                            <Building2 size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Ortalama Yarıçap

                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-600">

                                {averageRadius} m

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">

                            <Radius size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                En Büyük Yarıçap

                            </p>

                            <p className="mt-2 text-3xl font-bold text-purple-600">

                                {largestRadius} m

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">

                            <Navigation size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                En Erken Mesai

                            </p>

                            <p className="mt-2 text-3xl font-bold text-orange-600">

                                {earliestStartTime}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">

                            <Clock3 size={24} />

                        </div>

                    </div>

                </div>

            </div>



            {/* İŞ YERİ FORMU */}

            {showForm && (

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-6 flex items-center justify-between">

                        <div>

                            <h2 className="text-xl font-bold text-gray-800">

                                {editingWorkplace
                                    ? "İş Yerini Düzenle"
                                    : "Yeni İş Yeri Ekle"
                                }

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                İş yeri konumu ve mesai ayarlarını girin.

                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >

                            <X size={21} />

                        </button>

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                            <div className="md:col-span-2">

                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    İş Yeri Adı

                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    placeholder="Örnek: HATSU Antakya"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label
                                    htmlFor="latitude"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    Enlem (Latitude)

                                </label>

                                <input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    value={form.latitude}
                                    onChange={handleInputChange}
                                    placeholder="36.202300"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label
                                    htmlFor="longitude"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    Boylam (Longitude)

                                </label>

                                <input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    value={form.longitude}
                                    onChange={handleInputChange}
                                    placeholder="36.160100"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div className="md:col-span-2">

                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={locationLoading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {locationLoading
                                        ? (
                                            <RefreshCw
                                                size={18}
                                                className="animate-spin"
                                            />
                                        )
                                        : (
                                            <LocateFixed size={18} />
                                        )
                                    }

                                    {locationLoading
                                        ? "Konum Alınıyor..."
                                        : "Mevcut Konumu Kullan"
                                    }

                                </button>

                            </div>



                            <div>

                                <label
                                    htmlFor="radius"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    İzin Verilen Yarıçap (Metre)

                                </label>

                                <input
                                    id="radius"
                                    type="number"
                                    min="1"
                                    step="1"
                                    name="radius"
                                    value={form.radius}
                                    onChange={handleInputChange}
                                    placeholder="100"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label
                                    htmlFor="start_time"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >

                                    Mesai Başlangıç Saati

                                </label>

                                <input
                                    id="start_time"
                                    type="time"
                                    name="start_time"
                                    value={form.start_time}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>

                        </div>



                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                            <div className="flex gap-3">

                                <MapPin
                                    size={20}
                                    className="mt-0.5 shrink-0 text-blue-600"
                                />

                                <div className="text-sm text-blue-700">

                                    <p className="font-semibold">

                                        Konum kontrolü

                                    </p>

                                    <p className="mt-1">

                                        Personeller yalnızca belirlediğiniz yarıçap içinde mesai girişi ve çıkışı yapabilir.

                                    </p>

                                </div>

                            </div>

                        </div>



                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                            >

                                Vazgeç

                            </button>


                            <button
                                type="submit"
                                disabled={formLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >

                                {formLoading
                                    ? (
                                        <RefreshCw
                                            size={19}
                                            className="animate-spin"
                                        />
                                    )
                                    : (
                                        <Save size={19} />
                                    )
                                }

                                {formLoading
                                    ? "Kaydediliyor..."
                                    : (
                                        editingWorkplace
                                            ? "İş Yerini Güncelle"
                                            : "İş Yeri Oluştur"
                                    )
                                }

                            </button>

                        </div>

                    </form>

                </div>

            )}



            {/* ARAMA */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

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
                        placeholder="İş yeri adı, koordinat, yarıçap veya mesai saatine göre ara..."
                        className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

            </div>



            {/* İŞ YERİ LİSTESİ */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        İş Yeri Listesi

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        {filteredWorkplaces.length} iş yeri gösteriliyor

                    </p>

                </div>


                {filteredWorkplaces.length === 0 ? (

                    <div className="p-12 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">

                            <Building2 size={30} />

                        </div>

                        <h3 className="mt-4 font-semibold text-gray-700">

                            İş yeri bulunamadı

                        </h3>

                        <p className="mt-1 text-sm text-gray-500">

                            Yeni İş Yeri butonuyla iş yeri oluşturabilirsiniz.

                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        İş Yeri

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Koordinatlar

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Yarıçap

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Mesai Başlangıcı

                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        İşlemler

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {filteredWorkplaces.map(
                                    (workplace) => (

                                        <tr
                                            key={workplace.id}
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                                        <Building2 size={22} />

                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-gray-800">

                                                            {workplace.name}

                                                        </p>

                                                        <p className="text-xs text-gray-400">

                                                            İş Yeri No: {workplace.id}

                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-start gap-2 text-sm text-gray-600">

                                                    <MapPin
                                                        size={17}
                                                        className="mt-0.5 shrink-0"
                                                    />

                                                    <div>

                                                        <p>

                                                            {formatCoordinate(
                                                                workplace.latitude
                                                            )}

                                                        </p>

                                                        <p>

                                                            {formatCoordinate(
                                                                workplace.longitude
                                                            )}

                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">

                                                    <Radius size={15} />

                                                    {workplace.radius || 0} metre

                                                </span>

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">

                                                    <Clock3 size={17} />

                                                    {formatStartTime(
                                                        workplace.start_time
                                                    )}

                                                </div>

                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(
                                                                workplace
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                                                    >

                                                        <Pencil size={16} />

                                                        Düzenle

                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                workplace
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            workplace.id
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >

                                                        {deletingId ===
                                                            workplace.id
                                                            ? (
                                                                <RefreshCw
                                                                    size={16}
                                                                    className="animate-spin"
                                                                />
                                                            )
                                                            : (
                                                                <Trash2 size={16} />
                                                            )
                                                        }

                                                        Sil

                                                    </button>

                                                </div>

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


export default Workplaces;