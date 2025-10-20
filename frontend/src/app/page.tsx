'use client';

import Image from "next/image";
import React from "react";
import CalendarComponent from "./components/calendar";

export default function Home() {


  return (
    <div className="font-sans bg-gray-100 grid  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      
      <label className="text-black" htmlFor="name">Imię i nazwisko</label>
      <input className="text-black border-2 border-gray-400 rounded-lg px-4 py-2" id="name" type="text" />
      <label className="text-black" htmlFor="email">Email</label>
      <input className="text-black border-2 border-gray-400 rounded-lg px-4 py-2" id="email" type="text" />
      <label className="text-black" htmlFor="phone">Numer telefonu</label>
      <input className="text-black border-2 border-gray-400 rounded-lg px-4 py-2" id="phone" type="text" />

    <div>
      <CalendarComponent/>
    </div>

      <div className="flex items-center justify-center">
        <button 
          className="btn btn-outline bg-white hover:bg-amber-800 transition-all duration-500 text-black"
        >
          Zarezerwuj
        </button>
      </div>
    </div>
  );
}
