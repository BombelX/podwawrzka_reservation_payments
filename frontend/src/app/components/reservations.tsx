import {useEffect, useState} from "react";

export default function Reservations() {

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    interface Reservation {
        start: string;
        end: string;
        price: number;
        nights: number;
        how_many_people:number;
    }

    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        const fetchReservations = async () =>{
            console.log("Fetching reservations for month:", selectedMonth, "year:", selectedYear);
            try {
                const result = await fetch("https://rezerwacje.podwawrzka.pl/api/reservations/admin",{
                    method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    month: selectedMonth - 1,
                    year: selectedYear
                })
                });
                const data = await result.json();
                setReservations(data);
            }
            catch (err){
                console.error("Błąd" , err);
            }
        }
        fetchReservations();
    },[selectedMonth, selectedYear]);

    return (
            <div className="bg-white p-10 rounded-2xl border border-[#E0D7C6]/30 shadow-xl mb-6 w-full max-w-xl mx-auto">
                <div className="flex justify-around items-center bg-[#F2EFE9] rounded-lg mb-4 pt-2 pb-2">
                    <button className="btn text-white bg-[#C98B4B]/90 rounded-xl hover:scale-102 duration-1000 transition-all border-orange-100 btn-soft" onClick={() => {
                        if(selectedMonth == 1){
                            setSelectedMonth(12)
                            setSelectedYear(prev => prev-1)
                        }
                        else{
                            setSelectedMonth(prev => prev-1)
                        }
                    }}>Przed</button>
                    <div className="badge badge-primary bg-amber-400 text-white border-[#C98B4B]/60">{selectedMonth}/{selectedYear}</div>
                    <button className="btn text-white bg-[#C98B4B]/90 rounded-xl hover:scale-102 duration-1000 transition-all border-orange-100 btn-soft" onClick={() => {
                        if (selectedMonth === 12) {
                            setSelectedMonth(1);
                            setSelectedYear(prev => prev + 1);
                        } else {
                            setSelectedMonth(prev => prev + 1);
                        }
                    }}>Następny</button>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-4 mt-2">{reservations.map(reservation => {
                    return (
                        <div className="flex flex-row">
                            <div className="flex flex-col rounded-l-xl w-full  border-1 border-gray-200 text-gray-800 ">
                                <div className="p-2 flex flex-wrap flex-row gap-2">
                                    <p className="badge bg-[#F2EFE9] text-gray-600 border-[#F2EFE9]/60"> od: {new Date(reservation.start).getDate() + "-" + (new Date(reservation.start).getMonth() + 1) + "-" + new Date(reservation.start).getFullYear()}</p>
                                    <p className="badge bg-[#F2EFE9] text-gray-600 border-[#F2EFE9]/60"> do: {new Date(reservation.end).getDate() + "-" + (new Date(reservation.end).getMonth() + 1) + "-" + new Date(reservation.end).getFullYear()}</p>
                                </div>
                                <div className="p-2 flex flex-wrap flex-row gap-2">
                                    <p className=" badge bg-[#F2EFE9] text-gray-600 border-[#F2EFE9]/60">{reservation.price/100}zł</p>
                                    <p className=" badge bg-[#F2EFE9] text-gray-600 border-[#F2EFE9]/60">{reservation.how_many_people} osoby</p>
                                </div>
                            </div>
                            <div className="bg-[#bda87e] text-white rounded-r-xl p-4 flex items-center justify-center">
                                <p>{reservation.nights}</p>
                            </div>
                        </div>
                    );
                })
                    
                    
                    }</div>
            </div>
    );
}