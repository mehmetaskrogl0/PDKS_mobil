import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import {
    Users,
    Plus,
    RefreshCw,
    Crown,
    Pencil,
    Trash2,
    X,
    Save,
    UserPlus,
    ChevronDown,
    ChevronUp,
    Search,
    Check,
    Briefcase,
    Mail,
    Building2
} from "lucide-react";


function Teams() {

    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [workplaces, setWorkplaces] = useState([]);

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [memberLoadingId, setMemberLoadingId] = useState(null);
    const [detailLoadingId, setDetailLoadingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [expandedTeamId, setExpandedTeamId] = useState(null);

    const [teamDetails, setTeamDetails] = useState({});

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [workplaceId, setWorkplaceId] = useState("");

    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [memberSearchText, setMemberSearchText] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    const [editingMember, setEditingMember] = useState(null);
    const [editJobTitle, setEditJobTitle] = useState("");
    const [editJobDescription, setEditJobDescription] = useState("");
    const [memberEditLoading, setMemberEditLoading] = useState(false);
    const [leaderLoadingId, setLeaderLoadingId] = useState(null);



    const getTeams = async () => {

        const response = await api.get("/teams/");

        if (Array.isArray(response.data)) {

            setTeams(response.data);

        } else {

            setTeams([]);

        }

    };



    const getEmployees = async () => {

        const response = await api.get("/users/");

        if (Array.isArray(response.data)) {

            setEmployees(response.data);

        } else if (Array.isArray(response.data?.users)) {

            setEmployees(response.data.users);

        } else {

            setEmployees([]);

        }

    };



    const getWorkplaces = async () => {

        const response = await api.get("/workplaces/");

        if (Array.isArray(response.data)) {

            setWorkplaces(response.data);

        } else if (Array.isArray(response.data?.workplaces)) {

            setWorkplaces(response.data.workplaces);

        } else {

            setWorkplaces([]);

        }

    };



    const loadPage = async (showSuccessToast = false) => {

        setLoading(true);

        try {

            await Promise.all([
                getTeams(),
                getEmployees(),
                getWorkplaces()
            ]);

            if (showSuccessToast) {

                toast.success(
                    "Ekip bilgileri yenilendi."
                );

            }

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip bilgileri alınamadı."
            );

        } finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        loadPage();

    }, []);



    const resetTeamForm = () => {

        setName("");
        setDescription("");
        setLeaderId("");
        setWorkplaceId("");
        setEditingTeamId(null);

    };



    const resetMemberForm = () => {

        setSelectedMemberIds([]);
        setMemberSearchText("");
        setJobTitle("");
        setJobDescription("");

    };



    const resetMemberEditForm = () => {

        setEditingMember(null);
        setEditJobTitle("");
        setEditJobDescription("");

    };



    const openCreateForm = () => {

        resetTeamForm();
        setShowForm(true);

    };



    const openEditForm = (team) => {

        setEditingTeamId(team.id);
        setName(team.name || "");
        setDescription(team.description || "");

        setLeaderId(
            team.leader_id
                ? String(team.leader_id)
                : ""
        );

        setWorkplaceId(
            team.workplace_id
                ? String(team.workplace_id)
                : ""
        );

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };



    const closeForm = () => {

        resetTeamForm();
        setShowForm(false);

    };



    const handleSubmit = async (event) => {

        event.preventDefault();

        if (!name.trim()) {

            toast.error(
                "Ekip adı zorunludur."
            );

            return;

        }

        setFormLoading(true);

        const requestBody = {

            name: name.trim(),

            description:
                description.trim() || null,

            leader_id:
                leaderId
                    ? Number(leaderId)
                    : null,

            workplace_id:
                workplaceId
                    ? Number(workplaceId)
                    : null

        };

        try {

            if (editingTeamId) {

                await api.put(
                    `/teams/${editingTeamId}`,
                    requestBody
                );

                toast.success(
                    "Ekip başarıyla güncellendi."
                );

            } else {

                await api.post(
                    "/teams/",
                    requestBody
                );

                toast.success(
                    "Ekip başarıyla oluşturuldu."
                );

            }

            closeForm();

            await Promise.all([
                getTeams(),
                getEmployees()
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip kaydedilemedi."
            );

        } finally {

            setFormLoading(false);

        }

    };



    const handleDeleteTeam = async (team) => {

        const confirmed = window.confirm(
            `${team.name} ekibini silmek istediğinize emin misiniz?`
        );

        if (!confirmed) {

            return;

        }

        try {

            await api.delete(
                `/teams/${team.id}`
            );

            toast.success(
                "Ekip başarıyla silindi."
            );

            setExpandedTeamId(null);

            setTeamDetails(
                (previousDetails) => {

                    const newDetails = {
                        ...previousDetails
                    };

                    delete newDetails[team.id];

                    return newDetails;

                }
            );

            await Promise.all([
                getTeams(),
                getEmployees()
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip silinemedi."
            );

        }

    };



    const getTeamDetail = async (teamId) => {

        setDetailLoadingId(teamId);

        try {

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeamDetails(
                (previousDetails) => ({
                    ...previousDetails,
                    [teamId]: response.data
                })
            );

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip detayları alınamadı."
            );

        } finally {

            setDetailLoadingId(null);

        }

    };



    const toggleTeamDetail = async (teamId) => {

        resetMemberForm();
        resetMemberEditForm();

        if (expandedTeamId === teamId) {

            setExpandedTeamId(null);

            return;

        }

        setExpandedTeamId(teamId);

        await getTeamDetail(teamId);

    };



    const toggleMemberSelection = (userId) => {

        setSelectedMemberIds(
            (previousIds) => {

                if (previousIds.includes(userId)) {

                    return previousIds.filter(
                        (id) => id !== userId
                    );

                }

                return [
                    ...previousIds,
                    userId
                ];

            }
        );

    };



    const handleSelectAll = (
        availableEmployees
    ) => {

        const availableIds =
            availableEmployees.map(
                (employee) => employee.id
            );

        const allSelected =
            availableIds.length > 0 &&
            availableIds.every(
                (id) =>
                    selectedMemberIds.includes(id)
            );

        if (allSelected) {

            setSelectedMemberIds([]);

        } else {

            setSelectedMemberIds(
                availableIds
            );

        }

    };



    const handleAddMembers = async (
        event,
        teamId
    ) => {

        event.preventDefault();

        if (selectedMemberIds.length === 0) {

            toast.error(
                "En az bir personel seçmelisiniz."
            );

            return;

        }

        setMemberLoadingId(teamId);

        const toastId = toast.loading(
            `${selectedMemberIds.length} personel ekibe ekleniyor...`
        );

        try {

            const results = await Promise.allSettled(

                selectedMemberIds.map(
                    (userId) =>
                        api.post(
                            `/teams/${teamId}/members`,
                            {
                                user_id: userId,

                                job_title:
                                    jobTitle.trim() ||
                                    null,

                                job_description:
                                    jobDescription.trim() ||
                                    null
                            }
                        )
                )

            );

            const successCount =
                results.filter(
                    (result) =>
                        result.status ===
                        "fulfilled"
                ).length;

            const failedResults =
                results.filter(
                    (result) =>
                        result.status ===
                        "rejected"
                );

            if (successCount > 0) {

                toast.success(
                    `${successCount} personel ekibe eklendi.`,
                    {
                        id: toastId
                    }
                );

            }

            if (
                successCount === 0 &&
                failedResults.length > 0
            ) {

                const firstError =
                    failedResults[0]
                        .reason
                        ?.response
                        ?.data
                        ?.detail;

                toast.error(
                    firstError ||
                    "Personeller ekibe eklenemedi.",
                    {
                        id: toastId
                    }
                );

            } else if (failedResults.length > 0) {

                toast.error(
                    `${failedResults.length} personel eklenemedi.`
                );

            }

            resetMemberForm();

            await Promise.all([
                getTeams(),
                getEmployees(),
                getTeamDetail(teamId)
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Personeller ekibe eklenemedi.",
                {
                    id: toastId
                }
            );

        } finally {

            setMemberLoadingId(null);

        }

    };



    const openMemberEdit = (
        teamId,
        member
    ) => {

        setEditingMember({
            teamId,
            userId: member.id,
            name: member.name,
            surname: member.surname
        });

        setEditJobTitle(
            member.job_title || ""
        );

        setEditJobDescription(
            member.job_description || ""
        );

    };



    const handleUpdateMember = async (
        event
    ) => {

        event.preventDefault();

        if (!editingMember) {

            return;

        }

        setMemberEditLoading(true);

        try {

            await api.put(
                `/teams/${editingMember.teamId}/members/${editingMember.userId}`,
                {
                    job_title:
                        editJobTitle.trim() ||
                        null,

                    job_description:
                        editJobDescription.trim() ||
                        null
                }
            );

            toast.success(
                "Personelin görev bilgileri güncellendi."
            );

            const teamId =
                editingMember.teamId;

            resetMemberEditForm();

            await Promise.all([
                getTeams(),
                getEmployees(),
                getTeamDetail(teamId)
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Personel bilgileri güncellenemedi."
            );

        } finally {

            setMemberEditLoading(false);

        }

    };



    const handleAssignLeader = async (
        teamId,
        member
    ) => {

        const confirmed = window.confirm(
            `${member.name} ${member.surname} ekip lideri yapılsın mı?`
        );

        if (!confirmed) {

            return;

        }

        setLeaderLoadingId(member.id);

        try {

            await api.put(
                `/teams/${teamId}/leader`,
                {
                    leader_id: member.id
                }
            );

            toast.success(
                `${member.name} ${member.surname} ekip lideri yapıldı.`
            );

            await Promise.all([
                getTeams(),
                getEmployees(),
                getTeamDetail(teamId)
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip lideri atanamadı."
            );

        } finally {

            setLeaderLoadingId(null);

        }

    };



    const handleRemoveLeader = async (
        teamId
    ) => {

        const confirmed = window.confirm(
            "Ekip liderini kaldırmak istediğinize emin misiniz?"
        );

        if (!confirmed) {

            return;

        }

        try {

            await api.put(
                `/teams/${teamId}/leader`,
                {
                    leader_id: null
                }
            );

            toast.success(
                "Ekip lideri kaldırıldı."
            );

            await Promise.all([
                getTeams(),
                getTeamDetail(teamId)
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Ekip lideri kaldırılamadı."
            );

        }

    };



    const handleRemoveMember = async (
        teamId,
        member
    ) => {

        const confirmed = window.confirm(
            `${member.name} ${member.surname} adlı personeli ekipten çıkarmak istediğinize emin misiniz?`
        );

        if (!confirmed) {

            return;

        }

        setMemberLoadingId(teamId);

        try {

            await api.delete(
                `/teams/${teamId}/members/${member.id}`
            );

            toast.success(
                "Personel ekipten çıkarıldı."
            );

            if (
                editingMember?.userId ===
                member.id
            ) {

                resetMemberEditForm();

            }

            await Promise.all([
                getTeams(),
                getEmployees(),
                getTeamDetail(teamId)
            ]);

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.detail ||
                "Personel ekipten çıkarılamadı."
            );

        } finally {

            setMemberLoadingId(null);

        }

    };



    const getAvailableEmployees = (
        teamId,
        detail
    ) => {

        const currentMemberIds =
            detail?.members?.map(
                (member) => member.id
            ) || [];

        return employees.filter(
            (employee) => {

                const alreadyMember =
                    currentMemberIds.includes(
                        employee.id
                    );

                if (alreadyMember) {

                    return false;

                }

                return (
                    !employee.team_id ||
                    Number(employee.team_id) ===
                    Number(teamId)
                );

            }
        );

    };



    const getFilteredAvailableEmployees = (
        teamId,
        detail
    ) => {

        const availableEmployees =
            getAvailableEmployees(
                teamId,
                detail
            );

        const search =
            memberSearchText
                .trim()
                .toLowerCase();

        if (!search) {

            return availableEmployees;

        }

        return availableEmployees.filter(
            (employee) => {

                const searchableText = [
                    employee.name,
                    employee.surname,
                    employee.email,
                    employee.job_title,
                    employee.workplace_name
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(
                    search
                );

            }
        );

    };



    const selectedEmployees = useMemo(
        () =>
            employees.filter(
                (employee) =>
                    selectedMemberIds.includes(
                        employee.id
                    )
            ),
        [
            employees,
            selectedMemberIds
        ]
    );



    if (loading) {

        return (

            <div className="flex min-h-[450px] items-center justify-center">

                <div className="flex items-center gap-3 text-gray-500">

                    <RefreshCw
                        size={22}
                        className="animate-spin"
                    />

                    Ekip bilgileri yükleniyor...

                </div>

            </div>

        );

    }



    return (

        <div className="space-y-8">


            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Ekip Yönetimi

                    </h1>

                    <p className="mt-2 text-gray-500">

                        Ekip oluşturabilir, lider atayabilir ve personellerin görevlerini yönetebilirsiniz.

                    </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                        type="button"
                        onClick={() =>
                            loadPage(true)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >

                        <RefreshCw size={18} />

                        Yenile

                    </button>


                    <button
                        type="button"
                        onClick={
                            showForm
                                ? closeForm
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
                            : "Yeni Ekip"
                        }

                    </button>

                </div>

            </div>



            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <p className="text-sm font-medium text-gray-500">
                        Toplam Ekip
                    </p>

                    <div className="mt-3 flex items-center justify-between">

                        <p className="text-3xl font-bold text-gray-800">
                            {teams.length}
                        </p>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Users size={24} />
                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <p className="text-sm font-medium text-gray-500">
                        Lider Atanmış Ekip
                    </p>

                    <div className="mt-3 flex items-center justify-between">

                        <p className="text-3xl font-bold text-yellow-600">

                            {
                                teams.filter(
                                    (team) =>
                                        team.leader_id
                                ).length
                            }

                        </p>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                            <Crown size={24} />
                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <p className="text-sm font-medium text-gray-500">
                        Toplam Ekip Üyesi
                    </p>

                    <div className="mt-3 flex items-center justify-between">

                        <p className="text-3xl font-bold text-green-600">

                            {
                                teams.reduce(
                                    (total, team) =>
                                        total +
                                        (
                                            team.member_count ||
                                            0
                                        ),
                                    0
                                )
                            }

                        </p>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                            <UserPlus size={24} />
                        </div>

                    </div>

                </div>

            </div>



            {showForm && (

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <h2 className="text-xl font-bold text-gray-800">

                        {editingTeamId
                            ? "Ekibi Düzenle"
                            : "Yeni Ekip Oluştur"
                        }

                    </h2>


                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-5"
                    >

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Ekip Adı
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Örn: Yazılım Ekibi"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>


                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    İş Yeri
                                </label>

                                <select
                                    value={workplaceId}
                                    onChange={(event) =>
                                        setWorkplaceId(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">
                                        İş yeri seçilmedi
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


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Ekip Lideri
                            </label>

                            <select
                                value={leaderId}
                                onChange={(event) =>
                                    setLeaderId(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    Lider atanmadı
                                </option>

                                {employees.map(
                                    (employee) => (

                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >

                                            {employee.name}{" "}
                                            {employee.surname}

                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Açıklama
                            </label>

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                rows={4}
                                maxLength={500}
                                placeholder="Ekibin sorumluluklarını açıklayın..."
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div className="flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Vazgeç
                            </button>


                            <button
                                type="submit"
                                disabled={formLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
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

                                Kaydet

                            </button>

                        </div>

                    </form>

                </div>

            )}



            <div className="space-y-5">

                {teams.map(
                    (team) => {

                        const detail =
                            teamDetails[team.id];

                        const isExpanded =
                            expandedTeamId === team.id;

                        const availableEmployees =
                            getFilteredAvailableEmployees(
                                team.id,
                                detail
                            );

                        return (

                            <div
                                key={team.id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                            >

                                <div className="p-6">

                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                        <div>

                                            <h2 className="text-xl font-bold text-gray-800">
                                                {team.name}
                                            </h2>

                                            <p className="mt-2 text-sm text-gray-500">

                                                {team.description ||
                                                    "Ekip açıklaması bulunmuyor."
                                                }

                                            </p>

                                        </div>


                                        <div className="flex flex-wrap gap-2">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleTeamDetail(
                                                        team.id
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                            >

                                                {isExpanded
                                                    ? <ChevronUp size={17} />
                                                    : <ChevronDown size={17} />
                                                }

                                                Detay

                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(team)
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700 hover:bg-yellow-200"
                                            >

                                                <Pencil size={17} />

                                                Düzenle

                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteTeam(team)
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                                            >

                                                <Trash2 size={17} />

                                                Sil

                                            </button>

                                        </div>

                                    </div>


                                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                                        <div className="rounded-xl bg-gray-50 p-4">

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Crown size={17} />
                                                Ekip Lideri
                                            </div>

                                            <p className="mt-2 font-semibold text-gray-800">

                                                {team.leader_name ||
                                                    "Atanmadı"
                                                }

                                            </p>

                                            {team.leader_id && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveLeader(
                                                            team.id
                                                        )
                                                    }
                                                    className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    Lideri kaldır
                                                </button>

                                            )}

                                        </div>


                                        <div className="rounded-xl bg-gray-50 p-4">

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Building2 size={17} />
                                                İş Yeri
                                            </div>

                                            <p className="mt-2 font-semibold text-gray-800">

                                                {team.workplace_name ||
                                                    "Atanmadı"
                                                }

                                            </p>

                                        </div>


                                        <div className="rounded-xl bg-gray-50 p-4">

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Users size={17} />
                                                Personel Sayısı
                                            </div>

                                            <p className="mt-2 font-semibold text-gray-800">
                                                {team.member_count || 0}
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {isExpanded && (

                                    <div className="border-t border-gray-100 bg-gray-50 p-6">

                                        {detailLoadingId === team.id ? (

                                            <div className="flex justify-center gap-3 py-10 text-gray-500">

                                                <RefreshCw
                                                    size={20}
                                                    className="animate-spin"
                                                />

                                                Ekip detayları yükleniyor...

                                            </div>

                                        ) : (

                                            <div className="space-y-6">


                                                <form
                                                    onSubmit={(event) =>
                                                        handleAddMembers(
                                                            event,
                                                            team.id
                                                        )
                                                    }
                                                    className="rounded-2xl border border-gray-200 bg-white p-5"
                                                >

                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                                        <div>

                                                            <h3 className="font-bold text-gray-800">
                                                                Ekibe Personel Ekle
                                                            </h3>

                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Birden fazla personel seçebilirsiniz.
                                                            </p>

                                                        </div>

                                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                                            {selectedMemberIds.length} seçili
                                                        </span>

                                                    </div>


                                                    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

                                                        <div className="rounded-xl border border-gray-200">

                                                            <div className="border-b border-gray-100 p-4">

                                                                <div className="relative">

                                                                    <Search
                                                                        size={18}
                                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                                    />

                                                                    <input
                                                                        type="text"
                                                                        value={memberSearchText}
                                                                        onChange={(event) =>
                                                                            setMemberSearchText(
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Personel ara..."
                                                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                                                    />

                                                                </div>

                                                            </div>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleSelectAll(
                                                                        availableEmployees
                                                                    )
                                                                }
                                                                className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50"
                                                            >
                                                                Tümünü seç / kaldır
                                                            </button>


                                                            <div className="max-h-80 overflow-y-auto">

                                                                {availableEmployees.length === 0 ? (

                                                                    <div className="p-6 text-center text-sm text-gray-500">
                                                                        Eklenebilecek personel bulunamadı.
                                                                    </div>

                                                                ) : (

                                                                    availableEmployees.map(
                                                                        (employee) => {

                                                                            const selected =
                                                                                selectedMemberIds.includes(
                                                                                    employee.id
                                                                                );

                                                                            return (

                                                                                <button
                                                                                    key={employee.id}
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        toggleMemberSelection(
                                                                                            employee.id
                                                                                        )
                                                                                    }
                                                                                    className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition ${selected
                                                                                        ? "bg-blue-50"
                                                                                        : "hover:bg-gray-50"
                                                                                        }`}
                                                                                >

                                                                                    <span
                                                                                        className={`flex h-5 w-5 items-center justify-center rounded border ${selected
                                                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                                                            : "border-gray-300 bg-white"
                                                                                            }`}
                                                                                    >
                                                                                        {selected && (
                                                                                            <Check size={14} />
                                                                                        )}
                                                                                    </span>

                                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 font-bold text-white">

                                                                                        {employee.name
                                                                                            ?.charAt(0)
                                                                                            ?.toUpperCase()
                                                                                        }

                                                                                    </div>

                                                                                    <div className="min-w-0">

                                                                                        <p className="truncate font-semibold text-gray-800">

                                                                                            {employee.name}{" "}
                                                                                            {employee.surname}

                                                                                        </p>

                                                                                        <p className="truncate text-xs text-gray-500">
                                                                                            {employee.email}
                                                                                        </p>

                                                                                    </div>

                                                                                </button>

                                                                            );

                                                                        }
                                                                    )

                                                                )}

                                                            </div>

                                                        </div>


                                                        <div className="rounded-xl border border-gray-200">

                                                            <div className="border-b border-gray-100 p-4">

                                                                <h4 className="font-semibold text-gray-800">
                                                                    Seçilen Personeller
                                                                </h4>

                                                            </div>


                                                            <div className="max-h-80 overflow-y-auto">

                                                                {selectedEmployees.length === 0 ? (

                                                                    <div className="p-8 text-center text-sm text-gray-500">
                                                                        Henüz personel seçilmedi.
                                                                    </div>

                                                                ) : (

                                                                    selectedEmployees.map(
                                                                        (employee) => (

                                                                            <div
                                                                                key={employee.id}
                                                                                className="flex items-center justify-between border-b border-gray-100 px-4 py-3"
                                                                            >

                                                                                <div>

                                                                                    <p className="font-semibold text-gray-800">

                                                                                        {employee.name}{" "}
                                                                                        {employee.surname}

                                                                                    </p>

                                                                                    <p className="flex items-center gap-1 text-xs text-gray-500">

                                                                                        <Mail size={12} />

                                                                                        {employee.email}

                                                                                    </p>

                                                                                </div>


                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        toggleMemberSelection(
                                                                                            employee.id
                                                                                        )
                                                                                    }
                                                                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                                                                >
                                                                                    <X size={17} />
                                                                                </button>

                                                                            </div>

                                                                        )
                                                                    )

                                                                )}

                                                            </div>

                                                        </div>

                                                    </div>


                                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                                                        <div>

                                                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                                Ortak Görev / Unvan
                                                            </label>

                                                            <div className="relative">

                                                                <Briefcase
                                                                    size={18}
                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                                />

                                                                <input
                                                                    type="text"
                                                                    value={jobTitle}
                                                                    onChange={(event) =>
                                                                        setJobTitle(
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    placeholder="Örn: Frontend Developer"
                                                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                                                                />

                                                            </div>

                                                        </div>


                                                        <div>

                                                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                                Ortak Görev Açıklaması
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={jobDescription}
                                                                onChange={(event) =>
                                                                    setJobDescription(
                                                                        event.target.value
                                                                    )
                                                                }
                                                                placeholder="Personellerin sorumluluğu"
                                                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                                                            />

                                                        </div>

                                                    </div>


                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            memberLoadingId ===
                                                            team.id ||
                                                            selectedMemberIds.length === 0
                                                        }
                                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                    >

                                                        {memberLoadingId === team.id
                                                            ? (
                                                                <RefreshCw
                                                                    size={19}
                                                                    className="animate-spin"
                                                                />
                                                            )
                                                            : (
                                                                <UserPlus size={19} />
                                                            )
                                                        }

                                                        {selectedMemberIds.length > 0
                                                            ? `${selectedMemberIds.length} Kişiyi Ekibe Ekle`
                                                            : "Personel Seçin"
                                                        }

                                                    </button>

                                                </form>



                                                {editingMember?.teamId === team.id && (

                                                    <form
                                                        onSubmit={handleUpdateMember}
                                                        className="rounded-2xl border border-blue-200 bg-blue-50 p-5"
                                                    >

                                                        <div className="flex items-center justify-between">

                                                            <div>

                                                                <h3 className="font-bold text-gray-800">

                                                                    Personel Görevini Düzenle

                                                                </h3>

                                                                <p className="mt-1 text-sm text-gray-600">

                                                                    {editingMember.name}{" "}
                                                                    {editingMember.surname}

                                                                </p>

                                                            </div>


                                                            <button
                                                                type="button"
                                                                onClick={resetMemberEditForm}
                                                                className="rounded-lg p-2 text-gray-500 hover:bg-white"
                                                            >
                                                                <X size={19} />
                                                            </button>

                                                        </div>


                                                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                                                            <div>

                                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                                    Görev / Unvan
                                                                </label>

                                                                <input
                                                                    type="text"
                                                                    value={editJobTitle}
                                                                    onChange={(event) =>
                                                                        setEditJobTitle(
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    placeholder="Örn: Backend Developer"
                                                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                                                                />

                                                            </div>


                                                            <div>

                                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                                    Görev Açıklaması
                                                                </label>

                                                                <input
                                                                    type="text"
                                                                    value={editJobDescription}
                                                                    onChange={(event) =>
                                                                        setEditJobDescription(
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    placeholder="Personelin sorumlulukları"
                                                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                                                                />

                                                            </div>

                                                        </div>


                                                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                                            <button
                                                                type="button"
                                                                onClick={resetMemberEditForm}
                                                                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Vazgeç
                                                            </button>


                                                            <button
                                                                type="submit"
                                                                disabled={memberEditLoading}
                                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                                                            >

                                                                {memberEditLoading
                                                                    ? (
                                                                        <RefreshCw
                                                                            size={18}
                                                                            className="animate-spin"
                                                                        />
                                                                    )
                                                                    : (
                                                                        <Save size={18} />
                                                                    )
                                                                }

                                                                Görevi Güncelle

                                                            </button>

                                                        </div>

                                                    </form>

                                                )}



                                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

                                                    <div className="border-b border-gray-100 p-5">

                                                        <h3 className="font-bold text-gray-800">
                                                            Ekip Üyeleri
                                                        </h3>

                                                    </div>


                                                    {!detail?.members ||
                                                        detail.members.length === 0 ? (

                                                        <div className="p-10 text-center text-gray-500">
                                                            Bu ekipte henüz personel bulunmuyor.
                                                        </div>

                                                    ) : (

                                                        <div className="overflow-x-auto">

                                                            <table className="min-w-full">

                                                                <thead className="bg-gray-50">

                                                                    <tr>

                                                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                                            Personel
                                                                        </th>

                                                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                                            Görev
                                                                        </th>

                                                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                                            Açıklama
                                                                        </th>

                                                                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                                                                            İşlemler
                                                                        </th>

                                                                    </tr>

                                                                </thead>


                                                                <tbody className="divide-y divide-gray-100">

                                                                    {detail.members.map(
                                                                        (member) => {

                                                                            const isLeader =
                                                                                Number(team.leader_id) ===
                                                                                Number(member.id);

                                                                            return (

                                                                                <tr key={member.id}>

                                                                                    <td className="px-5 py-4">

                                                                                        <div className="flex items-center gap-3">

                                                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 font-bold text-white">

                                                                                                {member.name
                                                                                                    ?.charAt(0)
                                                                                                    ?.toUpperCase()
                                                                                                }

                                                                                            </div>

                                                                                            <div>

                                                                                                <div className="flex flex-wrap items-center gap-2">

                                                                                                    <p className="font-semibold text-gray-800">

                                                                                                        {member.name}{" "}
                                                                                                        {member.surname}

                                                                                                    </p>

                                                                                                    {isLeader && (

                                                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">

                                                                                                            <Crown size={12} />

                                                                                                            Ekip Lideri

                                                                                                        </span>

                                                                                                    )}

                                                                                                </div>

                                                                                                <p className="text-sm text-gray-500">
                                                                                                    {member.email}
                                                                                                </p>

                                                                                            </div>

                                                                                        </div>

                                                                                    </td>


                                                                                    <td className="px-5 py-4 text-sm text-gray-700">

                                                                                        {member.job_title ||
                                                                                            "-"
                                                                                        }

                                                                                    </td>


                                                                                    <td className="max-w-sm px-5 py-4 text-sm text-gray-600">

                                                                                        {member.job_description ||
                                                                                            "-"
                                                                                        }

                                                                                    </td>


                                                                                    <td className="px-5 py-4">

                                                                                        <div className="flex flex-wrap justify-end gap-2">

                                                                                            {!isLeader && (

                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        handleAssignLeader(
                                                                                                            team.id,
                                                                                                            member
                                                                                                        )
                                                                                                    }
                                                                                                    disabled={
                                                                                                        leaderLoadingId ===
                                                                                                        member.id
                                                                                                    }
                                                                                                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-2 text-sm font-semibold text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                                                                                                >

                                                                                                    {leaderLoadingId === member.id
                                                                                                        ? (
                                                                                                            <RefreshCw
                                                                                                                size={16}
                                                                                                                className="animate-spin"
                                                                                                            />
                                                                                                        )
                                                                                                        : (
                                                                                                            <Crown size={16} />
                                                                                                        )
                                                                                                    }

                                                                                                    Lider Yap

                                                                                                </button>

                                                                                            )}


                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    openMemberEdit(
                                                                                                        team.id,
                                                                                                        member
                                                                                                    )
                                                                                                }
                                                                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                                                                                            >

                                                                                                <Pencil size={16} />

                                                                                                Düzenle

                                                                                            </button>


                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleRemoveMember(
                                                                                                        team.id,
                                                                                                        member
                                                                                                    )
                                                                                                }
                                                                                                disabled={
                                                                                                    memberLoadingId ===
                                                                                                    team.id
                                                                                                }
                                                                                                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                                                            >

                                                                                                <Trash2 size={16} />

                                                                                                Çıkar

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

                                        )}

                                    </div>

                                )}

                            </div>

                        );

                    }
                )}

            </div>



            {teams.length === 0 && (

                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                    <Users
                        size={42}
                        className="mx-auto text-gray-300"
                    />

                    <h3 className="mt-4 font-semibold text-gray-700">
                        Henüz ekip oluşturulmadı
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Yeni Ekip butonuyla ilk ekibi oluşturabilirsiniz.
                    </p>

                </div>

            )}

        </div>

    );

}


export default Teams;