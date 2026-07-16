import { LogOut, User } from "lucide-react";


function Navbar() {

    return (

        <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow">


            <h2 className="text-xl font-bold">
                PDKS Yönetim Sistemi
            </h2>


            <div className="flex items-center gap-4">

                <div className="flex items-center gap-2">
                    <User size={20} />
                    <span>
                        Emin
                    </span>
                </div>


                <button className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded">

                    <LogOut size={18} />

                    Çıkış

                </button>


            </div>


        </nav>

    );

}


export default Navbar;