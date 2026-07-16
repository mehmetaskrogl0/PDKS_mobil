import Navbar from "./Navbar";
import Sidebar from "./Sidebar";


function Layout({ children }) {


    return (

        <div>

            <Navbar />


            <div className="flex">

                <Sidebar />


                <main className="flex-1 bg-gray-100 min-h-screen p-6">

                    {children}

                </main>


            </div>


        </div>

    );

}


export default Layout;