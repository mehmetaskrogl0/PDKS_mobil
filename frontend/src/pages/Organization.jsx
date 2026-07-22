import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import {
    Building2,
    Network,
    BriefcaseBusiness,
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    Save,
    CircleX,
    CircleCheck,
    Search,
    ChevronDown
} from "lucide-react";


const emptyDepartmentForm = {
    name: "",
    code: "",
    description: "",
    is_active: true
};


const emptyDirectorateForm = {
    name: "",
    code: "",
    description: "",
    department_id: "",
    is_active: true
};


const emptyUnitForm = {
    name: "",
    code: "",
    description: "",
    directorate_id: "",
    is_active: true
};


const emptyJobTitleForm = {
    name: "",
    code: "",
    description: "",
    level: 1,
    is_manager: false,
    is_active: true
};


function Organization() {

    const [departments, setDepartments] = useState([]);
    const [directorates, setDirectorates] = useState([]);
    const [units, setUnits] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);

    const [activeTab, setActiveTab] = useState("departments");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [searchText, setSearchText] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [departmentForm, setDepartmentForm] =
        useState(emptyDepartmentForm);

    const [directorateForm, setDirectorateForm] =
        useState(emptyDirectorateForm);

    const [unitForm, setUnitForm] =
        useState(emptyUnitForm);

    const [jobTitleForm, setJobTitleForm] =
        useState(emptyJobTitleForm);

    const [editingDepartment, setEditingDepartment] =
        useState(null);

    const [editingDirectorate, setEditingDirectorate] =
        useState(null);

    const [editingUnit, setEditingUnit] =
        useState(null);

    const [editingJobTitle, setEditingJobTitle] =
        useState(null);


    const loadData = async () => {

        setLoading(true);
        setError("");

        try {

            const [
                departmentsResponse,
                directoratesResponse,
                unitsResponse,
                jobTitlesResponse
            ] = await Promise.all([
                api.get("/organization/departments"),
                api.get("/organization/directorates"),
                api.get("/organization/units"),
                api.get("/organization/job-titles")
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

        } catch (err) {

            console.error("Organizasyon verileri alınamadı:", err);

            setError(
                err.response?.data?.detail ||
                "Organizasyon bilgileri alınamadı."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const clearMessages = () => {
        setMessage("");
        setError("");
    };


    const resetDepartmentForm = () => {
        setDepartmentForm(emptyDepartmentForm);
        setEditingDepartment(null);
    };


    const resetDirectorateForm = () => {
        setDirectorateForm(emptyDirectorateForm);
        setEditingDirectorate(null);
    };


    const resetUnitForm = () => {
        setUnitForm(emptyUnitForm);
        setEditingUnit(null);
    };


    const resetJobTitleForm = () => {
        setJobTitleForm(emptyJobTitleForm);
        setEditingJobTitle(null);
    };


    const handleDepartmentSubmit = async (event) => {

        event.preventDefault();
        clearMessages();

        if (!departmentForm.name.trim()) {
            setError("Daire başkanlığı adı zorunludur.");
            return;
        }

        setSaving(true);

        try {

            const payload = {
                name: departmentForm.name.trim(),
                code: departmentForm.code.trim() || null,
                description:
                    departmentForm.description.trim() || null,
                is_active: departmentForm.is_active
            };

            if (editingDepartment) {

                await api.put(
                    `/organization/departments/${editingDepartment.id}`,
                    payload
                );

                setMessage(
                    "Daire başkanlığı başarıyla güncellendi."
                );

            } else {

                await api.post(
                    "/organization/departments",
                    payload
                );

                setMessage(
                    "Daire başkanlığı başarıyla oluşturuldu."
                );
            }

            resetDepartmentForm();
            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.detail ||
                "Daire başkanlığı kaydedilemedi."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleDirectorateSubmit = async (event) => {

        event.preventDefault();
        clearMessages();

        if (
            !directorateForm.name.trim() ||
            !directorateForm.department_id
        ) {
            setError(
                "Müdürlük adı ve bağlı daire zorunludur."
            );
            return;
        }

        setSaving(true);

        try {

            const payload = {
                name: directorateForm.name.trim(),
                code: directorateForm.code.trim() || null,
                description:
                    directorateForm.description.trim() || null,
                department_id:
                    Number(directorateForm.department_id),
                is_active: directorateForm.is_active
            };

            if (editingDirectorate) {

                await api.put(
                    `/organization/directorates/${editingDirectorate.id}`,
                    payload
                );

                setMessage(
                    "Müdürlük başarıyla güncellendi."
                );

            } else {

                await api.post(
                    "/organization/directorates",
                    payload
                );

                setMessage(
                    "Müdürlük başarıyla oluşturuldu."
                );
            }

            resetDirectorateForm();
            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.detail ||
                "Müdürlük kaydedilemedi."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleUnitSubmit = async (event) => {

        event.preventDefault();
        clearMessages();

        if (
            !unitForm.name.trim() ||
            !unitForm.directorate_id
        ) {
            setError(
                "Birim adı ve bağlı müdürlük zorunludur."
            );
            return;
        }

        setSaving(true);

        try {

            const payload = {
                name: unitForm.name.trim(),
                code: unitForm.code.trim() || null,
                description:
                    unitForm.description.trim() || null,
                directorate_id:
                    Number(unitForm.directorate_id),
                is_active: unitForm.is_active
            };

            if (editingUnit) {

                await api.put(
                    `/organization/units/${editingUnit.id}`,
                    payload
                );

                setMessage(
                    "Birim başarıyla güncellendi."
                );

            } else {

                await api.post(
                    "/organization/units",
                    payload
                );

                setMessage(
                    "Birim başarıyla oluşturuldu."
                );
            }

            resetUnitForm();
            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.detail ||
                "Birim kaydedilemedi."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleJobTitleSubmit = async (event) => {

        event.preventDefault();
        clearMessages();

        if (!jobTitleForm.name.trim()) {
            setError("Unvan adı zorunludur.");
            return;
        }

        setSaving(true);

        try {

            const payload = {
                name: jobTitleForm.name.trim(),
                code: jobTitleForm.code.trim() || null,
                description:
                    jobTitleForm.description.trim() || null,
                level: Number(jobTitleForm.level) || 1,
                is_manager: jobTitleForm.is_manager,
                is_active: jobTitleForm.is_active
            };

            if (editingJobTitle) {

                await api.put(
                    `/organization/job-titles/${editingJobTitle.id}`,
                    payload
                );

                setMessage(
                    "Unvan başarıyla güncellendi."
                );

            } else {

                await api.post(
                    "/organization/job-titles",
                    payload
                );

                setMessage(
                    "Unvan başarıyla oluşturuldu."
                );
            }

            resetJobTitleForm();
            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.detail ||
                "Unvan kaydedilemedi."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleDelete = async (
        type,
        item
    ) => {

        const labels = {
            departments: "daire başkanlığını",
            directorates: "müdürlüğü",
            units: "birimi",
            jobTitles: "unvanı"
        };

        const endpoints = {
            departments:
                `/organization/departments/${item.id}`,
            directorates:
                `/organization/directorates/${item.id}`,
            units:
                `/organization/units/${item.id}`,
            jobTitles:
                `/organization/job-titles/${item.id}`
        };

        const confirmed = window.confirm(
            `${item.name} adlı ${labels[type]} silmek istediğinize emin misiniz?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(`${type}-${item.id}`);
        clearMessages();

        try {

            const response = await api.delete(
                endpoints[type]
            );

            setMessage(
                response.data?.message ||
                "Kayıt başarıyla silindi."
            );

            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.detail ||
                "Kayıt silinemedi."
            );

        } finally {

            setDeletingId(null);
        }
    };


    const editDepartment = (item) => {

        clearMessages();

        setDepartmentForm({
            name: item.name || "",
            code: item.code || "",
            description: item.description || "",
            is_active: item.is_active ?? true
        });

        setEditingDepartment(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const editDirectorate = (item) => {

        clearMessages();

        setDirectorateForm({
            name: item.name || "",
            code: item.code || "",
            description: item.description || "",
            department_id:
                item.department_id
                    ? String(item.department_id)
                    : "",
            is_active: item.is_active ?? true
        });

        setEditingDirectorate(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const editUnit = (item) => {

        clearMessages();

        setUnitForm({
            name: item.name || "",
            code: item.code || "",
            description: item.description || "",
            directorate_id:
                item.directorate_id
                    ? String(item.directorate_id)
                    : "",
            is_active: item.is_active ?? true
        });

        setEditingUnit(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const editJobTitle = (item) => {

        clearMessages();

        setJobTitleForm({
            name: item.name || "",
            code: item.code || "",
            description: item.description || "",
            level: item.level || 1,
            is_manager: item.is_manager ?? false,
            is_active: item.is_active ?? true
        });

        setEditingJobTitle(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const filteredData = useMemo(() => {

        const search =
            searchText.trim().toLowerCase();

        const filterItems = (items, fields) => {

            if (!search) {
                return items;
            }

            return items.filter((item) => {

                const text = fields
                    .map((field) => item[field])
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);
            });
        };

        return {
            departments: filterItems(
                departments,
                ["name", "code", "description"]
            ),
            directorates: filterItems(
                directorates,
                [
                    "name",
                    "code",
                    "description",
                    "department_name"
                ]
            ),
            units: filterItems(
                units,
                [
                    "name",
                    "code",
                    "description",
                    "directorate_name",
                    "department_name"
                ]
            ),
            jobTitles: filterItems(
                jobTitles,
                ["name", "code", "description"]
            )
        };

    }, [
        searchText,
        departments,
        directorates,
        units,
        jobTitles
    ]);


    if (loading) {

        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <RefreshCw
                        size={23}
                        className="animate-spin"
                    />
                    <span>
                        Organizasyon yapısı yükleniyor...
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
                        Organizasyon Yönetimi
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Daire, müdürlük, birim ve unvan yapılarını yönetin.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadData}
                    disabled={loading || saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw size={18} />
                    Yenile
                </button>
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


            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <SummaryCard
                    title="Daire Başkanlığı"
                    value={departments.length}
                    icon={Building2}
                    className="bg-blue-100 text-blue-600"
                />

                <SummaryCard
                    title="Müdürlük"
                    value={directorates.length}
                    icon={Network}
                    className="bg-purple-100 text-purple-600"
                />

                <SummaryCard
                    title="Birim"
                    value={units.length}
                    icon={ChevronDown}
                    className="bg-green-100 text-green-600"
                />

                <SummaryCard
                    title="Unvan"
                    value={jobTitles.length}
                    icon={BriefcaseBusiness}
                    className="bg-amber-100 text-amber-600"
                />
            </div>


            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">

                    <TabButton
                        active={activeTab === "departments"}
                        onClick={() => setActiveTab("departments")}
                        label="Daire Başkanlıkları"
                    />

                    <TabButton
                        active={activeTab === "directorates"}
                        onClick={() => setActiveTab("directorates")}
                        label="Müdürlükler"
                    />

                    <TabButton
                        active={activeTab === "units"}
                        onClick={() => setActiveTab("units")}
                        label="Birimler"
                    />

                    <TabButton
                        active={activeTab === "jobTitles"}
                        onClick={() => setActiveTab("jobTitles")}
                        label="Unvanlar"
                    />
                </div>


                <div className="p-6">

                    {activeTab === "departments" && (
                        <DepartmentSection
                            form={departmentForm}
                            setForm={setDepartmentForm}
                            editingItem={editingDepartment}
                            onSubmit={handleDepartmentSubmit}
                            onCancel={resetDepartmentForm}
                            items={filteredData.departments}
                            onEdit={editDepartment}
                            onDelete={(item) =>
                                handleDelete("departments", item)
                            }
                            deletingId={deletingId}
                            saving={saving}
                        />
                    )}


                    {activeTab === "directorates" && (
                        <DirectorateSection
                            form={directorateForm}
                            setForm={setDirectorateForm}
                            editingItem={editingDirectorate}
                            onSubmit={handleDirectorateSubmit}
                            onCancel={resetDirectorateForm}
                            items={filteredData.directorates}
                            departments={departments}
                            onEdit={editDirectorate}
                            onDelete={(item) =>
                                handleDelete("directorates", item)
                            }
                            deletingId={deletingId}
                            saving={saving}
                        />
                    )}


                    {activeTab === "units" && (
                        <UnitSection
                            form={unitForm}
                            setForm={setUnitForm}
                            editingItem={editingUnit}
                            onSubmit={handleUnitSubmit}
                            onCancel={resetUnitForm}
                            items={filteredData.units}
                            directorates={directorates}
                            onEdit={editUnit}
                            onDelete={(item) =>
                                handleDelete("units", item)
                            }
                            deletingId={deletingId}
                            saving={saving}
                        />
                    )}


                    {activeTab === "jobTitles" && (
                        <JobTitleSection
                            form={jobTitleForm}
                            setForm={setJobTitleForm}
                            editingItem={editingJobTitle}
                            onSubmit={handleJobTitleSubmit}
                            onCancel={resetJobTitleForm}
                            items={filteredData.jobTitles}
                            onEdit={editJobTitle}
                            onDelete={(item) =>
                                handleDelete("jobTitles", item)
                            }
                            deletingId={deletingId}
                            saving={saving}
                        />
                    )}
                </div>
            </div>


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
                        placeholder="Aktif sekmede ad, kod veya açıklamaya göre ara..."
                        className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>
        </div>
    );
}


function DepartmentSection(props) {

    const {
        form,
        setForm,
        editingItem,
        onSubmit,
        onCancel,
        items,
        onEdit,
        onDelete,
        deletingId,
        saving
    } = props;

    return (
        <OrganizationSection
            title="Daire Başkanlığı"
            description="HATSU bünyesindeki ana daire yapılarını yönetin."
            form={
                <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    <TextInput
                        label="Daire Adı"
                        value={form.name}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                name: value
                            })
                        }
                        placeholder="Örn: Bilgi İşlem Dairesi Başkanlığı"
                    />

                    <TextInput
                        label="Kod"
                        value={form.code}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                code: value
                            })
                        }
                        placeholder="Örn: BIDB"
                    />

                    <TextArea
                        label="Açıklama"
                        value={form.description}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                description: value
                            })
                        }
                    />

                    <FormActions
                        editing={Boolean(editingItem)}
                        saving={saving}
                        onCancel={onCancel}
                    />

                    <ActiveCheckbox
                        checked={form.is_active}
                        onChange={(checked) =>
                            setForm({
                                ...form,
                                is_active: checked
                            })
                        }
                    />
                </form>
            }
            table={
                <BasicTable
                    items={items}
                    columns={[
                        ["name", "Daire Adı"],
                        ["code", "Kod"],
                        ["directorate_count", "Müdürlük"],
                        ["personnel_count", "Personel"]
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                    deletePrefix="departments"
                />
            }
        />
    );
}


function DirectorateSection(props) {

    const {
        form,
        setForm,
        editingItem,
        onSubmit,
        onCancel,
        items,
        departments,
        onEdit,
        onDelete,
        deletingId,
        saving
    } = props;

    return (
        <OrganizationSection
            title="Müdürlük"
            description="Daire başkanlıklarına bağlı müdürlükleri yönetin."
            form={
                <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    <TextInput
                        label="Müdürlük Adı"
                        value={form.name}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                name: value
                            })
                        }
                        placeholder="Örn: Yazılım Şube Müdürlüğü"
                    />

                    <SelectInput
                        label="Bağlı Daire"
                        value={form.department_id}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                department_id: value
                            })
                        }
                        options={departments}
                        placeholder="Daire seçiniz"
                    />

                    <TextInput
                        label="Kod"
                        value={form.code}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                code: value
                            })
                        }
                        placeholder="Örn: YSM"
                    />

                    <TextArea
                        label="Açıklama"
                        value={form.description}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                description: value
                            })
                        }
                    />

                    <ActiveCheckbox
                        checked={form.is_active}
                        onChange={(checked) =>
                            setForm({
                                ...form,
                                is_active: checked
                            })
                        }
                    />

                    <FormActions
                        editing={Boolean(editingItem)}
                        saving={saving}
                        onCancel={onCancel}
                    />
                </form>
            }
            table={
                <BasicTable
                    items={items}
                    columns={[
                        ["name", "Müdürlük"],
                        ["department_name", "Bağlı Daire"],
                        ["code", "Kod"],
                        ["unit_count", "Birim"],
                        ["personnel_count", "Personel"]
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                    deletePrefix="directorates"
                />
            }
        />
    );
}


function UnitSection(props) {

    const {
        form,
        setForm,
        editingItem,
        onSubmit,
        onCancel,
        items,
        directorates,
        onEdit,
        onDelete,
        deletingId,
        saving
    } = props;

    return (
        <OrganizationSection
            title="Birim"
            description="Müdürlüklere bağlı çalışma birimlerini yönetin."
            form={
                <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    <TextInput
                        label="Birim Adı"
                        value={form.name}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                name: value
                            })
                        }
                        placeholder="Örn: Web Yazılım Birimi"
                    />

                    <SelectInput
                        label="Bağlı Müdürlük"
                        value={form.directorate_id}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                directorate_id: value
                            })
                        }
                        options={directorates}
                        placeholder="Müdürlük seçiniz"
                    />

                    <TextInput
                        label="Kod"
                        value={form.code}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                code: value
                            })
                        }
                        placeholder="Örn: WYB"
                    />

                    <TextArea
                        label="Açıklama"
                        value={form.description}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                description: value
                            })
                        }
                    />

                    <ActiveCheckbox
                        checked={form.is_active}
                        onChange={(checked) =>
                            setForm({
                                ...form,
                                is_active: checked
                            })
                        }
                    />

                    <FormActions
                        editing={Boolean(editingItem)}
                        saving={saving}
                        onCancel={onCancel}
                    />
                </form>
            }
            table={
                <BasicTable
                    items={items}
                    columns={[
                        ["name", "Birim"],
                        ["directorate_name", "Müdürlük"],
                        ["department_name", "Daire"],
                        ["code", "Kod"],
                        ["personnel_count", "Personel"]
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                    deletePrefix="units"
                />
            }
        />
    );
}


function JobTitleSection(props) {

    const {
        form,
        setForm,
        editingItem,
        onSubmit,
        onCancel,
        items,
        onEdit,
        onDelete,
        deletingId,
        saving
    } = props;

    return (
        <OrganizationSection
            title="Unvan"
            description="Personellere atanabilecek kurumsal unvanları yönetin."
            form={
                <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    <TextInput
                        label="Unvan Adı"
                        value={form.name}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                name: value
                            })
                        }
                        placeholder="Örn: Yazılım Mühendisi"
                    />

                    <TextInput
                        label="Kod"
                        value={form.code}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                code: value
                            })
                        }
                        placeholder="Örn: YM"
                    />

                    <TextInput
                        label="Seviye"
                        type="number"
                        value={form.level}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                level: value
                            })
                        }
                        placeholder="1"
                    />

                    <TextArea
                        label="Açıklama"
                        value={form.description}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                description: value
                            })
                        }
                    />

                    <div className="flex flex-wrap gap-6">

                        <ActiveCheckbox
                            checked={form.is_active}
                            onChange={(checked) =>
                                setForm({
                                    ...form,
                                    is_active: checked
                                })
                            }
                        />

                        <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">

                            <input
                                type="checkbox"
                                checked={form.is_manager}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        is_manager:
                                            event.target.checked
                                    })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            Yönetici Unvanı
                        </label>
                    </div>

                    <FormActions
                        editing={Boolean(editingItem)}
                        saving={saving}
                        onCancel={onCancel}
                    />
                </form>
            }
            table={
                <BasicTable
                    items={items}
                    columns={[
                        ["name", "Unvan"],
                        ["code", "Kod"],
                        ["level", "Seviye"],
                        ["is_manager", "Yönetici"],
                        ["personnel_count", "Personel"]
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                    deletePrefix="jobTitles"
                />
            }
        />
    );
}


function OrganizationSection({
    title,
    description,
    form,
    table
}) {

    return (
        <div className="space-y-8">

            <div>
                <h2 className="text-xl font-bold text-gray-800">
                    {title} Yönetimi
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    {description}
                </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                {form}
            </div>

            {table}
        </div>
    );
}


function SummaryCard({
    title,
    value,
    icon: Icon,
    className
}) {

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-800">
                        {value}
                    </p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${className}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}


function TabButton({
    active,
    onClick,
    label
}) {

    return (
        <button
            type="button"
            onClick={onClick}
            className={`border-b-2 px-5 py-4 text-sm font-semibold transition ${active
                    ? "border-blue-600 bg-white text-blue-600"
                    : "border-transparent text-gray-500 hover:bg-white hover:text-gray-800"
                }`}
        >
            {label}
        </button>
    );
}


function TextInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder
}) {

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}


function TextArea({
    label,
    value,
    onChange
}) {

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <textarea
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}


function SelectInput({
    label,
    value,
    onChange,
    options,
    placeholder
}) {

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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


function ActiveCheckbox({
    checked,
    onChange
}) {

    return (
        <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">

            <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                    onChange(event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            Aktif
        </label>
    );
}


function FormActions({
    editing,
    saving,
    onCancel
}) {

    return (
        <div className="flex items-end justify-end gap-3">

            {editing && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <CircleX size={18} />
                    Vazgeç
                </button>
            )}

            <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
                {saving
                    ? (
                        <RefreshCw
                            size={18}
                            className="animate-spin"
                        />
                    )
                    : editing
                        ? <Save size={18} />
                        : <Plus size={18} />
                }

                {saving
                    ? "Kaydediliyor..."
                    : editing
                        ? "Güncelle"
                        : "Ekle"
                }
            </button>
        </div>
    );
}


function BasicTable({
    items,
    columns,
    onEdit,
    onDelete,
    deletingId,
    deletePrefix
}) {

    if (items.length === 0) {

        return (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                Kayıt bulunamadı.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">

            <table className="min-w-full bg-white">

                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(([field, label]) => (
                            <th
                                key={field}
                                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                            >
                                {label}
                            </th>
                        ))}

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Durum
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                            İşlemler
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                    {items.map((item) => (

                        <tr
                            key={item.id}
                            className="transition hover:bg-gray-50"
                        >

                            {columns.map(([field]) => (

                                <td
                                    key={field}
                                    className="whitespace-nowrap px-5 py-4 text-sm text-gray-700"
                                >
                                    {formatCellValue(
                                        field,
                                        item[field]
                                    )}
                                </td>
                            ))}

                            <td className="whitespace-nowrap px-5 py-4 text-right">

                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {item.is_active
                                        ? "Aktif"
                                        : "Pasif"
                                    }
                                </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">

                                <div className="flex justify-end gap-2">

                                    <button
                                        type="button"
                                        onClick={() => onEdit(item)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                                    >
                                        <Pencil size={16} />
                                        Düzenle
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onDelete(item)}
                                        disabled={
                                            deletingId ===
                                            `${deletePrefix}-${item.id}`
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                                    >
                                        {deletingId ===
                                            `${deletePrefix}-${item.id}`
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}


function formatCellValue(field, value) {

    if (
        field === "is_manager"
    ) {
        return value ? "Evet" : "Hayır";
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    return value;
}


export default Organization;