"use client";
import { useEffect, useRef, useState } from "react";
import CalendarComponent, { type CalendarHandle } from "./components/calendar";
import { v4 as uuidv4 } from "uuid";

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
  
  type FixedHoliday = {
    month: number;
    day: number;
  };
  
  type SpecialDay = {
    date: string;
    price: number;
  };
  const [settings,setSettings] = useState({
    basePrice: 0,
    weekendPriceIncrease: 0,
    holidayPriceIncrease: 0,
    extraPersonPrice: 0,
    minimumDuration: 1,
    specialDays: [] as SpecialDay[],
    fixedHolidays: [] as string[],
    BannedDates: [] as never[],
  });
  const [RuleAcceptation, setRuleAcceptation] = useState(false);
  const [CalendarSelectedDate, setCalendarSelectedDate] =
    useState<CalendarDate | null>(null);
  const [guestNumber, setGuestNumber] = useState<number>(2);
  const [price, setPrice] = useState<number>(0);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
  const [isMinimumDurationMet, setIsMinimumDurationMet] = useState<boolean>(false);
  const [isCorrectEmail, setIsCorrectEmail] = useState<boolean>(false);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] =
    useState<string>("hidden");
  const [contactData, setContactData] = useState({
    name: "",
    surname: "test",
    email: "test@test.com",
    phone: "123456789",
    arrivalTime: "Niewiem",
  });
  const [secoundEmail, setSecoundEmail] = useState<string>("");
  const now = new Date();
  const typedSettings = settings as {
    basePrice: number;
    weekendPriceIncrease: number;
    holidayPriceIncrease: number;
    extraPersonPrice: number;
    specialDays: SpecialDay[];
    fixedHolidays: string[];
    BannedDates: never[];
    minimumDuration: number;
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";

  // console.log("API URL:", API_URL);
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`GET /settings failed: ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;

        const fixedHolidays = Array.isArray(json.fixedHolidays) ? json.fixedHolidays : [];
        const specialDays = Array.isArray(json.specialDays) ? json.specialDays : [];

        setSettings({
          basePrice: json.basePrice ?? 0,
          weekendPriceIncrease: json.weekendPriceIncrease ?? 0,
          holidayPriceIncrease: json.holidayPriceIncrease ?? 0,
          extraPersonPrice: json.extraPersonPrice ?? 0,
          specialDays,
          fixedHolidays,
          BannedDates: Array.isArray(json.BannedDates) ? json.BannedDates : [],
          minimumDuration: json.minimumDuration ?? 1,
        });

        setSettingsVersion((v) => v + 1);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  useEffect(() => {
    if (CalendarSelectedDate !== null) {

      const start = new Date(CalendarSelectedDate.start.year, CalendarSelectedDate.start.month, CalendarSelectedDate.start.day);
      const end = new Date(CalendarSelectedDate.end.year, CalendarSelectedDate.end.month, CalendarSelectedDate.end.day);
      let price = 0;
      for (let day = start; day < end; day.setDate(day.getDate() + 1)) {
        const month = String(day.getMonth() + 1).padStart(2, "0");
        const dayOfMonth = String(day.getDate()).padStart(2, "0");
        const dateKey = `${day.getFullYear()}-${month}-${dayOfMonth}`;

        if (typedSettings.specialDays.some(d => d.date === dateKey)) {
          const specialDay = typedSettings.specialDays.find(d => d.date === dateKey);
          if (specialDay) {
            price += specialDay.price;
            continue;
          }
        }

        if (day.getDay() === 0 || day.getDay() === 6) {
          price += typedSettings.weekendPriceIncrease + typedSettings.basePrice;
        } else {
          price += typedSettings.basePrice;
          const holidayKey = `${day.getMonth() + 1}-${day.getDate()}`;
          if (typedSettings.fixedHolidays.some(d => d === holidayKey)) {
            price += typedSettings.holidayPriceIncrease;
          }
        }
      }

      setPrice(
        guestNumber * typedSettings.extraPersonPrice * CalendarSelectedDate.nights +
          price,
      );
    }
  }, [guestNumber, CalendarSelectedDate, settingsVersion]);

  return (
    <div className="flex p-5 bg-[#FAF9F6] flex-col">
      <div className="font-sans bg-[#FAF9F6] flex flex-col  w-full h-full gap-3  items-center justify-items-center min-h-screen">
        <div className="flex flex-col sm:flex-row">
          <div className="m-2 p-4 flex flex-col justify-right gap-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-[#FAF9F6]">Dane kontaktowe</legend>
              <label>Imię i nazwisko</label>
              <input
                value={contactData.name}
                onChange={(e) =>
                  setContactData({ ...contactData, name: e.target.value })
                }
                className="border-1 input bg-white text-black border-black rounded"
                type="text"
                placeholder="Jan Kowalski"
                required
              />
              <label>Adres e-mail:</label>
              <label className="input validator bg-white text-black border border-[#3E3A37] rounded-md px-3 py-2 flex items-center gap-2">
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
                  onChange={(e) =>{
                    setContactData({ ...contactData, email: e.target.value })
                    if (e.target.value === secoundEmail) {
                      setIsCorrectEmail(true);
                    } else {
                      setIsCorrectEmail(false);
                    }
                    if (e.target.value === "") {
                      setIsCorrectEmail(false);
                    }
                  }

                  }
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
              <label className="input validator bg-white text-black border border-[#3E3A37] rounded-md px-3 py-2 flex items-center gap-2">
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
                  onChange={(e) => {setSecoundEmail(e.target.value)
                    if(e.target.value === contactData.email) {
                      setIsCorrectEmail(true);
                    } else {
                      setIsCorrectEmail(false);
                    }
                    if (e.target.value === "") {
                      setIsCorrectEmail(false);
                    }
                  }}
                  type="email"
                  className="flex-1 bg-transparent outline-none rounded-md"
                  placeholder="email@gmail.com"
                  required
                />
              </label>
              <label>Numer telefonu:</label>
                <label className="input validator bg-white text-black border border-[#3E3A37] rounded-md">
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
                  onChange={(e) =>{
                    setContactData({ ...contactData, phone: e.target.value })
                    setIsPhoneValid(e.target.value.match(/^\+48\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/) !== null);
                  }
                  }
                  type="tel"
                  className="tabular-nums"
                  required
                  placeholder="+48 123 456 789"
                  pattern="^\+48\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$"
                  minLength={12}
                  maxLength={15}
                  title="Format: +48 123 456 789"
                />
                </label>
              <p className="validator-hint">Musi miec 9 cyfr</p>
              <label>Czas przyjazdu:</label>
              <select onChange={(e) => setContactData({...contactData, arrivalTime: e.target.value})} className="select bg-white text-black border-1 border-[#3E3A37] rounded p-2 ">
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="Niewiem"
                >
                  Niewiem
                </option>
                {/* <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="00:00 - 1:00"
                >
                  00:00 - 1:00
                </option> */}
                {/* <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="1:00 - 2:00"
                >
                  1:00 - 2:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="2:00 - 3:00"
                >
                  2:00 - 3:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="3:00 - 4:00"
                >
                  3:00 - 4:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="4:00 - 5:00"
                >
                  4:00 - 5:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="5:00 - 6:00"
                >
                  5:00 - 6:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="6:00 - 7:00"
                >
                  6:00 - 7:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="7:00 - 8:00"
                >
                  7:00 - 8:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="8:00 - 9:00"
                >
                  8:00 - 9:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="9:00 - 10:00"
                >
                  9:00 - 10:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="10:00 - 11:00"
                >
                  10:00 - 11:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="11:00 - 12:00"
                >
                  11:00 - 12:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="12:00 - 13:00"
                >
                  12:00 - 13:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="13:00 - 14:00"
                >
                  13:00 - 14:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="14:00 - 15:00"
                >
                  14:00 - 15:00
                </option> */}
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="15:00 - 16:00"
                >
                  15:00 - 16:00
                </option>
    
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="16:00 - 17:00"
                >
                  16:00 - 17:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="17:00 - 18:00"
                >
                  17:00 - 18:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="18:00 - 19:00"
                >
                  18:00 - 19:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="19:00 - 20:00"
                >
                  19:00 - 20:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="20:00 - 21:00"
                >
                  20:00 - 21:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="21:00 - 22:00"
                >
                  21:00 - 22:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="22:00 - 23:00"
                >
                  22:00 - 23:00
                </option>
                <option
                  className="hover:bg-[#3E3A37] hover:text-white"
                  value="23:00 - 00:00"
                >
                  23:00 - 00:00
                </option>
              </select>
              <label>Ile osób:</label>
              <select
                className="select bg-white text-black border-1 border-[#3E3A37] rounded p-2"
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
              {settingsVersion > 0 ? (
                <CalendarComponent
                  ref={calendarRef}
                  settings={typedSettings}
                  yearNumber={now.getFullYear()}
                  monthNumber={now.getMonth()}
                  calendarSetter={setCalendarSelectedDate}
                  people={guestNumber}
                />
              ) : (
                <div className="p-4">Ładowanie...</div>
              )}
            </div>
            <div className="flex flex-col gap-1 p-2">
              <h1 className="badge bg-[#654831] text-white border-[#654831]/30">
                {CalendarSelectedDate &&
                  `Wybrane daty: ${CalendarSelectedDate.start.day}.${CalendarSelectedDate.start.month+1}.${CalendarSelectedDate.start.year} - ${CalendarSelectedDate.end.day}.${CalendarSelectedDate.end.month+1}.${CalendarSelectedDate.end.year}`}
              </h1>
              <h1 className="badge bg-[#654831] text-white border-[#654831]/30">
                {CalendarSelectedDate &&
                  `Liczba nocy: ${CalendarSelectedDate.nights}`} 
              </h1>  
              {CalendarSelectedDate && CalendarSelectedDate.nights < typedSettings.minimumDuration && (
                <div  className="badge badge-warning text-[#654831] bg-white/90 border-1 border-[#C98B4B]/30 ">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Minimalna długość pobytu to {typedSettings.minimumDuration} {typedSettings.minimumDuration === 1 ? "noc" : "noce"}</span>
                </div>
              )}
              <h1 className="badge bg-[#654831] text-white border-[#654831]/30">
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
                  API_URL + "/payments/make",
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
                      arrivalTime: contactData.arrivalTime,
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
                className="checkbox border-[#C98B4B]/10 bg-[#654831]/60 checked:bg-[#379237]  checked:border-[#379237]"
              ></input>
              <p>
                Akceptuje{" "}
                <a className="text-[#C98B4B]/60 hover:underline font-medium" href="/rules">
                  Regulamin
                </a>
              </p>
            </div>
          </label>
          

          
          <button
            disabled={!RuleAcceptation || !CalendarSelectedDate || !isPhoneValid || !isCorrectEmail || (CalendarSelectedDate && CalendarSelectedDate.nights < typedSettings.minimumDuration) || price <= 0 || contactData.name.trim() === ""}
            onClick={async () => {
              if (!CalendarSelectedDate) {
                alert("Proszę wybrać daty pobytu");
                return;
              }
              
              try {
                const paymentLink = await fetch(
                  API_URL + "/payments/begin",
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
                      start: `${CalendarSelectedDate.start.year}-${String(CalendarSelectedDate.start.month + 1).padStart(2, '0')}-${String(CalendarSelectedDate.start.day).padStart(2, '0')}`,
                      end: `${CalendarSelectedDate.end.year}-${String(CalendarSelectedDate.end.month + 1).padStart(2, '0')}-${String(CalendarSelectedDate.end.day).padStart(2, '0')}`,
                      arrivalTime: contactData.arrivalTime,
                      guestNumber: guestNumber,
                    }),
                  },
                );
                
                if (!paymentLink.ok) {
                  throw new Error(`HTTP error! status: ${paymentLink.status}`);
                }
                
                const paymentLinkData = await paymentLink.json();
                if (paymentLinkData.url) {
                  window.location.href = paymentLinkData.url;
                } else {
                  alert("Błąd: brak linku do płatności");
                }
              } catch (error) {
                console.error("Payment error:", error);
                alert("Błąd podczas inicjowania płatności");
              }
            }}
            className="btn w-full border-none rounded-md py-3 font-bold uppercase tracking-wider transition-all duration-300 shadow-md 
           bg-[#2F3B40] text-white 
           hover:bg-[#379237] hover:scale-[1.02] 
           disabled:bg-[#EFEBE0] disabled:text-[#BFAF9F] disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
            >Zarezerwuj i przejdź do płatności
          </button>
          {
            !isCorrectEmail && (
              <div role="alert" className="alert alert-warning text-[#654831] bg-white/90 border-1 border-[#C98B4B]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Adresy email nie są takie same</span>
              </div>
            )
          }
          {
            !isPhoneValid && (
              <div role="alert" className="alert alert-warning text-[#654831] bg-white/90 border-1 border-[#C98B4B]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Niepoprawny numer telefonu</span>
              </div>
            )
          }
          
          
          {/* <button
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
          <button
            onClick={async () => {
              console.log(contactData);
              // return;

              const response = await fetch(
                "http://46.224.13.142:3100/notify/sendsms",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    phoneNumber: contactData.phone,
                    message: `Dziękujemy za rezerwację w dniach od ${CalendarSelectedDate?.start.day}.${CalendarSelectedDate?.start.month}.${CalendarSelectedDate?.start.year} do ${CalendarSelectedDate?.end.day}.${CalendarSelectedDate?.end.month}.${CalendarSelectedDate?.end.year}. Czekamy na Was!`,
                  }),
                },
              );
            }}
            className="btn btn-secoundary"
          >
            {" "}
            Wyslij SMSa
          </button> */}
          <div
            role="alert"
            className={`alert alert-success ${isPurchaseConfirmed} bg-white/90 text-[#654831] border-1 border-[#C98B4B]/30`}
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


