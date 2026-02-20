import React from "react";


export default function Rules() {
  return (
    <div className="flex flex-col items-center justify-center w-full pt-2">
        <h1 className="text-2xl font-bold mb-4">Zasady rezerwacji</h1>
        <p className="text-center max-w-2xl">
            1. Rezerwacje są przyjmowane na minimum 24 godziny przed planowanym terminem wizyty.
            <br />
            2. W przypadku rezygnacji z rezerwacji, prosimy o kontakt z nami co najmniej 24 godziny przed planowanym terminem wizyty.
            <br />
            3. W przypadku braku kontaktu lub niepojawienia się na umówioną wizytę, rezerwacja zostanie anulowana, a opłata za wizytę nie zostanie zwrócona.
            <br />
            4. W przypadku zmiany terminu wizyty, prosimy o kontakt z nami co najmniej 24 godziny przed planowanym terminem wizyty.
            <br />
            5. W przypadku spóźnienia się na umówioną wizytę, prosimy o kontakt z nami, abyśmy mogli dostosować czas wizyty.
            <br />  
            6. W przypadku jakichkolwiek pytań dotyczących rezerwacji, prosimy o kontakt z nami.
        </p>
    </div>
  );
}