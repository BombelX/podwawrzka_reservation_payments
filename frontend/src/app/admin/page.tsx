"use client";

import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import lottieAnimation from "../components/animation";
import { useEffect, useState } from 'react';
import settings from "../settings/settings.json";
import Reservations from '../components/reservations';


export default function Page() {
  
    const [basePrice, setBasePrice] = useState<number>(settings.basePrice);
    const [weekendPrice, setWeekendPrice] = useState<number>(settings.weekendPriceIncrease);
    const [holiPrice, setHoliPrice] = useState<number>(settings.holidayPriceIncrease);
    const [extraPersonPrice, setExtraPersonPrice] = useState<number>(settings.extraPersonPrice);
    const [specialDay, setSpecialDay] = useState({date: "", price: 0});
    const [minimumNights, setMinimumNights] = useState<number>(settings.minimumNights);
    const [settingsVersion, setSettingsVersion] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/settings", {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            }
        })
        const json = await res.json();
        console.log(json);
        settings.basePrice = json.basePrice;
        settings.weekendPriceIncrease = json.weekendPriceIncrease;
        settings.holidayPriceIncrease = json.holidayPriceIncrease;
        settings.extraPersonPrice = json.extraPersonPrice;

        setBasePrice(json.basePrice);
        setWeekendPrice(json.weekendPriceIncrease);
        setHoliPrice(json.holidayPriceIncrease);
        setExtraPersonPrice(json.extraPersonPrice);
        setMinimumNights(json.minimumDuration)

        settings.specialDays = json.specialDays;

        setSettingsVersion((v) => v + 1); 
        };
        fetchSettings();
    }, []);
    return (
    <div className='bg-[#FAF9F6] p-4'>
        <SignedOut>
            <div className='flex flex-col items-center justify-center'>
                
            <div className='btn m-2'>
                <SignInButton>Zaloguj się</SignInButton>
            </div>
            <div>
                <h1>Zaloguj się aby skonfigurować ustawienia rezerwacji</h1>
            </div>
            <div className='scale-110 mt-5'>
                {lottieAnimation("welcome")}
            </div>
            </div>
        </SignedOut>
        <SignedIn>
            <div className='flex justify-between items-center mb-4'>
                <div></div>
                <h1 className=' text-[#2F3B40] font-bold text-xl mt-4 mb-8 uppercase tracking-wider'>Witaj w panelu administracyjnym</h1>
                <UserButton />
            </div>
            
            <div className='flex items-center justify-center flex-col gap-1'>

                <div className="bg-white p-8  pr-10 pl-10 rounded-2xl border border-[#E0D7C6]/30 shadow-sm mb-6">

                <fieldset className='flex flex-col justify-start items-start mb-6'>
                    <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider">Podaj podstawową cenę rezerwacji:</legend>
                    <input
                    type="number"
                    className="input focus:outline-2 bg-white focus:ring-2 border-[#C98B4B] focus:ring-[#C98B4B]/60 focus:border-0 shadow-xl  validator"
                    required
                    placeholder="Pomiedzy 100 a 1500 zł"
                    min="100"
                    max="1500"
                    title="Must be between be 100 to 1500"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    />
                    <p className="validator-hint">Pomiedzy 100 a 1500 zł</p>
                </fieldset>
                <fieldset className='flex flex-col justify-start items-start mb-6'>
                <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider ">Podaj dodatek do ceny za rezerwacje w weekend:</legend>
                <input
                type="number"
                className="input focus:outline-2 bg-white focus:ring-2 border-[#C98B4B] focus:ring-[#C98B4B]/60 focus:border-0 shadow-xl  validator"
                required
                placeholder="Pomiedzy 10 a 200 zł"
                min="10"
                max="200"
                title="Must be between be 10 to 200"
                value={weekendPrice}
                onChange={(e) => setWeekendPrice(Number(e.target.value))}
                />
                <p className="validator-hint">Pomiedzy 10 a 200 zł</p>
                </fieldset>

                <fieldset className='flex flex-col justify-start items-start mb-2'>
                <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider">Podaj dodatek do ceny za rezerwacje w dni świąteczne:</legend>
                <input
                type="number"
                className="input focus:outline-2 bg-white focus:ring-2 border-[#C98B4B] focus:ring-[#C98B4B]/60 focus:border-0 shadow-xl  validator"
                required
                placeholder="Pomiedzy 10 a 200 zł"
                min="10"
                max="200"
                title="Must be between be 10 to 200"
                value={holiPrice}
                onChange={(e) => setHoliPrice(Number(e.target.value))}
                />
                <p className="validator-hint">Pomiedzy 10 a 200 zł</p>
                </fieldset>
                </div>
                <div className="bg-white p-10 rounded-2xl border border-[#E0D7C6]/30 shadow-sm mb-6 w-full max-w-xl mx-auto">
                <fieldset className="w-full">
                    <div className="flex flex-col w-full space-y-8">
                    
                    <div className="w-full">
                        <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider">
                        Dodatkowa opłata za gościa
                        </legend>
                        <input
                        type="range"
                        min="10"
                        max="30"
                        step="5"
                        value={extraPersonPrice}
                        onChange={(e) => setExtraPersonPrice(Number(e.target.value))}
                        className="range range-sm [--range-shdw:#C98B4B] bg-[#F2EFE9] w-full"
                        style={{
                            color:"#C98B4B"
                        }}
                        />
                        <div className="flex justify-between px-2 mt-2 text-[#E0D7C6]">
                        {[...Array(5)].map((_, i) => <span key={i}>|</span>)}
                        </div>
                        <div className="flex justify-between px-1 text-[11px] font-bold text-[#8C7E6A]">
                        <span>10zł</span>
                        <span>15zł</span>
                        <span>20zł</span>
                        <span>25zł</span>
                        <span>30zł</span>
                        </div>
                    </div>

                    <div className="w-full">
                        <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider">
                        Minimalna długość rezerwacji
                        </legend>
                        <div className="flex flex-row w-full bg-[#F2EFE9] p-1.5 gap-1 border border-[#E0D7C6]/50 shadow-inner rounded-2xl">
                        <button 
                            onClick={() => setMinimumNights(1)} 
                            className={`py-4 flex-1 transition-all duration-300 rounded-xl font-bold ${minimumNights == 1 ? "bg-[#C98B4B] text-white shadow-md" : "text-[#8C7E6A] hover:bg-[#EBDCC5]/50"}`}
                        >
                            1 noc
                        </button>
                        <button 
                            onClick={() => setMinimumNights(2)} 
                            className={`py-4 flex-1 transition-all duration-300 rounded-xl font-bold ${minimumNights == 2 ? "bg-[#C98B4B] text-white shadow-md" : "text-[#8C7E6A] hover:bg-[#EBDCC5]/50"}`}
                        >
                            2 noce
                        </button>
                        <button 
                            onClick={() => setMinimumNights(3)} 
                            className={`py-4 flex-1 transition-all duration-300 rounded-xl font-bold ${minimumNights == 3 ? "bg-[#C98B4B] text-white shadow-md" : "text-[#8C7E6A] hover:bg-[#EBDCC5]/50"}`}
                        >
                            3 noce
                        </button>
                        </div>
                    </div>

                    </div>
                </fieldset>
                </div>

                <div>
                    <button className='mt-3 p-5 text-lg  rounded-xl mb-3 btn bg-[#1C1917]/85 text-white hover:bg-[#379237] transition-all hover:scale-102 duration-500  border-gray-100 border' onClick={async () => {
                        // console.log(basePrice, weekendPrice, holiPrice, extraPersonPrice);
                        const resp = await fetch(process.env.NEXT_PUBLIC_API_URL + "/settings/",{
                            method : "PUT",
                            headers: {
                                "Content-Type" : "application/json"
                            },
                            body : JSON.stringify({
                                basePrice: basePrice,
                                weekendIncrease: weekendPrice,
                                holidayIncrease: holiPrice,
                                pricePerPerson: extraPersonPrice,
                                minimumDuration : minimumNights
                            })}
                        );
                            if(resp.ok) {
                                alert("Ustawienia zostały zapisane");
                            } else {
                                alert("Wystąpił błąd podczas zapisywania ustawień");
                            }
                        }}
                    >Zapisz</button>
                </div>
                <div className=" flex flex-col justify-center items-center bg-white p-10 rounded-2xl border border-[#E0D7C6]/30 shadow-sm mb-6 mt-8 shadow-xl w-full max-w-xl mx-auto">
                <div>
                    <div className="w-full max-w-xs flex-col flex gap-2">
                    <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-1.5 uppercase tracking-wider">Dodaj dzień ze specjalną ceną</legend>
                    <input type="date" className="input bg-white shadow-xl border border-black" value={specialDay.date} onChange={(e) => setSpecialDay({...specialDay, date: e.target.value})} />
                    <input type="number" className='input bg-white shadow-xl border border-black' placeholder='Podaj cenę' value={specialDay.price} onChange={(e) => setSpecialDay({...specialDay, price: Number(e.target.value)})}/>
                    <button className='btn text-white bg-[#C98B4B]/90 rounded hover:scale-102 duration-1000 transition-all border-orange-100 btn-soft' onClick={async () => {
                        try{
                            
                            const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/settings/special", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    date: specialDay.date,
                                    price: specialDay.price,
                                }),
                            });
                            const json = await res.json();
                            if (json.success) {
                                setSettingsVersion((v) => v + 1); 
                            }
                        } catch (error) {
                            alert("Wystąpił błąd podczas dodawania dnia specjalnego");
                            return;
                        }
                    }}> Dodaj specjalny dzień</button>
                    </div>
                </div>

                <div className='mt-4 flex flex-col justify-center items-center'>
                    <legend className="fieldset-legend text-[#2F3B40] font-bold text-sm mb-4 uppercase tracking-wider">Dodane dni specjalne :</legend>
                    <div className='flex gap-4 justify-center items-center flex-wrap max-w-lg'>
                    {settings.specialDays.map((day) => {
                        return(
                            <div key={day.date} className='badge bg-[#F2EFE9] border border-gray-300/30 text-[#2F3B40] shaadow-xl flex flex-row pr-0.5 p-4 justify-center items-center text-md'>
                                <p className="mr-1 text-md text-[#2F3B40]">{day.date}</p>
                                <p className="mr-1 text-md text-[#2F3B40]">{day.price}zł</p>
                                <button onClick={async () => {
                                    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/settings/special", {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            date: day.date,
                                        }),
                                    });
                                    const json = await res.json();
                                    setSettingsVersion((v) => v + 1); 
                                }} className='bg-gray-500 rounded-full text-white pr-1.5 pl-1.5'>X</button>
                            </div>
                        );
                    })}
                    </div>

                    </div>
                </div>
                    <Reservations>
                        
                    </Reservations>

            </div>
        </SignedIn>
    </div>
  );
}