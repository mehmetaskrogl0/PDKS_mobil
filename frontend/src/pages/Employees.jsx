import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import {
    Users,
    UserPlus,
    Pencil,
    Trash2,
    RefreshCw,
    CircleCheck,
    CircleX,
    Save,
    Search,
    Building2,
    Mail,
    ShieldCheck,
    UserRound,
    Network,
    BriefcaseBusiness
} from "lucide-react";


const initialForm = {
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "employee",
    workplace_id: "",
    department_id: "",
    directorate_id: "",
    organization_unit_id: "",
    job_title_id: ""
};


function toNullableNumber(value) {
    return value === "" || value === null || value === undefined
        ? null
        : Number(value);
}


function Employees() {

    const [users, setUsers] = useState([]);
    const [workplaces, setWorkplaces] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [directorates, setDirectorates] = useState([]);
    const [units, setUnits] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingUser, setEditingUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const getUsers = async () => {
        const response = await api.get("/users/");
        setUsers(Array.isArray(response.data) ? response.data : []);
    };


    const getWorkplaces = async () => {
        const response = await api.get("/workplaces/");
        setWorkplaces(Array.isArray(response.data) ? response.data : []);
    };


    const getOrganizationData = async () => {

        const [
            departmentsResponse,
            directoratesResponse,
            unitsResponse,
            jobTitlesResponse
        ] = await Promise.all([
            api.get("/organization/departments", {
                params: { active_only: true }
            }),
            api.get("/organization/directorates", {
                params: { active_only: true }
            }),
            api.get("/organization/units", {
                params: { active_only: true }
            }),
            api.get("/organization/job-titles", {
                params: { active_only: true }
            })
        ]);

        setDepartments(
            Array.isArray(departmentsResponse.data)
                ? departmentsResponse.data
                : []
        );

        setDirectorates(
            Array.isArray(directoratesResponse.data)
                ? directoratesResponse.data
                : []
        );

        setUnits(
            Array.isArray(unitsResponse.data)
                ? unitsResponse.data
                : []
        );

        setJobTitles(
            Array.isArray(jobTitlesResponse.data)
                ? jobTitlesResponse.data
                : []
        );
    };


    const loadPage = async () => {

        setLoading(true);
        setError("");

        try {

            await Promise.all([
                getUsers(),
                getWorkplaces(),
                getOrganizationData()
            ]);

        } catch (err) {

            console.error("Personel sayfası yükleme hatası:", err);

            setError(
                err.response?.data?.detail ||
                "Personel ve organizasyon bilgileri alınamadı."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadPage();
    }, []);


    const filteredDirectorates = useMemo(() => {

        if (!form.department_id) {
            return [];
        }

        return directorates.filter(
            (item) =>
                Number(item.department_id) ===
                Number(form.department_id)
        );

    }, [directorates, form.department_id]);


    const filteredUnits = useMemo(() => {

        if (!form.directorate_id) {
            return [];
        }

        return units.filter(
            (item) =>
                Number(item.directorate_id) ===
                Number(form.directorate_id)
        );

    }, [units, form.directorate_id]);


    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setForm((previousForm) => {

            if (name === "department_id") {
                return {
                    ...previousForm,
                    department_id: value,
                    directorate_id: "",
                    organization_unit_id: ""
                };
            }

            if (name === "directorate_id") {
                return {
                    ...previousForm,
                    directorate_id: value,
                    organization_unit_id: ""
                };
            }

            return {
                ...previousForm,
                [name]: value
            };
        });
    };


    const resetForm = () => {
        setForm(initialForm);
        setEditingUser(null);
        setShowForm(false);
    };


    const openCreateForm = () => {

        setMessage("");
        setError("");
        setEditingUser(null);
        setForm(initialForm);
        setShowForm(true);
    };


    const openEditForm = (user) => {

        setMessage("");
        setError("");
        setEditingUser(user);

        setForm({
            name: user.name || "",
            surname: user.surname || "",
            email: user.email || "",
            password: "",
            role: user.role || "employee",
            workplace_id:
                user.workplace_id !== null &&
                    user.workplace_id !== undefined
                    ? String(user.workplace_id)
                    : "",
            department_id:
                user.department_id !== null &&
                    user.department_id !== undefined
                    ? String(user.department_id)
                    : "",
            directorate_id:
                user.directorate_id !== null &&
                    user.directorate_id !== undefined
                    ? String(user.directorate_id)
                    : "",
            organization_unit_id:
                user.organization_unit_id !== null &&
                    user.organization_unit_id !== undefined
                    ? String(user.organization_unit_id)
                    : "",
            job_title_id:
                user.job_title_id !== null &&
                    user.job_title_id !== undefined
                    ? String(user.job_title_id)
                    : ""
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    const validateForm = () => {

        if (
            !form.name.trim() ||
            !form.surname.trim() ||
            !form.email.trim()
        ) {
            setError(
                "Ad, soyad ve e-posta alanları zorunludur."
            );
            return false;
        }

        if (!editingUser && !form.password.trim()) {
            setError(
                "Yeni personel oluştururken şifre zorunludur."
            );
            return false;
        }

        if (
            form.password &&
            form.password.length < 6
        ) {
            setError(
                "Şifre en az 6 karakter olmalıdır."
            );
            return false;
        }

        if (
            form.directorate_id &&
            !form.department_id
        ) {
            setError(
                "Müdürlük seçebilmek için önce daire seçmelisiniz."
            );
            return false;
        }

        if (
            form.organization_unit_id &&
            !form.directorate_id
        ) {
            setError(
                "Birim seçebilmek için önce müdürlük seçmelisiniz."
            );
            return false;
        }

        return true;
    };


    const createPayload = () => ({
        name: form.name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: form.role,
        workplace_id: toNullableNumber(form.workplace_id),
        department_id: toNullableNumber(form.department_id),
        directorate_id: toNullableNumber(form.directorate_id),
        organization_unit_id:
            toNullableNumber(form.organization_unit_id),
        job_title_id: toNullableNumber(form.job_title_id)
    });


    const updatePayload = () => {

        const payload = {
            name: form.name.trim(),
            surname: form.surname.trim(),
            email: form.email.trim(),
            role: form.role,
            workplace_id: toNullableNumber(form.workplace_id),
            department_id: toNullableNumber(form.department_id),
            directorate_id: toNullableNumber(form.directorate_id),
            organization_unit_id:
                toNullableNumber(form.organization_unit_id),
            job_title_id: toNullableNumber(form.job_title_id)
        };

        if (form.password.trim()) {
            payload.password = form.password.trim();
        }

        return payload;
    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        if (!validateForm()) {
            return;
        }

        setFormLoading(true);

        try {

            if (editingUser) {

                const response = await api.put(
                    `/users/${editingUser.id}`,
                    updatePayload()
                );

                setMessage(
                    response.data?.message ||
                    "Personel başarıyla güncellendi."
                );

            } else {

                const response = await api.post(
                    "/users/",
                    createPayload()
                );

                setMessage(
                    response.data?.message ||
                    "Personel başarıyla oluşturuldu."
                );
            }

            resetForm();
            await getUsers();

        } catch (err) {

            console.error(
                "Personel kaydetme hatası:",
                err.response?.data || err
            );

            const detail = err.response?.data?.detail;

            if (Array.isArray(detail)) {

                setError(
                    detail
                        .map((item) => {
                            const field = item.loc?.at(-1);

                            return field
                                ? `${field}: ${item.msg}`
                                : item.msg;
                        })
                        .join(" | ")
                );

            } else {

                setError(
                    detail ||
                    "Personel kaydedilemedi."
                );
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } finally {

            setFormLoading(false);
        }
    };


    const handleDelete = async (user) => {

        const confirmed = window.confirm(
            `${user.name} ${user.surname} adlı kullanıcıyı silmek istediğinize emin misiniz?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(user.id);
        setMessage("");
        setError("");

        try {

            const response = await api.delete(
                `/users/${user.id}`
            );

            setMessage(
                response.data?.message ||
                "Personel başarıyla silindi."
            );

            await getUsers();

        } catch (err) {

            console.error("Personel silme hatası:", err);

            setError(
                err.response?.data?.detail ||
                "Personel silinemedi."
            );

        } finally {

            setDeletingId(null);
        }
    };


    const getRoleInformation = (role) => {

        const normalizedRole =
            String(role || "").toLowerCase();

        if (normalizedRole === "admin") {
            return {
                text: "Admin",
                className:
                    "border-purple-200 bg-purple-100 text-purple-700",
                icon: ShieldCheck
            };
        }

        if (normalizedRole === "manager") {
            return {
                text: "Yönetici",
                className:
                    "border-amber-200 bg-amber-100 text-amber-700",
                icon: BriefcaseBusiness
            };
        }

        return {
            text: "Personel",
            className:
                "border-blue-200 bg-blue-100 text-blue-700",
            icon: UserRound
        };
    };


    const getOrganizationText = (user) => {

        return [
            user.department_name,
            user.directorate_name,
            user.organization_unit_name
        ]
            .filter(Boolean)
            .join(" / ") || "Organizasyon atanmamış";
    };


    const filteredUsers = useMemo(() => {

        const normalizedSearch =
            searchText.trim().toLowerCase();

        if (!normalizedSearch) {
            return users;
        }

        return users.filter((user) => {

            const searchableText = [
                user.name,
                user.surname,
                user.email,
                user.role,
                user.workplace_name,
                user.department_name,
                user.directorate_name,
                user.organization_unit_name,
                user.job_title_name,
                user.job_title
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                normalizedSearch
            );
        });

    }, [users, searchText]);


    const employeeCount = users.filter(
        (user) =>
            String(user.role).toLowerCase() ===
            "employee"
    ).length;


    const managerCount = users.filter(
        (user) =>
            String(user.role).toLowerCase() ===
            "manager"
    ).length;


    const adminCount = users.filter(
        (user) =>
            String(user.role).toLowerCase() ===
            "admin"
    ).length;


    const organizationAssignedCount = users.filter(
        (user) =>
            user.department_id !== null &&
            user.department_id !== undefined
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
                        Personeller yükleniyor...
                    </span>
                </div>
            </div>
        );
    }


    return (

        <div className="space-y-8">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Personel Yönetimi
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Personelleri organizasyon yapısı, unvan, rol ve iş yeri bilgileriyle yönetin.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={loadPage}
                        disabled={loading || formLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
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
                            ? <CircleX size={19} />
                            : <UserPlus size={19} />
                        }

                        {showForm
                            ? "Formu Kapat"
                            : "Yeni Personel"
                        }
                    </button>
                </div>
            </div>


            {message && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                    <CircleCheck size={21} />
                    <span>{message}</span>
                </div>
            )}


            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    <CircleX size={21} />
                    <span>{error}</span>
                </div>
            )}


            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">

                <StatCard
                    title="Toplam Kullanıcı"
                    value={users.length}
                    icon={Users}
                    iconClass="bg-blue-100 text-blue-600"
                    valueClass="text-gray-800"
                />

                <StatCard
                    title="Personel"
                    value={employeeCount}
                    icon={UserRound}
                    iconClass="bg-blue-100 text-blue-600"
                    valueClass="text-blue-600"
                />

                <StatCard
                    title="Yönetici"
                    value={managerCount}
                    icon={BriefcaseBusiness}
                    iconClass="bg-amber-100 text-amber-600"
                    valueClass="text-amber-600"
                />

                <StatCard
                    title="Admin"
                    value={adminCount}
                    icon={ShieldCheck}
                    iconClass="bg-purple-100 text-purple-600"
                    valueClass="text-purple-600"
                />

                <StatCard
                    title="Organizasyona Atanan"
                    value={organizationAssignedCount}
                    icon={Network}
                    iconClass="bg-green-100 text-green-600"
                    valueClass="text-green-600"
                />
            </div>


            {showForm && (

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-6 flex items-center justify-between">

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUser
                                    ? "Personel Düzenle"
                                    : "Yeni Personel Ekle"
                                }
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Kimlik, organizasyon, unvan ve iş yeri bilgilerini doldurun.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                            <CircleX size={21} />
                        </button>
                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        <div>

                            <h3 className="mb-4 border-b border-gray-100 pb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                                Kullanıcı Bilgileri
                            </h3>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                                <FormInput
                                    label="Ad"
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    placeholder="Personelin adı"
                                    required
                                />

                                <FormInput
                                    label="Soyad"
                                    name="surname"
                                    value={form.surname}
                                    onChange={handleInputChange}
                                    placeholder="Personelin soyadı"
                                    required
                                />

                                <FormInput
                                    label="E-posta"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleInputChange}
                                    placeholder="ornek@email.com"
                                    required
                                />

                                <FormInput
                                    label="Şifre"
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleInputChange}
                                    placeholder={
                                        editingUser
                                            ? "Değişmeyecekse boş bırakın"
                                            : "En az 6 karakter"
                                    }
                                    required={!editingUser}
                                />
                            </div>
                        </div>


                        <div>

                            <h3 className="mb-4 border-b border-gray-100 pb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                                Organizasyon Bilgileri
                            </h3>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                                <FormSelect
                                    label="Daire Başkanlığı"
                                    name="department_id"
                                    value={form.department_id}
                                    onChange={handleInputChange}
                                    placeholder="Daire seçiniz"
                                    options={departments}
                                />

                                <FormSelect
                                    label="Müdürlük"
                                    name="directorate_id"
                                    value={form.directorate_id}
                                    onChange={handleInputChange}
                                    placeholder={
                                        form.department_id
                                            ? "Müdürlük seçiniz"
                                            : "Önce daire seçiniz"
                                    }
                                    options={filteredDirectorates}
                                    disabled={!form.department_id}
                                />

                                <FormSelect
                                    label="Birim"
                                    name="organization_unit_id"
                                    value={form.organization_unit_id}
                                    onChange={handleInputChange}
                                    placeholder={
                                        form.directorate_id
                                            ? "Birim seçiniz"
                                            : "Önce müdürlük seçiniz"
                                    }
                                    options={filteredUnits}
                                    disabled={!form.directorate_id}
                                />

                                <FormSelect
                                    label="Unvan"
                                    name="job_title_id"
                                    value={form.job_title_id}
                                    onChange={handleInputChange}
                                    placeholder="Unvan seçiniz"
                                    options={jobTitles}
                                />
                            </div>
                        </div>


                        <div>

                            <h3 className="mb-4 border-b border-gray-100 pb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                                Yetki ve Çalışma Yeri
                            </h3>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Rol
                                    </label>

                                    <select
                                        name="role"
                                        value={form.role}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="employee">
                                            Personel
                                        </option>

                                        <option value="manager">
                                            Yönetici
                                        </option>

                                        <option value="admin">
                                            Admin
                                        </option>
                                    </select>
                                </div>

                                <FormSelect
                                    label="İş Yeri"
                                    name="workplace_id"
                                    value={form.workplace_id}
                                    onChange={handleInputChange}
                                    placeholder="İş yeri seçiniz"
                                    options={workplaces}
                                />
                            </div>
                        </div>


                        <div className="flex justify-end gap-3">

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
                                    : editingUser
                                        ? "Güncelle"
                                        : "Personel Ekle"
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}


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
                            setSearchText(event.target.value)
                        }
                        placeholder="Ad, e-posta, daire, müdürlük, birim, unvan, rol veya iş yerine göre ara..."
                        className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>


            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-6">

                    <h2 className="text-xl font-bold text-gray-800">
                        Kullanıcı Listesi
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        {filteredUsers.length} kullanıcı gösteriliyor
                    </p>
                </div>


                {filteredUsers.length === 0 ? (

                    <div className="p-12 text-center text-gray-500">
                        Arama kriterlerine uygun kullanıcı bulunamadı.
                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>Personel</TableHeader>
                                    <TableHeader>E-posta</TableHeader>
                                    <TableHeader>Organizasyon</TableHeader>
                                    <TableHeader>Unvan</TableHeader>
                                    <TableHeader>Rol</TableHeader>
                                    <TableHeader>İş Yeri</TableHeader>
                                    <TableHeader align="right">
                                        İşlemler
                                    </TableHeader>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredUsers.map((user) => {

                                    const roleInformation =
                                        getRoleInformation(user.role);

                                    const RoleIcon =
                                        roleInformation.icon;

                                    return (

                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 font-bold text-white">
                                                        {user.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() || "K"}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {user.name} {user.surname}
                                                        </p>

                                                        <p className="text-xs text-gray-400">
                                                            Kullanıcı No: {user.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={16} />
                                                    {user.email}
                                                </div>
                                            </td>


                                            <td className="min-w-[260px] px-6 py-4">

                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <Network
                                                        size={16}
                                                        className="mt-0.5 shrink-0"
                                                    />
                                                    <span>
                                                        {getOrganizationText(user)}
                                                    </span>
                                                </div>
                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <span className="text-sm text-gray-600">
                                                    {user.job_title_name ||
                                                        user.job_title ||
                                                        "Atanmamış"}
                                                </span>
                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${roleInformation.className}`}
                                                >
                                                    <RoleIcon size={14} />
                                                    {roleInformation.text}
                                                </span>
                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Building2 size={16} />
                                                    {user.workplace_name ||
                                                        "Atanmamış"}
                                                </div>
                                            </td>


                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(user)
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                                                    >
                                                        <Pencil size={16} />
                                                        Düzenle
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(user)
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            user.id
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingId === user.id
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}


function StatCard({
    title,
    value,
    icon: Icon,
    iconClass,
    valueClass
}) {

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
                        {value}
                    </p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}


function FormInput({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required = false
}) {

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}


function FormSelect({
    label,
    name,
    value,
    onChange,
    placeholder,
    options,
    disabled = false
}) {

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
                <option value="">
                    {placeholder}
                </option>

                {options.map((item) => (
                    <option
                        key={item.id}
                        value={item.id}
                    >
                        {item.name}
                    </option>
                ))}
            </select>
        </div>
    );
}


function TableHeader({
    children,
    align = "left"
}) {

    return (
        <th
            className={`px-6 py-4 text-${align} text-xs font-semibold uppercase tracking-wider text-gray-500`}
        >
            {children}
        </th>
    );
}


export default Employees;