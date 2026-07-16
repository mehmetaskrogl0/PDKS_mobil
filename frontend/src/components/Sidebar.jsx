import { useEffect, useState } from "react";

import {
    LayoutDashboard,
    Clock,
    CalendarDays,
    UserCircle,
    ShieldCheck,
    Users,
    Building2,
    CalendarCheck,
    Network
} from "lucide-react";

import { NavLink } from "react-router-dom";

import api from "../api/axios";


function Sidebar() {

    const [role, setRole] = useState(null);


    useEffect(() => {

        const getUserRole = async () => {

            try {

                const response = await api.get(
                    "/dashboard"
                );

                setRole(
                    String(
                        response.data?.role || ""
                    ).toLowerCase()
                );

            } catch (error) {

                console.log(
                    "Kullanıcı rolü alınamadı:",
                    error
                );

            }

        };


        getUserRole();

    }, []);



    const menuItemClass = ({ isActive }) => {

        return `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`;

    };



    return (

        <aside className="min-h-screen w-64 bg-gray-900 p-5 text-white">


            <h3 className="mb-8 text-xl font-bold">

                Menü

            </h3>


            <ul className="space-y-2">


                <li>

                    <NavLink
                        to="/dashboard"
                        className={menuItemClass}
                    >

                        <LayoutDashboard size={20} />

                        Dashboard

                    </NavLink>

                </li>



                <li>

                    <NavLink
                        to="/attendance"
                        className={menuItemClass}
                    >

                        <Clock size={20} />

                        Mesai Takibi

                    </NavLink>

                </li>



                <li>

                    <NavLink
                        to="/leaves"
                        className={menuItemClass}
                    >

                        <CalendarDays size={20} />

                        İzinler

                    </NavLink>

                </li>



                <li>

                    <NavLink
                        to="/profile"
                        className={menuItemClass}
                    >

                        <UserCircle size={20} />

                        Profil

                    </NavLink>

                </li>



                {role === "admin" && (

                    <>


                        <li className="pt-4">

                            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">

                                Yönetim

                            </p>

                        </li>



                        <li>

                            <NavLink
                                to="/admin"
                                end
                                className={menuItemClass}
                            >

                                <ShieldCheck size={20} />

                                Admin Paneli

                            </NavLink>

                        </li>



                        <li>

                            <NavLink
                                to="/admin/employees"
                                className={menuItemClass}
                            >

                                <Users size={20} />

                                Personel Yönetimi

                            </NavLink>

                        </li>



                        <li>

                            <NavLink
                                to="/admin/teams"
                                className={menuItemClass}
                            >

                                <Network size={20} />

                                Ekip Yönetimi

                            </NavLink>

                        </li>



                        <li>

                            <NavLink
                                to="/admin/workplaces"
                                className={menuItemClass}
                            >

                                <Building2 size={20} />

                                İş Yeri Yönetimi

                            </NavLink>

                        </li>



                        <li>

                            <NavLink
                                to="/admin/leaves"
                                className={menuItemClass}
                            >

                                <CalendarCheck size={20} />

                                İzin Onayları

                            </NavLink>

                        </li>


                    </>

                )}


            </ul>


        </aside>

    );

}


export default Sidebar;