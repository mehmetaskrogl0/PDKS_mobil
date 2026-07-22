import {
    NavLink,
    useNavigate
} from "react-router-dom";

import {
    LayoutDashboard,
    Clock,
    CalendarDays,
    UserCircle,
    ShieldCheck,
    Users,
    Building2,
    CalendarCheck,
    Network,
    FileBarChart,
    ClipboardList,
    CalendarRange,
    LogOut,
    X,
    Workflow
} from "lucide-react";


function getUserFromStorage() {

    try {

        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Kullanıcı bilgisi okunamadı:",
            error
        );

        return null;

    }

}


function Sidebar({
    isOpen = false,
    onClose = () => { }
}) {

    const navigate = useNavigate();

    const user =
        getUserFromStorage();


    const role = String(
        localStorage.getItem("role") ||
        user?.role ||
        "employee"
    )
        .trim()
        .toLowerCase();


    const isAdmin =
        role === "admin";


    const fullName =

        user?.full_name ||

        `${user?.name || ""} ${user?.surname || ""}`
            .trim() ||

        "Kullanıcı";


    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate(
            "/login",
            {
                replace: true
            }
        );

    };


    const handleMenuClick = () => {

        if (window.innerWidth < 1024) {

            onClose();

        }

    };


    const menuItemClass = ({ isActive }) => {

        return `
        flex items-center gap-3
        rounded-xl
        px-4 py-3
        text-sm font-semibold
        transition-all duration-200
        ${isActive
                ? `
                    bg-white
                    text-blue-700
                    shadow-md
                    shadow-black/10
                `
                : `
                    text-blue-100
                    hover:bg-white/10
                    hover:text-white
                `
            }
    `;
    };


    return (

        <>

            {isOpen && (

                <button
                    type="button"
                    aria-label="Menüyü kapat"
                    onClick={onClose}
                    className="
                        fixed inset-0
                        z-40
                        bg-black/40
                        backdrop-blur-sm
                        lg:hidden
                    "
                />

            )}


            <aside
                className={`
                    fixed
                    left-0
                    top-0
                    z-50
                    flex
                    h-screen
                    w-72
                    flex-col
                    border-r
border-blue-800
bg-gradient-to-b
from-blue-700
to-blue-900
                    shadow-xl
                    transition-transform
                    duration-300

                    lg:sticky
                    lg:top-0
                    lg:z-20
                    lg:h-[calc(100vh-72px)]
                    lg:w-72
                    lg:shrink-0
                    lg:translate-x-0
                    lg:shadow-none

                    ${isOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }
                `}
            >

                {/* Logo */}

                <div
                    className="
                        flex h-[72px]
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        px-6
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex h-11 w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-600
                                text-white
                                shadow-lg
                                shadow-blue-600/20
                            "
                        >

                            <Clock size={24} />

                        </div>


                        <div>

                            <h1
                                className="
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                PDKS
                            </h1>

                            <p
                                className="
                                    text-xs
                                    font-medium
                                    text-slate-400
                                "
                            >
                                Personel Takip Sistemi
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            flex h-9 w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            hover:text-slate-800
                            lg:hidden
                        "
                    >

                        <X size={21} />

                    </button>

                </div>


                {/* Kullanıcı bilgisi */}

                <div
                    className="
                        mx-4 mt-5
                        rounded-2xl
                        border
                        border-blue-100
                        bg-blue-50
                        p-4
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex h-11 w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-blue-600
                                text-white
                            "
                        >

                            {
                                isAdmin
                                    ? (
                                        <ShieldCheck
                                            size={25}
                                        />
                                    )
                                    : (
                                        <UserCircle
                                            size={25}
                                        />
                                    )
                            }

                        </div>


                        <div className="min-w-0">

                            <p
                                className="
                                    truncate
                                    text-sm
                                    font-bold
                                    text-slate-800
                                "
                            >
                                {fullName}
                            </p>

                            <p
                                className="
                                    mt-0.5
                                    truncate
                                    text-xs
                                    font-medium
                                    text-blue-600
                                "
                            >

                                {
                                    isAdmin
                                        ? "Yönetici"
                                        : "Personel"
                                }

                            </p>

                        </div>

                    </div>

                </div>


                {/* Menü */}

                <nav
                    className="
                        flex-1
                        overflow-y-auto
                        px-4 py-5
                    "
                >

                    <p
                        className="
                            mb-2
                            px-4
                            text-xs
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-400
                        "
                    >
                        Genel
                    </p>


                    <div className="space-y-1">

                        <NavLink
                            to="/dashboard"
                            onClick={handleMenuClick}
                            className={menuItemClass}
                        >

                            <LayoutDashboard size={20} />

                            Kontrol Paneli

                        </NavLink>


                        <NavLink
                            to="/attendance"
                            onClick={handleMenuClick}
                            className={menuItemClass}
                        >

                            <Clock size={20} />

                            Mesai İşlemleri

                        </NavLink>


                        <NavLink
                            to="/my-shifts"
                            onClick={handleMenuClick}
                            className={menuItemClass}
                        >

                            <CalendarRange size={20} />

                            Vardiyalarım

                        </NavLink>


                        <NavLink
                            to="/leave"
                            onClick={handleMenuClick}
                            className={menuItemClass}
                        >

                            <CalendarDays size={20} />

                            İzin İşlemleri

                        </NavLink>


                        <NavLink
                            to="/profile"
                            onClick={handleMenuClick}
                            className={menuItemClass}
                        >

                            <UserCircle size={20} />

                            Profilim

                        </NavLink>

                    </div>


                    {isAdmin && (

                        <div className="mt-7">

                            <p
                                className="
                                    mb-2
                                    px-4
                                    text-xs
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-400
                                "
                            >
                                Yönetim
                            </p>


                            <div className="space-y-1">

                                <NavLink
                                    to="/admin/dashboard"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <ShieldCheck size={20} />

                                    Admin Paneli

                                </NavLink>


                                <NavLink
                                    to="/admin/users"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <Users size={20} />

                                    Personel Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/organization"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <Workflow size={20} />

                                    Organizasyon Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/workplaces"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <Building2 size={20} />

                                    İş Yeri Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/teams"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <Network size={20} />

                                    Ekip Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/shifts"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <CalendarCheck size={20} />

                                    Vardiya Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/shift-assignments"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <ClipboardList size={20} />

                                    Vardiya Atamaları

                                </NavLink>


                                <NavLink
                                    to="/admin/leave-management"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <CalendarDays size={20} />

                                    İzin Yönetimi

                                </NavLink>


                                <NavLink
                                    to="/admin/reports"
                                    onClick={handleMenuClick}
                                    className={menuItemClass}
                                >

                                    <FileBarChart size={20} />

                                    Raporlar

                                </NavLink>

                            </div>

                        </div>

                    )}

                </nav>


                {/* Çıkış */}

                <div
                    className="
                        shrink-0
                        border-t
                        border-slate-100
                        p-4
                    "
                >

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="
                            flex w-full
                            items-center
                            gap-3
                            rounded-xl
                            px-4 py-3
                            text-sm
                            font-semibold
                            text-red-600
                            transition
                            hover:bg-red-50
                            hover:text-red-700
                        "
                    >

                        <LogOut size={20} />

                        Çıkış Yap

                    </button>

                </div>

            </aside>

        </>

    );

}


export default Sidebar;