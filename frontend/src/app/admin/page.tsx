"use client";

import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import lottieAnimation from "../components/animation";
import { useEffect, useState } from 'react';
import settings from "../settings/settings.json";


export default function Page() {
  
    const [basePrice, setBasePrice] = useState<number>(settings.basePrice);
    const [weekendPrice, setWeekendPrice] = useState<number>(settings.weekendPriceIncrease);
    const [holiPrice, setHoliPrice] = useState<number>(settings.holidayPriceIncrease);
    const [extraPersonPrice, setExtraPersonPrice] = useState<number>(settings.extraPersonPrice);
    const [specialDay, setSpecialDay] = useState({date: "", price: 0});
    const [settingsVersion, setSettingsVersion] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
        const res = await fetch("http://46.224.13.142:3100/settings", {
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

        settings.specialDays = json.specialDays;

        setSettingsVersion((v) => v + 1); 
        };
        fetchSettings();
    }, []);
    return (
    <div className='bg-[#FAF6F0] p-4'>
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
                <h1 className=' text-4xl text-gray-900 font-bold mb-4'>Witaj w panelu administracyjnym</h1>
                <UserButton />
            </div>
            <div className='flex items-center justify-center flex-col gap-1'>
                <fieldset>
                <legend className="fieldset-legend text-gray-900 text-md">Podaj podstawową cenę rezerwacji:</legend>
                <input
                type="number"
                className="input input-primary bg-white border-0.5 border-black validator"
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
                <fieldset className='flex flex-col justify-center items-center'>
                <legend className="fieldset-legend text-gray-900 text-md">Podaj dodatek do ceny za rezerwacje w weekend:</legend>
                <input
                type="number"
                className="input input-primary bg-white border-0.5 border-black validator"
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

                <fieldset className='flex flex-col justify-center items-center'>
                <legend className="fieldset-legend text-gray-900 text-md">Podaj dodatek do ceny za rezerwacje w dni świąteczne:</legend>
                <input
                type="number"
                className="input input-primary bg-white border-0.5 border-black validator"
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

                <fieldset>
                    <div className="w-full max-w-xs">
                    <legend className="fieldset-legend text-gray-900 text-md">Dodatkowa opłata za gościa</legend>
                    <input
                        type="range"
                        min="10"
                        max="30"
                        value={extraPersonPrice}
                        className="range"
                        step="5"
                        onChange={(e) => {
                        setExtraPersonPrice(Number(e.target.value))
                    }} />
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                        <span>|</span>
                        <span>|</span>
                        <span>|</span>
                        <span>|</span>
                        <span>|</span>
                    </div>
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                        <span>10</span>
                        <span>15</span>
                        <span>20</span>
                        <span>25</span>
                        <span>30</span>
                    </div>
                    </div>
                </fieldset>
                <div>
                    <button className='mt-2  mb-1 btn bg-green-600 text-white hover:scale-102 duration-500 transition-all border-gray-100 border' onClick={async () => {
                        console.log(basePrice, weekendPrice, holiPrice, extraPersonPrice);
                        const resp = await fetch("http://46.224.13.142:3100/settings/",{
                            method : "PUT",
                            headers: {
                                "Content-Type" : "application/json"
                            },
                            body : JSON.stringify({
                                basePrice: basePrice,
                                weekendIncrease: weekendPrice,
                                holidayIncrease: holiPrice,
                                pricePerPerson: extraPersonPrice
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
                <div>
                    <div className="w-full max-w-xs flex-col flex gap-2">
                    <legend>Dodaj dzień ze specjalną ceną</legend>
                    <input type="date" className="input bg-white border-0.5 border-black" value={specialDay.date} onChange={(e) => setSpecialDay({...specialDay, date: e.target.value})} />
                    <input type="number" className='input bg-white border-0.5 border-black' placeholder='Podaj cenę' value={specialDay.price} onChange={(e) => setSpecialDay({...specialDay, price: Number(e.target.value)})}/>
                    <button className='btn text-white bg-[#806b08]/90 rounded hover:scale-102 duration-1000 transition-all border-orange-100 btn-soft' onClick={async () => {
                        try{

                            const res = await fetch("http://46.224.13.142:3100/settings/special", {
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

                <div>
                    <h2>Dodane dni specjalne</h2>
                    <div className='flex '>
                    {settings.specialDays.map((day) => {
                        return(
                            <div key={day.date} className='badge flex flex-row pr-0.5'>
                                <p>{day.date}</p>
                                <p>{day.price}zł</p>
                                <button onClick={async () => {
                                    const res = await fetch("http://46.224.13.142:3100/settings/special", {
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
                                }} className='bg-red-500 rounded-full pr-1.5 pl-1.5'>X</button>
                            </div>
                        );
                    })}
                    </div>

                </div>

            </div>
        </SignedIn>
    </div>
  );
}