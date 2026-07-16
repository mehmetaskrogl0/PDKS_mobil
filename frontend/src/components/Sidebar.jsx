import {
    LayoutDashboard,
    Clock,
    CalendarDays,
    UserCircle
} from "lucide-react";

import { Link } from "react-router-dom";


function Sidebar() {

    return (

        <aside className="w-64 bg-gray-900 text-white min-h-screen p-5">


            <h3 className="text-xl font-bold mb-8">
                Menü
            </h3>


            <ul className="space-y-5">


                <li>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 hover:text-blue-400"
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                </li>



                <li>
                    <Link
                        to="/attendance"
                        className="flex items-center gap-3 hover:text-blue-400"
                    >
                        <Clock size={20} />
                        Mesai Takibi
                    </Link>
                </li>



                <li>
                    <Link
                        to="/leaves"
                        className="flex items-center gap-3 hover:text-blue-400"
                    >
                        <CalendarDays size={20} />
                        İzinler
                    </Link>
                </li>



                <li>
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 hover:text-blue-400"
                    >
                        <UserCircle size={20} />
                        Profil
                    </Link>
                </li>


            </ul>


        </aside>

    );

}


export default Sidebar;