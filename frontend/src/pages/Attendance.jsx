import { useEffect, useState } from "react";
import api from "../api/axios";
import { Clock } from "lucide-react";


function Attendance() {

    const [records, setRecords] = useState([]);


    useEffect(() => {


        const getAttendance = async () => {


            try {

                const response = await api.get("/attendance/my-attendance");

                console.log(response.data);

                setRecords(response.data);


            } catch (error) {

                console.log(error);

            }


        };


        getAttendance();


    }, []);



    return (

        <div>


            <h1 className="text-3xl font-bold mb-6">
                Mesai Takibi
            </h1>



            <div className="bg-white rounded-xl shadow p-6">


                {
                    records.length === 0 ? (

                        <p>
                            Henüz kayıt bulunamadı.
                        </p>


                    ) : (


                        <table className="w-full">


                            <thead>

                                <tr className="border-b">

                                    <th className="p-3 text-left">
                                        Tarih
                                    </th>

                                    <th className="p-3 text-left">
                                        Giriş
                                    </th>

                                    <th className="p-3 text-left">
                                        Çıkış
                                    </th>

                                    <th className="p-3 text-left">
                                        Durum
                                    </th>


                                </tr>

                            </thead>



                            <tbody>


                                {
                                    records.map((item) => (


                                        <tr
                                            key={item.id}
                                            className="border-b"
                                        >

                                            <td className="p-3">
                                                {item.date}
                                            </td>


                                            <td className="p-3">
                                                {item.check_in_time}
                                            </td>


                                            <td className="p-3">
                                                {item.check_out_time || "-"}
                                            </td>


                                            <td className="p-3 flex items-center gap-2">

                                                <Clock size={18} />

                                                {
                                                    item.late
                                                        ? "Geç"
                                                        : "Normal"
                                                }

                                            </td>


                                        </tr>


                                    ))
                                }


                            </tbody>



                        </table>


                    )

                }


            </div>


        </div>

    );

}


export default Attendance;