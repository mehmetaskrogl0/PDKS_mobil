import {
    LogOut,
    User,
    ShieldCheck
} from "lucide-react";

import { useNavigate } from "react-router-dom";


function getStoredUser() {

    try {

        const storedUser = localStorage.getItem("user");

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


function Navbar() {

    const navigate = useNavigate();

    const user = getStoredUser();

    const role = String(
        localStorage.getItem("role") ||
        user?.role ||
        "employee"
    ).trim().toLowerCase();

    const isAdmin = role === "admin";

    const userName =
        user?.full_name ||
        `${user?.name || ""} ${user?.surname || ""}`.trim() ||
        user?.email ||
        "Kullanıcı";


    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/login", {
            replace: true
        });

    };


    return (

        <nav
            className="
                flex
                h-[72px]
                items-center
                justify-between
                border-b
                border-blue-800
                bg-gradient-to-r
                from-blue-700
                to-blue-900
                px-6
                shadow-lg
            "
        >

            <div>

                <h2
                    className="
                        text-xl
                        font-bold
                        text-white
                    "
                >
                    PDKS Yönetim Sistemi
                </h2>

                <p
                    className="
                        mt-1
                        text-xs
                        text-blue-200
                    "
                >
                    {isAdmin ? "Yönetici Paneli" : "Personel Paneli"}
                </p>

            </div>


            <div className="flex items-center gap-4">

                <div
                    className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-white/20
                        bg-white/10
                        px-4
                        py-2
                    "
                >

                    <div
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-blue-700
                        "
                    >

                        {isAdmin ? (
                            <ShieldCheck size={20} />
                        ) : (
                            <User size={20} />
                        )}

                    </div>

                    <div>

                        <p
                            className="
                                max-w-40
                                truncate
                                text-sm
                                font-semibold
                                text-white
                            "
                        >
                            {userName}
                        </p>

                        <p
                            className="
                                text-xs
                                text-blue-200
                            "
                        >
                            {isAdmin ? "Yönetici" : "Personel"}
                        </p>

                    </div>

                </div>


                <button
                    type="button"
                    onClick={logout}
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-white/20
                        bg-white/10
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-white
                        transition-all
                        duration-200
                        hover:bg-white
                        hover:text-blue-700
                    "
                >

                    <LogOut size={18} />

                    Çıkış

                </button>

            </div>

        </nav>

    );

}


export default Navbar;