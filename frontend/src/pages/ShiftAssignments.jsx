import { useEffect, useMemo, useState } from "react";

import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Pencil,
    Plus,
    Save,
    Trash2,
    User,
    Users,
    X,
    XCircle
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../api/axios";


function getToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


const initialForm = {

    assignment_target: "user",

    shift_id: "",
    user_id: "",
    team_id: "",

    start_date: getToday(),
    end_date: "",

    notes: "",

    is_active: true

};


function ShiftAssignments() {

    const [assignments, setAssignments] = useState([]);

    const [shifts, setShifts] = useState([]);

    const [users, setUsers] = useState([]);

    const [teams, setTeams] = useState([]);


    const [formData, setFormData] = useState(
        initialForm
    );


    const [
        editingAssignmentId,
        setEditingAssignmentId
    ] = useState(null);


    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);


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

        if (
            detail &&
            typeof detail === "object"
        ) {

            return JSON.stringify(detail);

        }

        return detail || fallbackMessage;

    };


    const normalizeArray = (data) => {

        if (Array.isArray(data)) {

            return data;

        }

        if (Array.isArray(data?.items)) {

            return data.items;

        }

        if (Array.isArray(data?.users)) {

            return data.users;

        }

        if (Array.isArray(data?.teams)) {

            return data.teams;

        }

        if (Array.isArray(data?.data)) {

            return data.data;

        }

        return [];

    };


    const loadPageData = async () => {

        try {

            setLoading(true);


            const [
                assignmentsResponse,
                shiftsResponse,
                usersResponse,
                teamsResponse
            ] = await Promise.all([

                api.get(
                    "/shifts/assignments"
                ),

                api.get(
                    "/shifts/",
                    {
                        params: {
                            active_only: true
                        }
                    }
                ),

                api.get(
                    "/users/"
                ),

                api.get(
                    "/teams/"
                )

            ]);


            setAssignments(
                normalizeArray(
                    assignmentsResponse.data
                )
            );


            setShifts(
                normalizeArray(
                    shiftsResponse.data
                )
            );


            setUsers(
                normalizeArray(
                    usersResponse.data
                )
            );


            setTeams(
                normalizeArray(
                    teamsResponse.data
                )
            );


        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiya atama bilgileri alınamadı."
                )
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadPageData();

    }, []);


    const activeAssignmentCount = useMemo(() => {

        return assignments.filter(
            (assignment) => assignment.is_active
        ).length;

    }, [assignments]);


    const userAssignmentCount = useMemo(() => {

        return assignments.filter(
            (assignment) =>
                assignment.assignment_type === "user"
        ).length;

    }, [assignments]);


    const teamAssignmentCount = useMemo(() => {

        return assignments.filter(
            (assignment) =>
                assignment.assignment_type === "team"
        ).length;

    }, [assignments]);


    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        if (name === "assignment_target") {

            setFormData((previousData) => ({

                ...previousData,

                assignment_target: value,

                user_id:
                    value === "user"
                        ? previousData.user_id
                        : "",

                team_id:
                    value === "team"
                        ? previousData.team_id
                        : ""

            }));

            return;

        }


        setFormData((previousData) => ({

            ...previousData,

            [name]:
                type === "checkbox"
                    ? checked
                    : value

        }));

    };


    const resetForm = () => {

        setFormData({

            ...initialForm,

            start_date: getToday()

        });

        setEditingAssignmentId(null);

    };


    const validateForm = () => {

        if (!formData.shift_id) {

            toast.error(
                "Lütfen vardiya seçin."
            );

            return false;

        }


        if (
            formData.assignment_target === "user" &&
            !formData.user_id
        ) {

            toast.error(
                "Lütfen personel seçin."
            );

            return false;

        }


        if (
            formData.assignment_target === "team" &&
            !formData.team_id
        ) {

            toast.error(
                "Lütfen ekip seçin."
            );

            return false;

        }


        if (!formData.start_date) {

            toast.error(
                "Başlangıç tarihi zorunludur."
            );

            return false;

        }


        if (
            formData.end_date &&
            formData.end_date < formData.start_date
        ) {

            toast.error(
                "Bitiş tarihi başlangıç tarihinden önce olamaz."
            );

            return false;

        }


        return true;

    };


    const handleSubmit = async (event) => {

        event.preventDefault();


        if (!validateForm()) {

            return;

        }


        const payload = {

            shift_id: Number(
                formData.shift_id
            ),

            user_id:
                formData.assignment_target === "user"
                    ? Number(formData.user_id)
                    : null,

            team_id:
                formData.assignment_target === "team"
                    ? Number(formData.team_id)
                    : null,

            start_date:
                formData.start_date,

            end_date:
                formData.end_date || null,

            notes:
                formData.notes.trim() || null,

            is_active:
                formData.is_active

        };


        try {

            setSaving(true);


            if (editingAssignmentId) {

                const response = await api.put(

                    `/shifts/assignments/${editingAssignmentId}`,

                    payload

                );


                toast.success(

                    response.data?.message ||
                    "Vardiya ataması güncellendi."

                );

            } else {

                const response = await api.post(

                    "/shifts/assignments",

                    payload

                );


                toast.success(

                    response.data?.message ||
                    "Vardiya ataması oluşturuldu."

                );

            }


            resetForm();

            await loadPageData();


        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiya ataması kaydedilemedi."
                )
            );

        } finally {

            setSaving(false);

        }

    };


    const handleEdit = (assignment) => {

        const targetType =
            assignment.assignment_type ||
            (
                assignment.user_id
                    ? "user"
                    : "team"
            );


        setEditingAssignmentId(
            assignment.id
        );


        setFormData({

            assignment_target:
                targetType,

            shift_id:
                String(
                    assignment.shift_id || ""
                ),

            user_id:
                assignment.user_id
                    ? String(assignment.user_id)
                    : "",

            team_id:
                assignment.team_id
                    ? String(assignment.team_id)
                    : "",

            start_date:
                assignment.start_date || getToday(),

            end_date:
                assignment.end_date || "",

            notes:
                assignment.notes || "",

            is_active:
                assignment.is_active ?? true

        });


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };


    const handleDelete = async (assignment) => {

        const confirmed = window.confirm(

            `"${assignment.assigned_name}" için yapılan vardiya atamasını silmek istediğinize emin misiniz?`

        );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingId(
                assignment.id
            );


            const response = await api.delete(

                `/shifts/assignments/${assignment.id}`

            );


            toast.success(

                response.data?.message ||
                "Vardiya ataması silindi."

            );


            if (
                editingAssignmentId === assignment.id
            ) {

                resetForm();

            }


            await loadPageData();


        } catch (error) {

            toast.error(
                getErrorMessage(
                    error,
                    "Vardiya ataması silinemedi."
                )
            );

        } finally {

            setDeletingId(null);

        }

    };


    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "Süresiz";

        }


        const parts = dateValue.split("-");


        if (parts.length !== 3) {

            return dateValue;

        }


        return `${parts[2]}.${parts[1]}.${parts[0]}`;

    };


    return (

        <div className="space-y-8">


            {/* Sayfa başlığı */}

            <div>

                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">

                    <CalendarDays
                        size={32}
                        className="text-blue-600"
                    />

                    Vardiya Atamaları

                </h1>


                <p className="mt-2 text-gray-500">

                    Personel ve ekiplere tarih aralığına göre
                    vardiya atayın.

                </p>

            </div>


            {/* İstatistik kartları */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">


                <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm text-gray-500">

                                Toplam Atama

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {assignments.length}

                            </p>

                        </div>


                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">

                            <CalendarDays size={25} />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm text-gray-500">

                                Aktif Atama

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {activeAssignmentCount}

                            </p>

                        </div>


                        <div className="rounded-xl bg-green-100 p-3 text-green-600">

                            <CheckCircle2 size={25} />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm text-gray-500">

                                Personel Ataması

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {userAssignmentCount}

                            </p>

                        </div>


                        <div className="rounded-xl bg-purple-100 p-3 text-purple-600">

                            <User size={25} />

                        </div>

                    </div>

                </div>


                <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm text-gray-500">

                                Ekip Ataması

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {teamAssignmentCount}

                            </p>

                        </div>


                        <div className="rounded-xl bg-orange-100 p-3 text-orange-600">

                            <Users size={25} />

                        </div>

                    </div>

                </div>

            </div>


            {/* Atama formu */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">


                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">


                    <div>

                        <h2 className="text-xl font-bold text-gray-800">

                            {editingAssignmentId
                                ? "Vardiya Atamasını Düzenle"
                                : "Yeni Vardiya Ataması"}

                        </h2>


                        <p className="mt-1 text-sm text-gray-500">

                            Bir personele veya ekibe vardiya atayın.

                        </p>

                    </div>


                    {editingAssignmentId && (

                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                        >

                            <X size={18} />

                            Düzenlemeyi İptal Et

                        </button>

                    )}

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >


                    {/* Atama türü */}

                    <div>

                        <label className="mb-3 block text-sm font-semibold text-gray-700">

                            Atama türü

                        </label>


                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                            <label
                                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${formData.assignment_target === "user"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >

                                <input
                                    type="radio"
                                    name="assignment_target"
                                    value="user"
                                    checked={
                                        formData.assignment_target === "user"
                                    }
                                    onChange={handleChange}
                                    className="h-5 w-5 text-blue-600"
                                />


                                <div className="rounded-xl bg-purple-100 p-3 text-purple-600">

                                    <User size={24} />

                                </div>


                                <div>

                                    <p className="font-semibold text-gray-800">

                                        Personele Ata

                                    </p>

                                    <p className="text-sm text-gray-500">

                                        Tek bir personele vardiya atayın.

                                    </p>

                                </div>

                            </label>


                            <label
                                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${formData.assignment_target === "team"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >

                                <input
                                    type="radio"
                                    name="assignment_target"
                                    value="team"
                                    checked={
                                        formData.assignment_target === "team"
                                    }
                                    onChange={handleChange}
                                    className="h-5 w-5 text-blue-600"
                                />


                                <div className="rounded-xl bg-orange-100 p-3 text-orange-600">

                                    <Users size={24} />

                                </div>


                                <div>

                                    <p className="font-semibold text-gray-800">

                                        Ekibe Ata

                                    </p>

                                    <p className="text-sm text-gray-500">

                                        Ekipteki personele vardiya atayın.

                                    </p>

                                </div>

                            </label>

                        </div>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                        {/* Vardiya seçimi */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Vardiya

                            </label>


                            <select
                                name="shift_id"
                                value={formData.shift_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">

                                    Vardiya seçin

                                </option>


                                {shifts.map((shift) => (

                                    <option
                                        key={shift.id}
                                        value={shift.id}
                                    >

                                        {shift.name} -{" "}
                                        {shift.start_time_text ||
                                            shift.start_time?.slice(0, 5)}
                                        {" / "}
                                        {shift.end_time_text ||
                                            shift.end_time?.slice(0, 5)}

                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* Personel veya ekip seçimi */}

                        {formData.assignment_target === "user" ? (

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Personel

                                </label>


                                <select
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">

                                        Personel seçin

                                    </option>


                                    {users.map((user) => (

                                        <option
                                            key={user.id}
                                            value={user.id}
                                        >

                                            {user.name} {user.surname}

                                            {user.job_title
                                                ? ` - ${user.job_title}`
                                                : ""}

                                        </option>

                                    ))}

                                </select>

                            </div>

                        ) : (

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Ekip

                                </label>


                                <select
                                    name="team_id"
                                    value={formData.team_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">

                                        Ekip seçin

                                    </option>


                                    {teams.map((team) => (

                                        <option
                                            key={team.id}
                                            value={team.id}
                                        >

                                            {team.name}

                                            {team.member_count !== undefined
                                                ? ` - ${team.member_count} personel`
                                                : ""}

                                        </option>

                                    ))}

                                </select>

                            </div>

                        )}


                        {/* Başlangıç tarihi */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Başlangıç tarihi

                            </label>


                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        {/* Bitiş tarihi */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Bitiş tarihi

                            </label>


                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                min={formData.start_date}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />


                            <p className="mt-1 text-xs text-gray-400">

                                Boş bırakılırsa atama süresiz devam eder.

                            </p>

                        </div>

                    </div>


                    {/* Not */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">

                            Atama notu

                        </label>


                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            maxLength="500"
                            placeholder="Vardiya ataması hakkında açıklama yazabilirsiniz."
                            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                    </div>


                    {/* Aktif */}

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

                                Atama aktif

                            </p>


                            <p className="text-sm text-gray-500">

                                Pasif atamalar personelin güncel
                                vardiyası olarak kullanılmaz.

                            </p>

                        </div>

                    </label>


                    {/* Kaydet */}

                    <div className="flex justify-end">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {editingAssignmentId ? (

                                <Save size={19} />

                            ) : (

                                <Plus size={19} />

                            )}


                            {saving
                                ? "Kaydediliyor..."
                                : editingAssignmentId
                                    ? "Atamayı Güncelle"
                                    : "Vardiya Ata"}

                        </button>

                    </div>

                </form>

            </div>


            {/* Atama listesi */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">


                <div className="mb-6">

                    <h2 className="text-xl font-bold text-gray-800">

                        Mevcut Vardiya Atamaları

                    </h2>


                    <p className="mt-1 text-sm text-gray-500">

                        Personel ve ekiplere yapılan vardiya atamaları.

                    </p>

                </div>


                {loading ? (

                    <div className="py-12 text-center text-gray-500">

                        Vardiya atamaları yükleniyor...

                    </div>

                ) : assignments.length === 0 ? (

                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">

                        <CalendarDays
                            size={46}
                            className="mx-auto mb-3 text-gray-300"
                        />


                        <p className="font-medium text-gray-600">

                            Henüz vardiya ataması yapılmamış.

                        </p>


                        <p className="mt-1 text-sm text-gray-400">

                            Yukarıdaki formdan ilk vardiya atamasını
                            oluşturabilirsiniz.

                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead>

                                <tr className="border-b border-gray-200 text-left text-sm text-gray-500">

                                    <th className="px-4 py-4 font-semibold">

                                        Atanan

                                    </th>

                                    <th className="px-4 py-4 font-semibold">

                                        Tür

                                    </th>

                                    <th className="px-4 py-4 font-semibold">

                                        Vardiya

                                    </th>

                                    <th className="px-4 py-4 font-semibold">

                                        Tarih Aralığı

                                    </th>

                                    <th className="px-4 py-4 font-semibold">

                                        Durum

                                    </th>

                                    <th className="px-4 py-4 text-right font-semibold">

                                        İşlemler

                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {assignments.map((assignment) => (

                                    <tr
                                        key={assignment.id}
                                        className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                                    >


                                        <td className="px-4 py-4">

                                            <div className="flex items-center gap-3">

                                                <div
                                                    className={`rounded-xl p-2.5 ${assignment.assignment_type === "team"
                                                            ? "bg-orange-100 text-orange-600"
                                                            : "bg-purple-100 text-purple-600"
                                                        }`}
                                                >

                                                    {assignment.assignment_type === "team" ? (

                                                        <Users size={20} />

                                                    ) : (

                                                        <User size={20} />

                                                    )}

                                                </div>


                                                <div>

                                                    <p className="font-semibold text-gray-800">

                                                        {assignment.assigned_name ||
                                                            "Atanan bulunamadı"}

                                                    </p>


                                                    {assignment.notes && (

                                                        <p className="mt-1 max-w-xs truncate text-xs text-gray-400">

                                                            {assignment.notes}

                                                        </p>

                                                    )}

                                                </div>

                                            </div>

                                        </td>


                                        <td className="px-4 py-4">

                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${assignment.assignment_type === "team"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-purple-100 text-purple-700"
                                                    }`}
                                            >

                                                {assignment.assignment_type === "team"
                                                    ? "Ekip"
                                                    : "Personel"}

                                            </span>

                                        </td>


                                        <td className="px-4 py-4">

                                            <div className="flex items-center gap-2 text-gray-700">

                                                <Clock3
                                                    size={18}
                                                    className="text-blue-500"
                                                />

                                                <span className="font-medium">

                                                    {assignment.shift_name ||
                                                        "Vardiya bulunamadı"}

                                                </span>

                                            </div>

                                        </td>


                                        <td className="px-4 py-4">

                                            <div className="text-sm">

                                                <p className="font-medium text-gray-700">

                                                    {formatDate(
                                                        assignment.start_date
                                                    )}

                                                </p>


                                                <p className="mt-1 text-xs text-gray-400">

                                                    Bitiş:{" "}

                                                    {formatDate(
                                                        assignment.end_date
                                                    )}

                                                </p>

                                            </div>

                                        </td>


                                        <td className="px-4 py-4">

                                            {assignment.is_active ? (

                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                    <CheckCircle2 size={14} />

                                                    Aktif

                                                </span>

                                            ) : (

                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">

                                                    <XCircle size={14} />

                                                    Pasif

                                                </span>

                                            )}

                                        </td>


                                        <td className="px-4 py-4">

                                            <div className="flex justify-end gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(
                                                            assignment
                                                        )
                                                    }
                                                    className="rounded-lg bg-amber-50 p-2.5 text-amber-600 transition hover:bg-amber-100"
                                                    title="Düzenle"
                                                >

                                                    <Pencil size={18} />

                                                </button>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            assignment
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        assignment.id
                                                    }
                                                    className="rounded-lg bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Sil"
                                                >

                                                    <Trash2 size={18} />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );

}


export default ShiftAssignments;