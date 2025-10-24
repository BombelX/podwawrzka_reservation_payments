'use client';
import { useState } from "react";
import Image from "next/image";
import React from "react";
import CalendarComponent from "./components/calendar";

export default function Home() {

  type CalendarDate = {
    start: {
      year: number,
      month: number,
      day: number
    },
    end: {
      year: number,
      month: number,
      day: number
    },
    nights: number
  }
  const [CalendarSelectedDate,setCalendarSelectedDate] = useState<CalendarDate|null>(null);


  return (
    <div>
      
    <div className="font-sans bg-gray-100 flex flex-row w-full h-full gap-3 items-center justify-items-center min-h-screen">

    <div className="m-2 p-2 flex flex-col justify-right gap-2">
      <label>Imię i nazwisko</label>
      <input className="border-1" type="text" />
      <label>Adres e-mail</label>
      <input className="border-1" type="email" />
      <label>Numer telefonu</label>
      <input className="border-1" type="text" />
      <label>Czas przyjazdu</label>
      <select className="border-1">
        <option value="null">niewiem</option>
        <option value="00:00 - 1:00">00:00 - 1:00</option>
        <option value="1:00 - 2:00">1:00 - 2:00</option>
        <option value="2:00 - 3:00">2:00 - 3:00</option>
        <option value="3:00 - 4:00">3:00 - 4:00</option>
        <option value="4:00 - 5:00">4:00 - 5:00</option>
        <option value="5:00 - 6:00">5:00 - 6:00</option>
        <option value="6:00 - 7:00">6:00 - 7:00</option>
        <option value="7:00 - 8:00">7:00 - 8:00</option>
        <option value="8:00 - 9:00">8:00 - 9:00</option>
        <option value="9:00 - 10:00">9:00 - 10:00</option>
        <option value="10:00 - 11:00">10:00 - 11:00</option>
        <option value="11:00 - 12:00">11:00 - 12:00</option>
        <option value="12:00 - 13:00">12:00 - 13:00</option>
        <option value="13:00 - 14:00">13:00 - 14:00</option>
        <option value="14:00 - 15:00">14:00 - 15:00</option>
        <option value="15:00 - 16:00">15:00 - 16:00</option>
        <option value="16:00 - 17:00">16:00 - 17:00</option>
        <option value="17:00 - 18:00">17:00 - 18:00</option>
        <option value="18:00 - 19:00">18:00 - 19:00</option>
        <option value="19:00 - 20:00">19:00 - 20:00</option>
        <option value="20:00 - 21:00">20:00 - 21:00</option>
        <option value="21:00 - 22:00">21:00 - 22:00</option>
        <option value="22:00 - 23:00">22:00 - 23:00</option>
        <option value="23:00 - 00:00">23:00 - 00:00</option>
      </select>
      <label>Ile osób</label>
      <select defaultValue={"2"} className="border-1" id="">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
    </div>




    <div>
    <div className="flex gap-2">
      <CalendarComponent yearNumber={2025} monthNumber={9} calendarSetter={setCalendarSelectedDate} />  
    </div>
      <h1>{CalendarSelectedDate && `Wybrane daty: ${CalendarSelectedDate.start.day}.${CalendarSelectedDate.start.month}.${CalendarSelectedDate.start.year} - ${CalendarSelectedDate.end.day}.${CalendarSelectedDate.end.month}.${CalendarSelectedDate.end.year}`}</h1>
      <h1>{CalendarSelectedDate && `Liczba nocy: ${CalendarSelectedDate.nights}`}</h1>
    </div>
    </div>
      <div className="flex items-center justify-center">
        <button 
          className="btn btn-outline bg-white hover:bg-amber-800 transition-all duration-500 text-black">
          Zarezerwuj i przejdź do płatności
        </button>
      </div>
    </div>
  );
}
