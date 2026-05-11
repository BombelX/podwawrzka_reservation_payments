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
            <p>
              3. Operatorem obiektu i sprzedawcą usług jest{" "}
              <strong>KLIMKOWICZ SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ</strong>{" "}
              (KRS: 0001168918, NIP: 7382177562, REGON: 541508060), z siedzibą:
              Ropica Polska 632, 38-300 Gorlice, Polska.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§2. Rezerwacja i płatności</h2>
            <p>
              1. Rezerwacja staje się wiążąca po dokonaniu pełnej opłaty za pobyt
              za pośrednictwem systemu Przelewy24.
            </p>
            <p>
              2. Ceny podane w kalendarzu są cenami brutto za jedną dobę pobytu
              dla określonej liczby osób.
            </p>
          </section>

          <section className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h2 className="font-bold text-base mb-2 text-red-800">
              §3. Odwołanie rezerwacji i zwroty
            </h2>
            <p className="font-medium">
              1. Zgodnie z art. 38 pkt 12 ustawy o prawach konsumenta, Klientowi
              nie przysługuje prawo do odstąpienia od umowy rezerwacji w terminie
              14 dni, gdyż usługa dotyczy zakwaterowania w oznaczonym terminie.
            </p>
            <p className="mt-2 text-red-700">
              2. Wszystkie dokonane rezerwacje są <strong>bezzwrotne</strong>.
              W przypadku rezygnacji lub niepojawienia się w obiekcie, wpłacone
              środki nie podlegają zwrotowi.
            </p>
            <p className="mt-2">
              3. Zmiana terminu rezerwacji jest możliwa wyłącznie za zgodą
              Właściciela, zgłoszoną co najmniej 14 dni przed planowanym
              przyjazdem, w miarę dostępności terminów.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§4. Zasady pobytu</h2>
            <p>1. Doba hotelowa zaczyna się o godzinie 17:00, a kończy o godzinie 11:00 dnia następnego.</p>
            <p>2. W obiekcie obowiązuje całkowity zakaz palenia tytoniu oraz organizowania głośnych imprez.</p>
            <p>3. Gość ponosi pełną odpowiedzialność materialną za wszelkie uszkodzenia mienia powstałe z jego winy.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§5. Reklamacje</h2>
            <p>1. Klient ma prawo złożyć reklamację dotyczącą świadczonych usług.</p>
            <p>
              2. Reklamacje można składać drogą elektroniczną na adres e-mail:{" "}
              <strong>podwawrzka@gmail.com</strong> lub pisemnie na adres siedziby operatora.
            </p>
            <p>
              3. Reklamacja powinna zawierać imię i nazwisko Klienta, dane kontaktowe,
              numer rezerwacji oraz opis problemu będącego podstawą reklamacji.
            </p>
            <p>
              4. Reklamacje będą rozpatrywane w terminie do{" "}
              <strong>14 dni kalendarzowych</strong> od dnia ich otrzymania.
            </p>
            <p>
              5. O sposobie rozpatrzenia reklamacji Klient zostanie poinformowany
              drogą elektroniczną lub pisemnie.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2">§6. Dane osobowe</h2>
            <p>
              1. Dane osobowe są przetwarzane wyłącznie w celu realizacji rezerwacji
              zgodnie z obowiązującymi przepisami RODO.
            </p>
            <p>
              2. Szczegółowe informacje dotyczące przetwarzania danych osobowych
              znajdują się w polityce prywatności dostępnej na stronie internetowej.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E5E0D8] text-center italic text-xs text-gray-400">
          Pod Wawrzka - Rustykalna Stodoła w Beskidach
        </div>
      </div>
    </div>
  );
}
