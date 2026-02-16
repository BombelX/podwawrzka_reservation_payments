"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import React from "react";
import CalendarComponent, { type CalendarHandle } from "./components/calendar";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Router } from "next/router";

export default function Home() {
  const calendarRef = useRef<CalendarHandle | null>(null);

  type CalendarDate = {
    start: {
      year: number;
      month: number;
      day: number;
    };
    end: {
      year: number;
      month: number;
      day: number;
    };
    nights: number;
  };
  const [RuleAcceptation, setRuleAcceptation] = useState(false);
  const [CalendarSelectedDate, setCalendarSelectedDate] =
    useState<CalendarDate | null>(null);
  const [guestNumber, setGuestNumber] = useState<number>(2);
  const [price, setPrice] = useState<number>(0);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] =
    useState<string>("hidden");
  const [contactData, setContactData] = useState({
    name: "test",
    surname: "test",
    email: "test@test.com",
    phone: "123456789",
  });
  function callAlert() {
    calendarRef.current?.checkAvaibility();
  }

  useEffect(() => {
    if (CalendarSelectedDate !== null) {
      setPrice(
        guestNumber * 20 * CalendarSelectedDate.nights +
          CalendarSelectedDate.nights * 700,
      );
    }
  }, [guestNumber, CalendarSelectedDate]);

  return (
    <div className="flex p-5 flex-col">
      <div className="font-sans bg-gray-100 flex flex-col  w-full h-full gap-3  items-center justify-items-center min-h-screen">
        <div className="flex flex-col sm:flex-row">
          <div className="m-2 p-4 flex flex-col justify-right gap-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Dane kontaktowe</legend>
              <label>Imię i nazwisko</label>
              <input
                value={contactData.name}
                onChange={(e) =>
                  setContactData({ ...contactData, name: e.target.value })
                }
                className="border-1 input bg-white text-black border-black rounded"
                type="text"
              />
              <label>Adres e-mail:</label>
              <label className="input validator bg-white text-black border border-black rounded-md px-3 py-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </g>
                </svg>
                <input
                  type="email"
                  className="flex-1 bg-transparent outline-none rounded-md"
                  placeholder="email@gmail.com"
                  required
                />
              </label>
              <div className="validator-hint hidden">
                Wpisz poprawny adres e-mail
              </div>
              <label>Potwierdzenie adresu e-mail:</label>
              <label className="input validator bg-white text-black border border-black rounded-md px-3 py-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </g>
                </svg>
                <input
                  type="email"
                  className="flex-1 bg-transparent outline-none rounded-md"
                  placeholder="email@gmail.com"
                  required
                />
              </label>
              <label>Numer telefonu:</label>
              <label className="input validator bg-white text-black border border-black rounded-md">
                <svg
                  className="h-[1em] opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                >
                  <g fill="none">
                    <path
                      d="M7.25 11.5C6.83579 11.5 6.5 11.8358 6.5 12.25C6.5 12.6642 6.83579 13 7.25 13H8.75C9.16421 13 9.5 12.6642 9.5 12.25C9.5 11.8358 9.16421 11.5 8.75 11.5H7.25Z"
                      fill="currentColor"
                    ></path>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6 1C4.61929 1 3.5 2.11929 3.5 3.5V12.5C3.5 13.8807 4.61929 15 6 15H10C11.3807 15 12.5 13.8807 12.5 12.5V3.5C12.5 2.11929 11.3807 1 10 1H6ZM10 2.5H9.5V3C9.5 3.27614 9.27614 3.5 9 3.5H7C6.72386 3.5 6.5 3.27614 6.5 3V2.5H6C5.44771 2.5 5 2.94772 5 3.5V12.5C5 13.0523 5.44772 13.5 6 13.5H10C10.5523 13.5 11 13.0523 11 12.5V3.5C11 2.94772 10.5523 2.5 10 2.5Z"
                      fill="currentColor"
                    ></path>
                  </g>
                </svg>
                <input
                  type="tel"
                  className="tabular-nums"
                  required
                  placeholder="Nr. telefonu"
                  pattern="[0-9]*"
                  minLength={9}
                  maxLength={11}
                  title="Musi mieć 9 cyfr"
                />
              </label>
              <p className="validator-hint">Musi miec 9 cyfr</p>
              <label>Czas przyjazdu:</label>
              <select className="select bg-white text-black border-1 border-black rounded p-2 ">
                <option
                  className="hover:bg-black hover:text-white"
                  value="null"
                >
                  Niewiem
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="00:00 - 1:00"
                >
                  00:00 - 1:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="1:00 - 2:00"
                >
                  1:00 - 2:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="2:00 - 3:00"
                >
                  2:00 - 3:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="3:00 - 4:00"
                >
                  3:00 - 4:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="4:00 - 5:00"
                >
                  4:00 - 5:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="5:00 - 6:00"
                >
                  5:00 - 6:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="6:00 - 7:00"
                >
                  6:00 - 7:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="7:00 - 8:00"
                >
                  7:00 - 8:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="8:00 - 9:00"
                >
                  8:00 - 9:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="9:00 - 10:00"
                >
                  9:00 - 10:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="10:00 - 11:00"
                >
                  10:00 - 11:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="11:00 - 12:00"
                >
                  11:00 - 12:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="12:00 - 13:00"
                >
                  12:00 - 13:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="13:00 - 14:00"
                >
                  13:00 - 14:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="14:00 - 15:00"
                >
                  14:00 - 15:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="15:00 - 16:00"
                >
                  15:00 - 16:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="16:00 - 17:00"
                >
                  16:00 - 17:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="17:00 - 18:00"
                >
                  17:00 - 18:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="18:00 - 19:00"
                >
                  18:00 - 19:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="19:00 - 20:00"
                >
                  19:00 - 20:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="20:00 - 21:00"
                >
                  20:00 - 21:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="21:00 - 22:00"
                >
                  21:00 - 22:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="22:00 - 23:00"
                >
                  22:00 - 23:00
                </option>
                <option
                  className="hover:bg-black hover:text-white"
                  value="23:00 - 00:00"
                >
                  23:00 - 00:00
                </option>
              </select>
              <label>Ile osób:</label>
              <select
                className="select bg-white text-black border-1 border-black rounded p-2"
                onChange={(e) => setGuestNumber(parseInt(e.target.value))}
                defaultValue={"2"}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </fieldset>
          </div>

          <div>
            <div className="flex gap-2 mt-13">
              <CalendarComponent
                ref={calendarRef}
                yearNumber={2025}
                monthNumber={9}
                calendarSetter={setCalendarSelectedDate}
                people={guestNumber}
              />
            </div>
            <div className="flex flex-col gap-1 p-2">
              <h1 className="badge">
                {CalendarSelectedDate &&
                  `Wybrane daty: ${CalendarSelectedDate.start.day}.${CalendarSelectedDate.start.month}.${CalendarSelectedDate.start.year} - ${CalendarSelectedDate.end.day}.${CalendarSelectedDate.end.month}.${CalendarSelectedDate.end.year}`}
              </h1>
              <h1 className="badge">
                {CalendarSelectedDate &&
                  `Liczba nocy: ${CalendarSelectedDate.nights}`}
              </h1>
              <h1 className="badge">
                {CalendarSelectedDate && `Kwota do zapłaty: ${price} zł`}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center">
          <button
            onClick={async () => {
              if (!CalendarSelectedDate) {
                return;
              } else {
                const response = await fetch(
                  "http://46.224.13.142:3100/payments/make",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      start: CalendarSelectedDate.start,
                      end: CalendarSelectedDate.end,
                      guestName: contactData.name,
                      guestSurname: contactData.surname,
                      guestEmail: contactData.email,
                      arrivalTime: "",
                      nights: CalendarSelectedDate.nights,
                      price: price,
                      how_many_people: guestNumber,
                    }),
                  },
                );
              }
            }}
          ></button>
          <label htmlFor="">
            <div className="flex flex-row gap-2">
              <input
                onClick={() => {
                  setRuleAcceptation(!RuleAcceptation);
                }}
                type="checkbox"
                className="checkbox checkbox-primary"
              ></input>
              <p>
                Akceptuje{" "}
                <a className="text-blue-500" href="www.google.com">
                  Regulamin
                </a>
              </p>
            </div>
          </label>
          <button
            disabled={!RuleAcceptation}
            onClick={async () => {
              const paymentLink = await fetch(
                "http://46.224.13.142:3100/payments/begin",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sid: uuidv4(),
                    amount: price * 100,
                    email: contactData.email,
                    name: contactData.name,
                    surname: contactData.surname,
                    phone: contactData.phone,
                    start: CalendarSelectedDate
                      ? new Date(
                          CalendarSelectedDate.start.year,
                          CalendarSelectedDate.start.month,
                          CalendarSelectedDate.start.day,
                        )
                      : null,
                    end: CalendarSelectedDate
                      ? new Date(
                          CalendarSelectedDate.end.year,
                          CalendarSelectedDate.end.month,
                          CalendarSelectedDate.end.day,
                        )
                      : null,
                    arrivalTime: 0,
                  }),
                },
              );
              const paymentLinkData = await paymentLink.json();
              if (paymentLinkData.url) {
                window.location.href = paymentLinkData.url;
              }

              if (isPurchaseConfirmed == "") {
                setIsPurchaseConfirmed("hidden");
              } else {
                setIsPurchaseConfirmed("");
              }
            }}
            className="btn btn-outline disabled rounded-md bg-white hover:bg-green-600 hover:border-green-600 hover:scale-102 hover:text-white transition-all duration-500 text-black"
          >
            Zarezerwuj i przejdź do płatności
          </button>
          <button
            className="btn btn-primary btn-outline hover:scale-102 transition-all duration-500"
            onClick={async () => {
              console.log("Wysylanie maila z przypomnieniem...");
              await fetch("http://46.224.13.142:3100/emails/send", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  reciverEmail: "adam.rassem@op.pl",
                  reservationStart: CalendarSelectedDate
                    ? new Date(
                        CalendarSelectedDate.start.year,
                        CalendarSelectedDate.start.month,
                        CalendarSelectedDate.start.day,
                      )
                    : null,
                  reservationEnd: CalendarSelectedDate
                    ? new Date(
                        CalendarSelectedDate.end.year,
                        CalendarSelectedDate.end.month,
                        CalendarSelectedDate.end.day,
                      )
                    : null,
                  amount: price * 100,
                  orderID: Date.now(), // number as required by schema
                  information: 12, // number as required by schema
                }),
              });
            }}
          >
            Wyslij Maila z przypomnieniem
          </button>
          {/* <button onClick={callAlert} className="btn rounded-xl">
            Pobierz dane o rezerwacjach
          </button> */}
          <div
            role="alert"
            className={`alert alert-success ${isPurchaseConfirmed}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Your purchase has been confirmed!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
