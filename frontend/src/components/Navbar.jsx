import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";


function Navbar() {

    const navigate = useNavigate();

    const [userName, setUserName] = useState("Kullanıcı");


    useEffect(() => {

        const getUser = async () => {

            try {

                const response = await api.get("/dashboard/");

                setUserName(
                    response.data.user
                );

            } catch (error) {

                console.log(error);

            }

        };

        getUser();

    }, []);


    const logout = () => {

        localStorage.removeItem("token");

        navigate("/");

    };


    return (

        <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow">

            <h2 className="text-xl font-bold">
                PDKS Yönetim Sistemi
            </h2>


            <div className="flex items-center gap-4">

                <div className="flex items-center gap-2">

                    <User size={20} />

                    <span>
                        {userName}
                    </span>

                </div>


                <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded hover:bg-red-600 transition"
                >

                    <LogOut size={18} />

                    Çıkış

                </button>

            </div>

        </nav>

    );

}


export default Navbar;