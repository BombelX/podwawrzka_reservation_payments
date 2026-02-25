import React from "react";

export default function Rules() {
  return (
    <div className="flex flex-col items-center justify-center w-full pt-6 pb-12 px-4 bg-[#F8F6F2]">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-sm border border-[#E5E0D8]">
        <h1 className="text-3xl font-serif text-[#3E3A37] mb-8 text-center border-b border-[#E5E0D8] pb-4">
          Regulamin Rezerwacji "Pod Wawrzka"
        </h1>
        
        <div className="space-y-6 text-[#3E3A37] text-sm leading-relaxed text-justify">
          <section>
            <h2 className="font-bold text-base mb-2">§1. Postanowienia ogólne</h2>
            <p>1. Niniejszy regulamin określa zasady rezerwacji i korzystania z obiektu "Pod Wawrzka".</p>
            <p>2. Dokonanie rezerwacji jest równoznaczne z akceptacją postanowień niniejszego regulaminu.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§2. Rezerwacja i Płatności</h2>
            <p>1. Rezerwacja staje się wiążąca po dokonaniu pełnej opłaty za pobyt za pośrednictwem systemu Przelewy24.</p>
            <p>2. Ceny podane w kalendarzu są cenami brutto za jedną dobę pobytu dla określonej liczby osób.</p>
          </section>

          <section className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h2 className="font-bold text-base mb-2 text-red-800">§3. Odwołanie rezerwacji i Zwroty</h2>
            <p className="font-medium">1. Zgodnie z art. 38 pkt 12 ustawy o prawach konsumenta, Klientowi nie przysługuje prawo do odstąpienia od umowy rezerwacji w terminie 14 dni, gdyż usługa dotyczy zakwaterowania w oznaczonym terminie.</p>
            <p className="mt-2 text-red-700">2. Wszystkie dokonane rezerwacje są <strong>bezzwrotne</strong>. W przypadku rezygnacji lub niepojawienia się w obiekcie, wpłacone środki nie podlegają zwrotowi.</p>
            <p className="mt-2">3. Zmiana terminu rezerwacji jest możliwa wyłącznie za zgodą Właściciela, zgłoszoną co najmniej 14 dni przed planowanym przyjazdem, w miarę dostępności terminów.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§4. Zasady pobytu</h2>
            <p>1. Doba hotelowa zaczyna się o godzinie 17:00, a kończy o godzinie 11:00 dnia następnego.</p>
            <p>2. W obiekcie obowiązuje całkowity zakaz palenia tytoniu oraz organizowania głośnych imprez (wieczory kawalerskie, panieńskie itp.).</p>
            <p>3. Gość ponosi pełną odpowiedzialność materialną za wszelkie uszkodzenia mienia powstałe z jego winy.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§5. Reklamacje i RODO</h2>
            <p>1. Wszelkie reklamacje należy zgłaszać drogą elektroniczną na adres podany w potwierdzeniu rezerwacji.</p>
            <p>2. Dane osobowe są przetwarzane wyłącznie w celu realizacji rezerwacji zgodnie z polityką prywatności RODO.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E5E0D8] text-center italic text-xs text-gray-400">
          Pod Wawrzka - Rustykalna Stodoła w Beskidach
        </div>
      </div>
    </div>
  );
}