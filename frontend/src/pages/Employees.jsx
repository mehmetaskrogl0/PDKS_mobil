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
    UserRound
} from "lucide-react";


const initialForm = {
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "employee",
    workplace_id: ""
};


function Employees() {

    const [users, setUsers] = useState([]);
    const [workplaces, setWorkplaces] = useState([]);

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

        if (Array.isArray(response.data)) {

            setUsers(response.data);

        } else {

            setUsers([]);

        }

    };



    const getWorkplaces = async () => {

        const response = await api.get("/workplaces/");

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

            await Promise.all([
                getUsers(),
                getWorkplaces()
            ]);

        } catch (err) {

            console.log(err);

            if (err.response?.status === 403) {

                setError(
                    "Personel yönetimi için admin yetkisine sahip olmalısınız."
                );

            } else {

                setError(
                    err.response?.data?.detail ||
                    "Personel bilgileri alınamadı."
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
            form.role === "employee" &&
            !form.workplace_id
        ) {

            setError(
                "Personel için bir iş yeri seçmelisiniz."
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


        try {

            if (editingUser) {

                const updateData = {
                    name: form.name.trim(),
                    surname: form.surname.trim(),
                    email: form.email.trim(),
                    role: form.role,
                    workplace_id:
                        form.workplace_id
                            ? Number(form.workplace_id)
                            : null
                };


                if (form.password.trim()) {

                    updateData.password =
                        form.password.trim();

                }


                const response = await api.put(
                    `/users/${editingUser.id}`,
                    updateData
                );


                setMessage(
                    response.data?.message ||
                    "Kullanıcı başarıyla güncellendi."
                );

            } else {

                const createData = {
                    name: form.name.trim(),
                    surname: form.surname.trim(),
                    email: form.email.trim(),
                    password: form.password.trim(),
                    role: form.role,
                    workplace_id:
                        form.workplace_id
                            ? Number(form.workplace_id)
                            : null
                };


                const response = await api.post(
                    "/users/",
                    createData
                );


                setMessage(
                    response.data?.message ||
                    "Kullanıcı başarıyla oluşturuldu."
                );

            }


            resetForm();

            await getUsers();

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "Kullanıcı kaydedilemedi."
            );

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
                "Kullanıcı başarıyla silindi."
            );


            await getUsers();

        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.detail ||
                "Kullanıcı silinemedi."
            );

        } finally {

            setDeletingId(null);

        }

    };



    const getWorkplaceName = (workplaceId) => {

        if (
            workplaceId === null ||
            workplaceId === undefined
        ) {

            return "Atanmamış";

        }


        const workplace = workplaces.find(
            (item) =>
                Number(item.id) ===
                Number(workplaceId)
        );


        return workplace?.name || "Atanmamış";

    };



    const getRoleInformation = (role) => {

        if (
            String(role).toLowerCase() === "admin"
        ) {

            return {
                text: "Yönetici",
                className:
                    "border-purple-200 bg-purple-100 text-purple-700",
                icon: ShieldCheck
            };

        }


        return {
            text: "Personel",
            className:
                "border-blue-200 bg-blue-100 text-blue-700",
            icon: UserRound
        };

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
                getWorkplaceName(
                    user.workplace_id
                )
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                normalizedSearch
            );

        });

    }, [
        users,
        workplaces,
        searchText
    ]);



    const employeeCount = users.filter(
        (user) =>
            String(user.role).toLowerCase() ===
            "employee"
    ).length;


    const adminCount = users.filter(
        (user) =>
            String(user.role).toLowerCase() ===
            "admin"
    ).length;


    const assignedCount = users.filter(
        (user) =>
            user.workplace_id !== null &&
            user.workplace_id !== undefined
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


            {/* BAŞLIK */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Personel Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Personelleri görüntüleyebilir, ekleyebilir, düzenleyebilir ve silebilirsiniz.

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



            {/* İSTATİSTİKLER */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Toplam Kullanıcı

                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-800">

                                {users.length}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                            <Users size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Personel

                            </p>

                            <p className="mt-2 text-3xl font-bold text-blue-600">

                                {employeeCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                            <UserRound size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                Yönetici

                            </p>

                            <p className="mt-2 text-3xl font-bold text-purple-600">

                                {adminCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">

                            <ShieldCheck size={24} />

                        </div>

                    </div>

                </div>



                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">

                                İş Yeri Atanan

                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-600">

                                {assignedCount}

                            </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">

                            <Building2 size={24} />

                        </div>

                    </div>

                </div>

            </div>



            {/* PERSONEL FORMU */}

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

                                {editingUser
                                    ? "Kullanıcı bilgilerini güncelleyin."
                                    : "Yeni kullanıcı bilgilerini girin."
                                }

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
                        className="space-y-5"
                    >

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Ad

                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    placeholder="Personelin adı"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Soyad

                                </label>

                                <input
                                    type="text"
                                    name="surname"
                                    value={form.surname}
                                    onChange={handleInputChange}
                                    placeholder="Personelin soyadı"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    E-posta

                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleInputChange}
                                    placeholder="ornek@email.com"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />

                            </div>



                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Şifre

                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleInputChange}
                                    placeholder={
                                        editingUser
                                            ? "Değiştirmeyecekseniz boş bırakın"
                                            : "En az 6 karakter"
                                    }
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required={!editingUser}
                                />

                            </div>



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

                                    <option value="admin">

                                        Yönetici

                                    </option>

                                </select>

                            </div>



                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    İş Yeri

                                </label>

                                <select
                                    name="workplace_id"
                                    value={form.workplace_id}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">

                                        İş yeri seçiniz

                                    </option>


                                    {workplaces.map(
                                        (workplace) => (

                                            <option
                                                key={workplace.id}
                                                value={workplace.id}
                                            >

                                                {workplace.name}

                                            </option>

                                        )
                                    )}

                                </select>

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
                                    : (
                                        editingUser
                                            ? "Güncelle"
                                            : "Personel Ekle"
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
                        placeholder="Ad, soyad, e-posta, rol veya iş yerine göre ara..."
                        className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

            </div>



            {/* PERSONEL LİSTESİ */}

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

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Personel

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        E-posta

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        Rol

                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        İş Yeri

                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                                        İşlemler

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {filteredUsers.map(
                                    (user) => {

                                        const roleInformation =
                                            getRoleInformation(
                                                user.role
                                            );

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

                                                        {getWorkplaceName(
                                                            user.workplace_id
                                                        )}

                                                    </div>

                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4">

                                                    <div className="flex justify-end gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    user
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
                                                                    user
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                user.id
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >

                                                            {deletingId ===
                                                                user.id
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


export default Employees;