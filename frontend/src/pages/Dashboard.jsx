import { useEffect, useState } from "react";
import api from "../api/axios";
import {
    User,
    Clock,
    CalendarCheck
} from "lucide-react";


function Dashboard() {

    const [data, setData] = useState(null);


    useEffect(() => {

        const getDashboard = async () => {

            try {

                const response = await api.get("/dashboard");

                setData(response.data);

            } catch (error) {

                console.log(error);

            }

        };


        getDashboard();

    }, []);



    if (!data) {

        return (
            <h2>
                Yükleniyor...
            </h2>
        );

    }



    return (

        <div>


            <h1 className="text-3xl font-bold mb-6">
                PDKS Kontrol Paneli
            </h1>



            <div className="grid grid-cols-3 gap-6">



                <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">

                    <User
                        size={40}
                        className="text-blue-600"
                    />


                    <div>

                        <p className="text-gray-500">
                            Personel
                        </p>

                        <h2 className="text-xl font-bold">
                            {data.user}
                        </h2>

                    </div>


                </div>





                <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">

                    <Clock
                        size={40}
                        className="text-green-600"
                    />


                    <div>

                        <p className="text-gray-500">
                            Durum
                        </p>

                        <h2 className="text-xl font-bold">
                            {data.status}
                        </h2>

                    </div>


                </div>





                <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">


                    <CalendarCheck
                        size={40}
                        className="text-purple-600"
                    />


                    <div>

                        <p className="text-gray-500">
                            Onaylı İzin
                        </p>


                        <h2 className="text-xl font-bold">
                            {data.approved_leave_count}
                        </h2>


                    </div>


                </div>




            </div>


        </div>

    );

}


export default Dashboard;