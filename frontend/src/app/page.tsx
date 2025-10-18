import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans bg-gray-100 grid  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      
      <label className="text-black" htmlFor="name">Imię i nazwisko</label>
      <input id="name" type="text" />
      <label className="text-black" htmlFor="email">Email</label>
      <input id="email" type="text" />
      <label className="text-black" htmlFor="phone">Numer telefonu</label>
      <input id="phone" type="text" />
      <label className="text-black" htmlFor="date">Data rezerwacji</label>
      <input id="date" type="date" />
      <div className="flex items-center justify-center">
        <button className="btn">Zarezerwuj</button>
      </div>
    </div>
  );
}
