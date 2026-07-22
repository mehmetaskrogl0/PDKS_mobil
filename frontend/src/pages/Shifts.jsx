import { useEffect, useState } from "react";

import {
    Clock3,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Moon,
    Coffee,
    Timer,
    CheckCircle2,
    XCircle
} from "lucide-react";

import toast from "react-hot-toast";

import api from "../api/axios";


const initialForm = {

    name: "",
    description: "",

    start_time: "08:00",
    end_time: "17:00",

    break_minutes: 0,
    late_tolerance_minutes: 0,
    early_check_in_minutes: 30,
    overtime_tolerance_minutes: 0,

    is_active: true

};


function Shifts() {

    const [shifts, setShifts] = useState([]);

    const [formData, setFormData] = useState(
        initialForm
    );

    const [editingShiftId, setEditingShiftId] = useState(
        null
    );

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);


    const getErrorMessage = (
        error,
        fallbackMessage
    ) => {

        const detail = error.response?.data?.detail;

        if (Array.isArray(detail)) {

            return detail
                .map((item) => item.msg)
                .join(", ");

        }

        return detail || fallbackMessage;

    };


    const getShifts = async () => {

        try {

            setLoading(true);

            const response = await api.get(
                "/shifts/"
            );

            setShifts(
                response.data || []
            );

        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiyalar alınamadı."
                )
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        getShifts();

    }, []);


    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData((previousData) => ({

            ...previousData,

            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                        ? Number(value)
                        : value

        }));

    };


    const resetForm = () => {

        setFormData(
            initialForm
        );

        setEditingShiftId(
            null
        );

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        if (!formData.name.trim()) {

            toast.error(
                "Vardiya adı zorunludur."
            );

            return;

        }

        if (
            !formData.start_time ||
            !formData.end_time
        ) {

            toast.error(
                "Başlangıç ve bitiş saati zorunludur."
            );

            return;

        }


        const payload = {

            name: formData.name.trim(),

            description:
                formData.description.trim() || null,

            start_time: formData.start_time,
            end_time: formData.end_time,

            break_minutes: Number(
                formData.break_minutes
            ),

            late_tolerance_minutes: Number(
                formData.late_tolerance_minutes
            ),

            early_check_in_minutes: Number(
                formData.early_check_in_minutes
            ),

            overtime_tolerance_minutes: Number(
                formData.overtime_tolerance_minutes
            ),

            is_active: formData.is_active

        };


        try {

            setSaving(true);

            if (editingShiftId) {

                const response = await api.put(
                    `/shifts/${editingShiftId}`,
                    payload
                );

                toast.success(
                    response.data?.message ||
                    "Vardiya güncellendi."
                );

            } else {

                const response = await api.post(
                    "/shifts/",
                    payload
                );

                toast.success(
                    response.data?.message ||
                    "Vardiya oluşturuldu."
                );

            }

            resetForm();

            await getShifts();

        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiya kaydedilemedi."
                )
            );

        } finally {

            setSaving(false);

        }

    };


    const handleEdit = (shift) => {

        setEditingShiftId(
            shift.id
        );

        setFormData({

            name: shift.name || "",

            description:
                shift.description || "",

            start_time:
                shift.start_time_text ||
                shift.start_time?.slice(0, 5) ||
                "08:00",

            end_time:
                shift.end_time_text ||
                shift.end_time?.slice(0, 5) ||
                "17:00",

            break_minutes:
                shift.break_minutes ?? 0,

            late_tolerance_minutes:
                shift.late_tolerance_minutes ?? 0,

            early_check_in_minutes:
                shift.early_check_in_minutes ?? 30,

            overtime_tolerance_minutes:
                shift.overtime_tolerance_minutes ?? 0,

            is_active:
                shift.is_active ?? true

        });

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    };


    const handleDelete = async (shift) => {

        const confirmed = window.confirm(

            `"${shift.name}" vardiyasını silmek istediğinize emin misiniz?`

        );

        if (!confirmed) {

            return;

        }


        try {

            const response = await api.delete(
                `/shifts/${shift.id}`
            );

            toast.success(
                response.data?.message ||
                "Vardiya silindi."
            );

            if (
                editingShiftId === shift.id
            ) {

                resetForm();

            }

            await getShifts();

        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiya silinemedi."
                )
            );

        }

    };


    return (

        <div className="space-y-8">


            {/* Sayfa başlığı */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">

                        <Clock3
                            className="text-blue-600"
                            size={32}
                        />

                        Vardiya Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Çalışma vardiyalarını oluşturun,
                        düzenleyin ve yönetin.

                    </p>

                </div>


                <div className="rounded-xl bg-blue-50 px-5 py-3">

                    <p className="text-sm text-blue-600">

                        Toplam vardiya

                    </p>

                    <p className="text-2xl font-bold text-blue-700">

                        {shifts.length}

                    </p>

                </div>

            </div>


            {/* Vardiya formu */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            {editingShiftId
                                ? "Vardiyayı Düzenle"
                                : "Yeni Vardiya Oluştur"}

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            Vardiyanın çalışma saatlerini
                            ve toleranslarını belirleyin.

                        </p>

                    </div>


                    {editingShiftId && (

                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                        >

                            <X size={17} />

                            İptal

                        </button>

                    )}

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Vardiya adı

                            </label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Örneğin: Sabah Vardiyası"
                                required
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Açıklama

                            </label>

                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Vardiya açıklaması"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Başlangıç saati

                            </label>

                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Bitiş saati

                            </label>

                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>


                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Mola süresi

                            </label>

                            <div className="relative">

                                <Coffee
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="number"
                                    name="break_minutes"
                                    value={formData.break_minutes}
                                    onChange={handleChange}
                                    min="0"
                                    max="600"
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-16 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <span className="absolute right-3 top-3.5 text-sm text-gray-400">

                                    dk.

                                </span>

                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Geç kalma toleransı

                            </label>

                            <div className="relative">

                                <Timer
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="number"
                                    name="late_tolerance_minutes"
                                    value={formData.late_tolerance_minutes}
                                    onChange={handleChange}
                                    min="0"
                                    max="180"
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-16 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <span className="absolute right-3 top-3.5 text-sm text-gray-400">

                                    dk.

                                </span>

                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Erken giriş süresi

                            </label>

                            <div className="relative">

                                <Clock3
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="number"
                                    name="early_check_in_minutes"
                                    value={formData.early_check_in_minutes}
                                    onChange={handleChange}
                                    min="0"
                                    max="300"
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-16 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <span className="absolute right-3 top-3.5 text-sm text-gray-400">

                                    dk.

                                </span>

                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Fazla mesai toleransı

                            </label>

                            <div className="relative">

                                <Timer
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="number"
                                    name="overtime_tolerance_minutes"
                                    value={formData.overtime_tolerance_minutes}
                                    onChange={handleChange}
                                    min="0"
                                    max="300"
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-16 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <span className="absolute right-3 top-3.5 text-sm text-gray-400">

                                    dk.

                                </span>

                            </div>

                        </div>

                    </div>


                    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4">

                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600"
                        />

                        <div>

                            <p className="font-semibold text-gray-700">

                                Vardiya aktif

                            </p>

                            <p className="text-sm text-gray-500">

                                Pasif vardiyalar personele veya
                                ekibe atanamaz.

                            </p>

                        </div>

                    </label>


                    <div className="flex justify-end">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {editingShiftId ? (

                                <Save size={19} />

                            ) : (

                                <Plus size={19} />

                            )}

                            {saving
                                ? "Kaydediliyor..."
                                : editingShiftId
                                    ? "Değişiklikleri Kaydet"
                                    : "Vardiya Oluştur"}

                        </button>

                    </div>

                </form>

            </div>


            {/* Vardiya listesi */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        Mevcut Vardiyalar

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        Sistemde tanımlı vardiyalar.

                    </p>

                </div>


                {loading ? (

                    <div className="py-12 text-center text-gray-500">

                        Vardiyalar yükleniyor...

                    </div>

                ) : shifts.length === 0 ? (

                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">

                        <Clock3
                            size={44}
                            className="mx-auto mb-3 text-gray-300"
                        />

                        <p className="font-medium text-gray-600">

                            Henüz vardiya oluşturulmamış.

                        </p>

                        <p className="mt-1 text-sm text-gray-400">

                            Yukarıdaki formdan ilk vardiyayı
                            oluşturabilirsiniz.

                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                        {shifts.map((shift) => (

                            <div
                                key={shift.id}
                                className="rounded-2xl border border-gray-200 p-5 transition hover:border-blue-200 hover:shadow-md"
                            >

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-lg font-bold text-gray-800">

                                                {shift.name}

                                            </h3>


                                            {shift.is_active ? (

                                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                    <CheckCircle2 size={14} />

                                                    Aktif

                                                </span>

                                            ) : (

                                                <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">

                                                    <XCircle size={14} />

                                                    Pasif

                                                </span>

                                            )}


                                            {shift.is_overnight && (

                                                <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">

                                                    <Moon size={14} />

                                                    Gece vardiyası

                                                </span>

                                            )}

                                        </div>


                                        <p className="mt-2 text-sm text-gray-500">

                                            {shift.description ||
                                                "Açıklama bulunmuyor."}

                                        </p>

                                    </div>


                                    <div className="flex gap-2">

                                        <button
                                            type="button"
                                            onClick={() => handleEdit(shift)}
                                            className="rounded-lg bg-amber-50 p-2.5 text-amber-600 transition hover:bg-amber-100"
                                            title="Düzenle"
                                        >

                                            <Pencil size={18} />

                                        </button>


                                        <button
                                            type="button"
                                            onClick={() => handleDelete(shift)}
                                            className="rounded-lg bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
                                            title="Sil"
                                        >

                                            <Trash2 size={18} />

                                        </button>

                                    </div>

                                </div>


                                <div className="mt-5 rounded-xl bg-blue-50 p-4">

                                    <div className="flex items-center justify-center gap-3 text-blue-700">

                                        <Clock3 size={22} />

                                        <span className="text-xl font-bold">

                                            {shift.start_time_text ||
                                                shift.start_time?.slice(0, 5)}

                                        </span>

                                        <span className="text-gray-400">

                                            —

                                        </span>

                                        <span className="text-xl font-bold">

                                            {shift.end_time_text ||
                                                shift.end_time?.slice(0, 5)}

                                        </span>

                                    </div>

                                </div>


                                <div className="mt-5 grid grid-cols-2 gap-3">

                                    <div className="rounded-xl bg-gray-50 p-3">

                                        <p className="text-xs text-gray-500">

                                            Mola

                                        </p>

                                        <p className="mt-1 font-semibold text-gray-700">

                                            {shift.break_minutes} dakika

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-gray-50 p-3">

                                        <p className="text-xs text-gray-500">

                                            Geç kalma toleransı

                                        </p>

                                        <p className="mt-1 font-semibold text-gray-700">

                                            {shift.late_tolerance_minutes} dakika

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-gray-50 p-3">

                                        <p className="text-xs text-gray-500">

                                            Erken giriş

                                        </p>

                                        <p className="mt-1 font-semibold text-gray-700">

                                            {shift.early_check_in_minutes} dakika

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-gray-50 p-3">

                                        <p className="text-xs text-gray-500">

                                            Fazla mesai toleransı

                                        </p>

                                        <p className="mt-1 font-semibold text-gray-700">

                                            {shift.overtime_tolerance_minutes} dakika

                                        </p>

                                    </div>

                                </div>


                                {shift.workplace_name && (

                                    <div className="mt-4 text-sm text-gray-500">

                                        İş yeri:{" "}

                                        <span className="font-semibold text-gray-700">

                                            {shift.workplace_name}

                                        </span>

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}


export default Shifts;