"use client";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";
import React from "react";

interface ICalendarInterface {
  showInfo: () => void;
}

class CalendarElement implements ICalendarInterface {
  childrens: CalendarElement[] = [];
  protected rerender?: () => void;
  setRerender(r: () => void) {
    this.rerender = r;
    this.childrens.forEach((c) => c.setRerender(r));
  }
  addChild(child: CalendarElement) {
    this.childrens.push(child);
    if (this.rerender) {
      child.setRerender(this.rerender);
    }
  }
  showInfo() {
    console.log("Generic calendar element");
  }
}

class Calendar extends CalendarElement implements ICalendarInterface {
  childrens: Year[] = [];
  constructor() {
    super();
  }
  getActiveYear(): Year {
    const res = this.childrens.find((y) => y.isActive) ?? this.childrens[0];
    if (res) {
      return res;
    } else {
      const year = new Year(new Date().getFullYear(), this);
      year.isActive = true;
      return year;
    }
  }
  getActiveMonth(): Month {
    const activeYear = this.getActiveYear();
    if (activeYear) {
      let month =
        activeYear.childrens.find((m) => m.isActive) ?? activeYear.childrens[0];
      if (!month) {
        const now = new Date();
        month = new Month(activeYear, now.getMonth());
        month.isActive = true;
      }
      return month;
    }

    const year = new Year(new Date().getFullYear(), this);
    const month = new Month(year, new Date().getMonth() + 1);
    month.isActive = true;

    return month;
  }
  showInfo() {
    console.log("I am calendar");
  }
}
class Year extends CalendarElement {
  parentCalendar: Calendar;
  yearNumber: number;
  childrens: Month[] = [];
  constructor(year: number, parentCalendar: Calendar) {
    super();
    this.yearNumber = year;
    this.parentCalendar = parentCalendar;
    parentCalendar.addChild(this);
  }
  isSelected: boolean = false;
  isActive: boolean = false;
  backGroundColor: string = "white";
  borderColor: string = "black";

  showInfo() {
    console.log("I am year: ", this.yearNumber);
  }
  disactivate() {
    this.isActive = false;
  }
  activate() {
    let nowActive = this.parentCalendar.getActiveYear();
    if (nowActive) {
      nowActive.disactivate();
    }
    this.isActive = true;
  }
}

const daysInMonth: Record<number, number> = {
  0: 31,
  1: 28,
  2: 31,
  3: 30,
  4: 31,
  5: 30,
  6: 31,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

const monthNames: Record<number, string> = {
  0: "Styczeń",
  1: "Luty",
  2: "Marzec",
  3: "Kwiecień",
  4: "Maj",
  5: "Czerwiec",
  6: "Lipiec",
  7: "Sierpień",
  8: "Wrzesień",
  9: "Październik",
  10: "Listopad",
  11: "Grudzień",
};

interface ApiReservation {
  start: string;
  end: string;
}
class Month extends CalendarElement {
  parentYear: Year;
  monthNumber: number;
  childrens: Day[] = [];
  isActive: boolean = false;
  constructor(parentYear: Year, monthNumber: number) {
    super();
    this.parentYear = parentYear;
    this.monthNumber = monthNumber;
    parentYear.addChild(this);
  }

  async fetchDaysAvailable() {
    const url = `http://46.224.13.142:3100/reservations/already?month=${this.monthNumber}&year=${this.parentYear.yearNumber}`;
    const resp = await fetch(url);
    const data: unknown = await resp.json();
    if (!Array.isArray(data)) {
      alert("błąd api");
      return;
    }
    const reservations: ApiReservation[] = data;

    reservations.forEach((reservation) => {
      const startDate = new Date(reservation.start + "T00:00:00");
      const endDate = new Date(reservation.end + "T00:00:00");
      // let loop = new Date(startDate)
      for (
        let day = new Date(startDate);
        day <= endDate;
        day.setDate(day.getDate() + 1)
      ) {
        if (
          day.getMonth() == this.monthNumber &&
          day.getFullYear() == this.parentYear.yearNumber
        ) {
          const dayToDisable = this.childrens.find(
            (c) => c.dayNumber === day.getDate(),
          );
          dayToDisable?.setDisabled(true);
        }
      }
    });
    this.rerender && this.rerender();
  }

  showInfo() {}
  disactivate() {
    this.isActive = false;
  }
  activate() {
    this.parentYear.activate();
    const nowActive = this.parentYear.childrens.find((m) => m.isActive);
    if (nowActive && nowActive !== this) {
      nowActive.disactivate();
    }
    this.isActive = true;
    this.fetchDaysAvailable();
  }
}

class Day extends CalendarElement {
  fixedHolidays = [
    "1-1", // Nowy Rok
    "1-6", // Trzech Króli
    "5-1", // Święto Pracy
    "5-3", // Święto Konstytucji 3 Maja
    "8-15", // Wniebowzięcie NMP
    "11-1", // Wszystkich Świętych
    "11-11", // Święto Niepodległości
    "12-25", // Boże Narodzenie (pierwszy dzień)
    "12-26", // Boże Narodzenie (drugi dzień)
  ];
  price: number = 600;
  dayNumber: number;
  parentMonth: Month;
  day: number;
  selected: boolean = false;
  hovers: string = "hover:bg-[#379237] hover:text-white";
  style: string = "";
  backGroundColor: string = "bg-white";
  isBetweenSelected: boolean = false;
  isDisabled: boolean = false;
  borderColor: string = "border-[#D5EAD8]/30";
  textColor: string = "text-[#2F3B40]";
  constructor(parentMonth: Month, dayNumber: number) {
    super();
    this.parentMonth = parentMonth;
    this.dayNumber = dayNumber;
    this.day = this.calcDayOfWeek();
    if (this.day == 6 || this.day == 7) {
      this.price += 100;
      this.textColor = "text-gray-900";
    }
    const today: Date = new Date();
    if (
      dayNumber == today.getDate() &&
      parentMonth.monthNumber == today.getMonth() &&
      parentMonth.parentYear.yearNumber == today.getFullYear()
    ) {
      this.backGroundColor = "bg-[#849831ff]  ";
      this.textColor = "text-white";
    }
    if (dayNumber == 5) {
      this.setDisabled(true);
    }
    if (
      this.fixedHolidays.includes(
        `${this.parentMonth.monthNumber + 1}-${dayNumber}`,
      )
    ) {
      this.price += 50;
    }

    parentMonth.addChild(this);
  }
  setSelected(value: boolean) {
    this.selected = value;
    if (value) {
      this.borderColor = "border-0.5 border-[#379237]";
      this.backGroundColor = "bg-[#5B7553] ";
      this.textColor = "text-[#0C1406]";
      this.style =
        "outline-none ring-2 ring-[#54B435] ring-offset-2 ring-offset-[#2F3B40]";
    } else {
      this.style = "";
      this.borderColor = "border-[#D5EAD8]/30";
      this.backGroundColor = "bg-white";
      if (this.day == 6 || this.day == 7) {
        this.textColor = "text-gray-100";
        this.backGroundColor = "bg-black/55";
      } else {
        this.textColor = "text-black";
      }
      const today: Date = new Date();
      if (
        this.dayNumber == today.getDate() &&
        this.parentMonth.monthNumber == today.getMonth() &&
        this.parentMonth.parentYear.yearNumber == today.getFullYear()
      ) {
        this.backGroundColor = "bg-[#54B435]";
        this.textColor = "text-white";
      }
      if (this.isDisabled) {
        this.setDisabled(true);
      }
    }
  }
  setDisabled(value: boolean) {
    this.isDisabled = value;
    if (value) {
      this.borderColor = "border-1.5 border-gray-400/15";
      this.hovers = "";
      this.backGroundColor = "bg-[#E5E0D8]";
      this.textColor = "text-[#A09B95]";
    } else {
      this.borderColor = "border-[#D5EAD8]/30";
      this.backGroundColor = "bg-white";
      if (this.day == 6 || this.day == 7) {
        this.textColor = "text-gray-100";
        this.backGroundColor = "bg-black/55";
      } else {
        this.textColor = "text-black";
      }
      const today: Date = new Date();
      if (
        this.dayNumber == today.getDate() &&
        this.parentMonth.monthNumber == today.getMonth() &&
        this.parentMonth.parentYear.yearNumber == today.getFullYear()
      ) {
        this.backGroundColor = "bg-[#54B435]";
      }
    }
  }

  setIsBetweenSelected(value: boolean) {
    this.isBetweenSelected = value;
    if (value) {
      this.borderColor = "border border-[#6b9e8f]";
      this.backGroundColor = "bg-[#a8c9bf]";
      this.textColor = "text-[#2F3B40]";
    } else {
      this.borderColor = "border-[#D5EAD8]/30";
      this.backGroundColor = "bg-white";
      if (this.day == 6 || this.day == 7) {
        this.textColor = "text-gray-100";
        this.backGroundColor = "bg-black/55";
      } else {
        this.textColor = "text-[#2F3B40]";
      }
      const today: Date = new Date();
      if (
        this.dayNumber == today.getDate() &&
        this.parentMonth.monthNumber == today.getMonth() &&
        this.parentMonth.parentYear.yearNumber == today.getFullYear()
      ) {
        this.backGroundColor = "bg-[#54B435]";
        this.textColor = "text-white";
      }
      if (this.isDisabled) {
        this.setDisabled(true);
      }
    }
  }

  setIsBetweenSelectedEdge(value: boolean, isStart: boolean) {
    if (value) {
      this.borderColor = "border-2 border-[#5a8d7f]";
      this.backGroundColor = "bg-[#8da399]";
      this.textColor = "text-white";
      this.style = "ring-1 ring-[#6b9e8f]";
    } else {
      this.borderColor = "border-[#D5EAD8]/30";
      this.backGroundColor = "bg-white";
      this.style = "";
      if (this.day == 6 || this.day == 7) {
        this.textColor = "text-gray-100";
        this.backGroundColor = "bg-black/55";
      } else {
        this.textColor = "text-[#2F3B40]";
      }
      const today: Date = new Date();
      if (
        this.dayNumber == today.getDate() &&
        this.parentMonth.monthNumber == today.getMonth() &&
        this.parentMonth.parentYear.yearNumber == today.getFullYear()
      ) {
        this.backGroundColor = "bg-[#54B435]";
        this.textColor = "text-white";
      }
    }
  }
  calcDayOfWeek(): number {
    const date = new Date(
      this.parentMonth.parentYear.yearNumber,
      this.parentMonth.monthNumber,
      this.dayNumber,
    );
    const dayOfWeek: number = date.getDay() == 0 ? 7 : date.getDay();
    if (dayOfWeek == 6 || dayOfWeek == 7) {
      this.backGroundColor = "bg-[#F4EDE4]";
      this.textColor = "text-gray-900";
    }
    return dayOfWeek;
  }
  displayed: boolean = false;
  showInfo() {
    console.log(
      "Day: ",
      this.dayNumber,
      "Month: ",
      this.parentMonth.monthNumber,
      "Year: ",
      this.parentMonth.parentYear.yearNumber,
    );
  }
}

function generateDay(month: Month, dayNumber: number): Day {
  const day = new Day(month, dayNumber);
  return day;
}

function generateMonth(year: Year, monthNumber: number): Month {
  const month = new Month(year, monthNumber);
  let days: number = daysInMonth[monthNumber];
  if (year.yearNumber % 4 == 0 && monthNumber == 2) {
    days += 1;
  }

  for (let i = 1; i <= days; i++) {
    generateDay(month, i);
  }

  return month;
}

function generateYear(calendar: Calendar, yearNumber: number): Year {
  const year = new Year(yearNumber, calendar);
  for (let i = 0; i < 12; i++) {
    generateMonth(year, i);
  }
  return year;
}
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
type CalendarProps = {
  yearNumber?: number;
  monthNumber?: number;
  calendarSetter?: (value: CalendarDate | null) => void;
  people?: number;
};

export interface CalendarHandle {
  checkAvaibility(): void;
}

const CalendarComponent = forwardRef<CalendarHandle, CalendarProps>(
  ({ yearNumber, monthNumber, calendarSetter, people = 1 }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const calendarRef = useRef<Calendar | null>(null);
    const [tick, setTick] = useState(0);
    const forceRerender = () => setTick((v) => v + 1);
    if (!calendarRef.current) {
      const cal = new Calendar();
      const year = generateYear(cal, yearNumber ?? new Date().getFullYear());
      const month = year.childrens[monthNumber ?? new Date().getMonth()];
      year.activate();
      month.activate();
      cal.setRerender(forceRerender);
      calendarRef.current = cal;
    }

    const calendar = calendarRef.current!;

    const [activeMonth, setActiveMonth] = useState<Month>(
      calendar.getActiveMonth(),
    );
    const [offsetDays, setOffsetDays] = useState<number>(
      activeMonth.childrens[0].day,
    );
    const [firstSelectedDate, setFirstSelectedDate] = useState<Day | null>(
      null,
    );
    const [secondSelectedDate, setSecondSelectedDate] = useState<Day | null>(
      null,
    );
    const [firstLastHoveredDay, setFirstLastHoveredDay] = useState<Day | null>(
      null,
    );
    const [secondLastHoveredDay, setSecondLastHoveredDay] =
      useState<Day | null>(null);
    const [firstDisabledDate, setFirstDisabledDate] = useState<Day | null>(
      null,
    );

    useEffect(() => {
      setOffsetDays(activeMonth.childrens[0].day);
    }, [activeMonth]);

    function handlePrev() {
      if (activeMonth.monthNumber > 0) {
        const target: Month =
          activeMonth.parentYear.childrens[activeMonth.monthNumber - 1];
        target.activate();
        setActiveMonth(target);
      } else {
        const targetYearNumber = activeMonth.parentYear.yearNumber - 1;
        if (
          !calendar.childrens.find((y) => y.yearNumber === targetYearNumber)
        ) {
          const targetYear = generateYear(calendar, targetYearNumber);
          targetYear.activate();
          const targetMonth = targetYear.childrens[11];
          targetMonth.activate();
          setActiveMonth(targetMonth);
        } else {
          const targetYear = calendar.childrens.find(
            (y) => y.yearNumber === targetYearNumber,
          );
          const targetMonth = targetYear!.childrens[11];
          setActiveMonth(targetMonth);
        }
      }
    }
    function handleDayHover(day: Day) {
      if (day.isDisabled) {
        if (
          firstDisabledDate === null &&
          firstSelectedDate !== null &&
          secondSelectedDate === null &&
          isDateBefore({ day1: firstSelectedDate, day2: day })
        ) {
          setFirstDisabledDate(day);
        }
        return;
      }
      if (
        firstDisabledDate !== null &&
        isDateBefore({ day1: day, day2: firstDisabledDate })
      ) {
        setFirstDisabledDate(null);
      }
      if (firstDisabledDate !== null || secondSelectedDate !== null) {
        return;
      }
      if (firstSelectedDate !== null && secondSelectedDate === null) {
        if (isDateBefore({ day1: firstSelectedDate, day2: day })) {
          if (firstLastHoveredDay && secondLastHoveredDay) {
            const firstYMD: YMD = dayToYMD(firstLastHoveredDay);
            const secondYMD: YMD = dayToYMD(secondLastHoveredDay);
            iterateBeetweenDatesYMD(firstYMD, secondYMD, false);
          }
          iterateBeetweenDatesYMD(
            dayToYMD(firstSelectedDate),
            dayToYMD(day),
            true,
          );
          setFirstLastHoveredDay(firstSelectedDate);
          setSecondLastHoveredDay(day);
        } else {
          if (firstLastHoveredDay && secondLastHoveredDay) {
            const firstYMD: YMD = dayToYMD(firstLastHoveredDay);
            const secondYMD: YMD = dayToYMD(secondLastHoveredDay);
            iterateBeetweenDatesYMD(firstYMD, secondYMD, false);
            setFirstLastHoveredDay(null);
            setSecondLastHoveredDay(null);
            firstSelectedDate.setSelected(true);
          }
        }
      }
    }

    type DateOperationProp = {
      day1: Day;
      day2: Day;
    };

    function isDateBefore({ day1, day2 }: DateOperationProp): boolean {
      if (
        day1.parentMonth.parentYear.yearNumber ==
        day2.parentMonth.parentYear.yearNumber
      ) {
        if (day1.parentMonth == day2.parentMonth) {
          return day1.dayNumber < day2.dayNumber;
        } else {
          return day1.parentMonth.monthNumber < day2.parentMonth.monthNumber;
        }
      } else {
        if (
          day1.parentMonth.parentYear.yearNumber <
          day2.parentMonth.parentYear.yearNumber
        ) {
          return true;
        } else {
          return false;
        }
      }
    }

    function iterateBeetweenDatesYMD(
      date1: YMD,
      date2: YMD,
      activate: boolean,
    ): boolean {
      for (let year: number = date1.y; year <= date2.y; year++) {
        const startMonth: number = year == date1.y ? date1.m : 0;
        const endMonth: number = year == date2.y ? date2.m : 11;
        for (let month: number = startMonth; month <= endMonth; month++) {
          const startDay: number =
            date1.y == year && date1.m == month ? date1.d : 0;
          const endDay: number =
            date2.y == year && date2.m == month ? date2.d : daysInMonth[month];
          for (let day: number = startDay; day <= endDay; day++) {
            const targetYear = calendar.childrens.find(
              (y) => y.yearNumber == year,
            );
            const targetMonth = targetYear?.childrens.find(
              (m) => m.monthNumber == month,
            );
            const targetDay = targetMonth?.childrens.find(
              (d) => d.dayNumber == day,
            );
            if (targetDay?.isDisabled && activate) {
              setFirstDisabledDate(targetDay);
              return false;
            }
            if (targetDay) {
              targetDay.setIsBetweenSelected(activate);
            }
          }
        }
      }
      return true;
    }

    function DateDifferenceInNights(start: YMD, end: YMD): number {
      const startDate = new Date(start.y, start.m, start.d);
      const endDate = new Date(end.y, end.m, end.d);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    function beetweenSelected(
      day1: Day | null,
      day2: Day | null,
      oldDay1: Day | null,
      oldDay2: Day | null,
    ): boolean {
      if (oldDay1 && oldDay2) {
        const oldDay1YMD: YMD = dayToYMD(oldDay1);
        const oldDay2YMD: YMD = dayToYMD(oldDay2);
        iterateBeetweenDatesYMD(oldDay1YMD, oldDay2YMD, false);
      }
      if (day1 && day2) {
        const day1YMD: YMD = dayToYMD(day1);
        const day2YMD: YMD = dayToYMD(day2);
        const noDisabled = iterateBeetweenDatesYMD(day1YMD, day2YMD, true);
        day1.setSelected(true);
        if (noDisabled) {
          day2.setSelected(true);
          return true;
        }
        return false;
      }
      return true;
    }
    function handleDayClick(day: Day) {
      if (day.isDisabled) {
        return;
      }
      if (
        firstSelectedDate !== null &&
        firstDisabledDate !== null &&
        isDateBefore({ day1: firstDisabledDate, day2: day })
      ) {
        if (secondSelectedDate !== null) {
          secondSelectedDate.setSelected(false);
          beetweenSelected(null, null, firstSelectedDate, secondSelectedDate);
          setSecondSelectedDate(null);
          firstSelectedDate.setSelected(false);
          setFirstSelectedDate(day);
          day.setSelected(true);
          setFirstDisabledDate(null);
          if (calendarSetter) {
            calendarSetter(null);
          }
          return;
        }
      }
      if (firstSelectedDate !== null) {
        if (firstSelectedDate == day) {
          setFirstSelectedDate(null); // reset if clicked on same date
          day.setSelected(false);
          if (secondSelectedDate !== null) {
            secondSelectedDate.setSelected(false);
            beetweenSelected(
              firstSelectedDate,
              day,
              firstSelectedDate,
              secondSelectedDate,
            );
            setSecondSelectedDate(null);
          }
          day.setSelected(false);
          setFirstDisabledDate(null);
          if (calendarSetter) {
            calendarSetter(null);
          }
          return;
        } else {
          if (isDateBefore({ day1: firstSelectedDate, day2: day })) {
            const oldSecondSelectedDate = secondSelectedDate;
            if (secondSelectedDate !== null) {
              secondSelectedDate.setSelected(false);
            }
            const succes = beetweenSelected(
              firstSelectedDate,
              day,
              firstSelectedDate,
              secondSelectedDate!,
            );
            if (succes) {
              setSecondSelectedDate(day);
              const start: YMD = dayToYMD(firstSelectedDate);
              const end: YMD = dayToYMD(day);
              if (calendarSetter) {
                calendarSetter({
                  start: {
                    year: start.y,
                    month: start.m,
                    day: start.d,
                  },
                  end: {
                    year: end.y,
                    month: end.m,
                    day: end.d,
                  },
                  nights: DateDifferenceInNights(start, end),
                  // price calculation will be added here
                });
              }
            } else {
              // if (oldSecondSelectedDate !== null){
              //     oldSecondSelectedDate.setSelected(true);
              //     beetweenSelected(firstSelectedDate, oldSecondSelectedDate, firstSelectedDate, day);
              // }
              if (oldSecondSelectedDate !== null) {
                beetweenSelected(null, null, firstSelectedDate, day);
              }
              setSecondSelectedDate(null);
              firstSelectedDate.setSelected(false);
              setFirstSelectedDate(day);
              setFirstDisabledDate(null);
              day.setSelected(true);
            }
          } else {
            console.log("dupa");
            firstSelectedDate.setSelected(false);
            if (secondSelectedDate !== null) {
              secondSelectedDate.setSelected(false);
              setSecondSelectedDate(null);
            }
            beetweenSelected(null, null, firstSelectedDate, secondSelectedDate);
            setFirstSelectedDate(day);
            day.setSelected(true);
            if (calendarSetter) {
              calendarSetter(null);
            }
          }
        }
      } else {
        setFirstSelectedDate(day);
        day.setSelected(true);
      }
    }
    type YMD = {
      y: number;
      m: number;
      d: number;
    };

    function dayToYMD(day: Day): YMD {
      return {
        y: day.parentMonth.parentYear.yearNumber,
        m: day.parentMonth.monthNumber,
        d: day.dayNumber,
      };
    }

    function handleNext() {
      if (activeMonth.monthNumber < 11) {
        const target: Month =
          activeMonth.parentYear.childrens[activeMonth.monthNumber + 1];
        target.activate();
        setActiveMonth(target);
      } else {
        const targetYearNumber: number = activeMonth.parentYear.yearNumber + 1;
        let targetMonth: Month;
        if (
          !calendar.childrens.find((y) => y.yearNumber === targetYearNumber)
        ) {
          const targetYear: Year = generateYear(calendar, targetYearNumber);
          targetYear.activate();
          targetMonth = targetYear.childrens[0];
        } else {
          const targetYear = calendar.childrens.find(
            (y) => y.yearNumber === targetYearNumber,
          );
          targetYear!.activate();
          targetMonth = targetYear!.childrens[0];
        }
        targetMonth.activate();
        setActiveMonth(targetMonth);
      }
    }

    useImperativeHandle(ref, () => {
      return { checkAvaibility: () => activeMonth.fetchDaysAvailable() };
    }, []);
    return (
      <div
        ref={containerRef}
        className="w-full max-w-[800px] rounded-2xl bg-[#FEF8F2] border-1 border-gray-200 p-3"
      >
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            className="btn btn-ghost text-xs rounded-full text-white bg-[#7BAA5E]/80 hover:bg-[#567351] border-green-500/3"
          >
            &larr;
          </button>

          <div className="flex flex-col items-center">
            <div className="badge bg-[#7BAA5E]/85 border-green-800/10 text-white">
              {activeMonth.parentYear.yearNumber}
            </div>
            <div className="badge bg-[#7BAA5E]/85 border-green-800/10 text-white mt-1">
              {monthNames[activeMonth.monthNumber]}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="btn btn-ghost text-xs rounded-full text-white bg-[#7BAA5E]/80 hover:bg-[#567351] border-green-500/3"
          >
            &rarr;
          </button>
        </div>

        <div
          className="
        mt-3 grid grid-cols-7 gap-x-2 gap-y-3
        auto-rows-[minmax(2.6rem,_auto)]

      "
        >
          {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d, i) => (
            <div
              key={d}
              className={`
               flex mt-2  items-center  justify-center rounded-md
               bg-white/95 text-[#6B8E65] text-sm p-2
               ${i >= 5 ? "opacity-90" : ""}  
               h-6
             `}
            >
              {d}
            </div>
          ))}

          {Array.from({ length: Math.max(0, offsetDays - 1) }).map((_, i) => (
            <div
              key={`pad-${i}`}
              aria-hidden
              className="aspect-square w-full rounded-xl border invisible"
            />
          ))}

          {activeMonth.childrens.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => handleDayClick(day)}
              onMouseOver={() => handleDayHover(day)}
              className={`
            aspect-square w-full
            flex items-center justify-center
            rounded-xl border
            ${day.hovers} 
            ${day.style} 
            ${day.backGroundColor} ${day.textColor} ${day.borderColor}
            
            
            transition-all
          `}
            >
              <div>
                <span className="text-base pt-1">{day.dayNumber}</span>
                <p className="text-[9px] p-0 m-0">
                  {day.price + (people - 1) * 20}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
);

export default CalendarComponent;
