'use client';
import { useEffect, useRef, useState } from "react";
import React from "react";
import { start } from "repl";



    interface ICalendarInterface {
        showInfo: () => void;

    }

    class CalendarElement implements ICalendarInterface {
        childrens: CalendarElement[] = [];
        addChild(child: CalendarElement) {
            this.childrens.push(child);
        }
        showInfo() {
            console.log("Generic calendar element");
        }
    }

    class Calendar extends CalendarElement implements ICalendarInterface
    {
        
        childrens: Year[] = [];
        constructor(){
            super();
        }
        getActiveYear(): Year {
            const res  = this.childrens.find(y => y.isActive) ?? this.childrens[0];
            if (res){
                return res
            }
            else{
                const year = new Year(new Date().getFullYear(), this);
                year.isActive = true;
                return year 
            }
        }
        getActiveMonth(): Month {
            const activeYear = this.getActiveYear();
            if (activeYear){
                let month = activeYear.childrens.find(m => m.isActive) ?? activeYear.childrens[0];
                if (!month) {
                    const now = new Date();
                    month = new Month(activeYear, now.getMonth());
                    month.isActive = true;
                }
                return month
            }

            const year = new Year(new Date().getFullYear(), this);
            const month = new Month(year, new Date().getMonth() + 1);
            month.isActive = true;
            
            return month;
        }
        showInfo() {
            console.log("I am calendar")
        }
    }
    class Year extends CalendarElement
    {
        parentCalendar: Calendar;
        yearNumber: number;
        childrens: Month[] = [];
        constructor(year: number, parentCalendar: Calendar){
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
            console.log("I am year: ", this.yearNumber)
        }
        disactivate(){
            this.isActive = false
        }
        activate(){
            let nowActive = this.parentCalendar.getActiveYear()
            if (nowActive){
                nowActive.disactivate();
            }
            this.isActive = true;
        }

    }
    const daysInMonth: Record<number, number> = {
        0:31,
        1:28,
        2:31,
        3:30,
        4:31,
        5:30,
        6:31,
        7:31,
        8:31,
        9:30,
        10:31,
        11:30,
        12:31
    }

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
        11: "Grudzień"
    }

    class Month extends CalendarElement
    {
        parentYear: Year;
        monthNumber: number;
        childrens: Day[] = [];
        constructor(parentYear: Year ,monthNumber: number){
            super();
            this.parentYear = parentYear;
            this.monthNumber = monthNumber;
            parentYear.addChild(this);
        }

        isActive: boolean = false;
        showInfo() {
        }
        disactivate(){
            this.isActive = false
        }
        activate(){
            this.parentYear.activate();
            const nowActive = this.parentYear.childrens.find(m => m.isActive);
            if (nowActive && nowActive !== this) {
                nowActive.disactivate();
            }
            this.isActive = true;
        }

    }

    class Day extends CalendarElement
    {
        dayNumber: number;
        parentMonth: Month;
        day: number ;
        selected: boolean = false;
        backGroundColor: string = "bg-white";
        isBeetweenSelected: boolean = false;
        borderColor: string = "border-[#D5EAD8]/30";
        textColor: string = "text-[#2F3B40]";
        constructor(parentMonth: Month,dayNumber: number){
            super();
            this.parentMonth = parentMonth;
            this.dayNumber = dayNumber;
            this.day = this.calcDayOfWeek();
            if (this.day == 6 || this.day == 7){

                this.textColor = "text-gray-100";
            }
            const today: Date = new Date();
            if (dayNumber == today.getDate() && parentMonth.monthNumber == today.getMonth() && parentMonth.parentYear.yearNumber == today.getFullYear()){
                this.backGroundColor = "bg-[#849831ff]  "
                this.textColor = "text-white"
            }

            parentMonth.addChild(this);
        }
        setSelected(value: boolean){
            this.selected = value;
            if (value){
                this.borderColor = "border-2 border-[#379237]"
                this.backGroundColor = "bg-[#4ea540ff] "
                this.textColor = "text-[#0C1406]"
            }
            else{
                this.borderColor = "border-[#D5EAD8]/30"
                this.backGroundColor = "bg-white"
                if (this.day == 6 || this.day == 7){
                    this.textColor = "text-gray-100";
                    this.backGroundColor = "bg-black/55";
                }
                else{
                    this.textColor = "text-black"
                }
                const today: Date = new Date();
                if (this.dayNumber == today.getDate() && this.parentMonth.monthNumber == today.getMonth() && this.parentMonth.parentYear.yearNumber == today.getFullYear()){
                    this.backGroundColor = "bg-[#54B435]"
                    this.textColor = "text-white"
                }

            }
        }
        setIsBetweenSelected(value: boolean) {
            this.isBeetweenSelected = value;
            if (value){
                this.borderColor = "border-1.5 border-[#7AC06F]"
                this.backGroundColor = "bg-[#7AC06F]"
                this.textColor = "text-[#2F3B40]"
            }
            else{
                this.borderColor = "border-[#D5EAD8]/30"
                this.backGroundColor = "bg-white"
                if (this.day == 6 || this.day == 7){
                    this.textColor = "text-gray-100";
                    this.backGroundColor = "bg-black/55";
                }
                else{
                    this.textColor = "text-black"
                }
                const today: Date = new Date();
                if (this.dayNumber == today.getDate() && this.parentMonth.monthNumber == today.getMonth() && this.parentMonth.parentYear.yearNumber == today.getFullYear()){
                    this.backGroundColor = "bg-[#54B435]"
                }
            }
        }
        calcDayOfWeek(): number {
            const date = new Date(this.parentMonth.parentYear.yearNumber, this.parentMonth.monthNumber , this.dayNumber);
            const dayOfWeek:number = date.getDay() == 0 ? 7 : date.getDay(); 
            if (dayOfWeek == 6 || dayOfWeek == 7){
                this.backGroundColor = "bg-black/55";
                this.textColor = "text-gray-300"
            }
            return dayOfWeek
        }
        displayed: boolean = false;
         showInfo() {
            console.log("Day: ",this.dayNumber,"Month: ",this.parentMonth.monthNumber,"Year: ",this.parentMonth.parentYear.yearNumber);
        }
    }


function generateDay(month:Month,dayNumber:number): Day{
    const day = new Day(month,dayNumber)
    return day
    }

function generateMonth (year : Year, monthNumber: number): Month{


    const month = new Month(year,monthNumber);
    let days: number = daysInMonth[monthNumber];
    if (year.yearNumber%4==0 && monthNumber == 2){
        days += 1
    }


    for (let i=1;i<=days;i++){
        generateDay(month,i)
    }

    return month

}


function generateYear (calendar: Calendar, yearNumber: number): Year {
    
    const year = new Year(yearNumber,calendar)
    for (let i=0;i<12;i++){
        generateMonth(year,i)
    }
    return year
}
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
type CalendarProps = {
  yearNumber?: number;
  monthNumber?: number;
  calendarSetter?: (value: CalendarDate) => void;
};




 export default function CalendarComponent({ yearNumber, monthNumber, calendarSetter }: CalendarProps) {

    const calendarRef = useRef<Calendar|null>(null);

    if (!calendarRef.current){
        const cal = new Calendar();
        const year = generateYear(cal,yearNumber ?? new Date().getFullYear());
        const month = year.childrens[(monthNumber ?? new Date().getMonth())];
        year.activate();
        month.activate();
        calendarRef.current = cal;

    }

    const calendar = calendarRef.current!;


    const [activeMonth, setActiveMonth] = useState<Month>(calendar.getActiveMonth())
    const [offsetDays, setOffsetDays] = useState<number>(activeMonth.childrens[0].day);
    const [firstSelectedDate, setFirstSelectedDate] = useState<Day|null>(null);
    const [secondSelectedDate, setSecondSelectedDate] = useState<Day|null>(null);
    const [firstLastHoveredDay, setFirstLastHoveredDay] = useState<Day|null>(null);
    const [secondLastHoveredDay, setSecondLastHoveredDay] = useState<Day|null>(null);

    useEffect(() => {
        setOffsetDays(activeMonth.childrens[0].day );
    },[activeMonth]);

    function handlePrev() {
        if (activeMonth.monthNumber > 0) {
            const target: Month = activeMonth.parentYear.childrens[activeMonth.monthNumber-1];
            target.activate();
            setActiveMonth(target);

        } else {
            const targetYearNumber = activeMonth.parentYear.yearNumber-1;
            if (!(calendar.childrens.find(y => y.yearNumber === targetYearNumber))) {
                const targetYear = generateYear(calendar, targetYearNumber);
                targetYear.activate();
                const targetMonth = targetYear.childrens[11];
                targetMonth.activate();
                setActiveMonth(targetMonth);

            } 
            else{
                const targetYear = calendar.childrens.find(y => y.yearNumber === targetYearNumber);
                const targetMonth = targetYear!.childrens[11];
                setActiveMonth(targetMonth);
            }
            
        }
    }
    function handleDayHover(day: Day) {
        if (firstSelectedDate !== null && secondSelectedDate === null){
            if (isDateBefore({ day1: firstSelectedDate, day2: day })){
                if (firstLastHoveredDay && secondLastHoveredDay){
                    const firstYMD: YMD = dayToYMD(firstLastHoveredDay);
                    const secondYMD: YMD = dayToYMD(secondLastHoveredDay);
                    iterateBeetweenDatesYMD(firstYMD,secondYMD,false)
                }
                iterateBeetweenDatesYMD(dayToYMD(firstSelectedDate), dayToYMD(day), true);
                setFirstLastHoveredDay(firstSelectedDate);
                setSecondLastHoveredDay(day);
            }
            else{
                if (firstLastHoveredDay && secondLastHoveredDay){
                    const firstYMD: YMD = dayToYMD(firstLastHoveredDay);
                    const secondYMD: YMD = dayToYMD(secondLastHoveredDay);
                    iterateBeetweenDatesYMD(firstYMD,secondYMD,false)
                    setFirstLastHoveredDay(null);
                    setSecondLastHoveredDay(null);
                    firstSelectedDate.setSelected(true);
                }
            }

        }
    }

    type DateOperationProp = {
        day1 : Day;
        day2: Day;
    };

    function isDateBefore({day1, day2}: DateOperationProp): boolean{
        if (day1.parentMonth.parentYear.yearNumber == day2.parentMonth.parentYear.yearNumber){
            if (day1.parentMonth == day2.parentMonth){
                return day1.dayNumber<day2.dayNumber
            }
            else
                {
                   return day1.parentMonth.monthNumber<day2.parentMonth.monthNumber 
                }
        }
        else{
            if (day1.parentMonth.parentYear.yearNumber < day2.parentMonth.parentYear.yearNumber){
                return true
            }
            else{
                return false
            }
        }
    }

    function iterateBeetweenDatesYMD(date1:YMD,date2:YMD,activate:boolean):void{

        for (let year : number = date1.y ; year <= date2.y; year++){
            const startMonth : number  = (year == date1.y) ? date1.m : 0;
            const endMonth: number = (year == date2.y) ? date2.m : 11;
            for (let month: number = startMonth; month<=endMonth; month++){
                const startDay: number = (date1.y == year && date1.m == month) ? date1.d : 0;
                const endDay: number = (date2.y == year && date2.m == month) ? date2.d : daysInMonth[month]; 
                for (let day:number = startDay; day<= endDay; day++){
                    const targetYear = calendar.childrens.find((y) => y.yearNumber == year);
                    const targetMonth =  targetYear?.childrens.find((m) => m.monthNumber == month);
                    const targetDay = targetMonth?.childrens.find((d)=> d.dayNumber  == day)
                    if (targetDay){
                        targetDay.setIsBetweenSelected(activate)
                    }                  
                }
            }
        }


    }
    
    function DateDifferenceInNights(start: YMD, end: YMD): number {
        const startDate = new Date(start.y, start.m, start.d);
        const endDate = new Date(end.y, end.m, end.d);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    function beetweenSelected(day1: Day|null, day2: Day|null, oldDay1: Day|null, oldDay2: Day|null): void{
        if (oldDay1 && oldDay2){
            const oldDay1YMD: YMD = dayToYMD(oldDay1)
            const oldDay2YMD: YMD = dayToYMD(oldDay2)
            iterateBeetweenDatesYMD(oldDay1YMD,oldDay2YMD,false)
        }
        if (day1 && day2){
            const day1YMD: YMD = dayToYMD(day1)
            const day2YMD: YMD = dayToYMD(day2)
            iterateBeetweenDatesYMD(day1YMD,day2YMD,true);
            day1.setSelected(true);
            day2.setSelected(true);
        }

        
    }
    function handleDayClick(day: Day) {
        if (firstSelectedDate !== null) {
            if (firstSelectedDate == day){
                setFirstSelectedDate(null) // reset if clicked on same date
                day.setSelected(false);

                if (secondSelectedDate !== null){
                    secondSelectedDate.setSelected(false);
                    beetweenSelected(firstSelectedDate, day, firstSelectedDate, secondSelectedDate);
                    setSecondSelectedDate(null);
                }
                day.setSelected(false);
                return;
            }
            else{
                if (isDateBefore({ day1: firstSelectedDate, day2: day })){
                    if (secondSelectedDate !== null){
                        secondSelectedDate.setSelected(false);
                    }
                    beetweenSelected(firstSelectedDate, day, firstSelectedDate, secondSelectedDate!);
                    setSecondSelectedDate(day);
                    day.setSelected(true);
                    const start: YMD = dayToYMD(firstSelectedDate);
                    const end: YMD = dayToYMD(day);
                    if (calendarSetter) {
                    calendarSetter({
                        start: {
                            year: start.y,
                            month: start.m,
                            day: start.d
                        },
                        end: {
                            year: end.y,
                            month: end.m,
                            day: end.d
                        },
                        nights: DateDifferenceInNights(start, end)
                    })
                }
                }
                else{
                    firstSelectedDate.setSelected(false);
                    beetweenSelected(null, null, firstSelectedDate, secondSelectedDate);
                    setFirstSelectedDate(day);
                    day.setSelected(true);
                }
            }
        }
        else{
            setFirstSelectedDate(day);
            day.setSelected(true);
        }

        
    }
    type YMD={
        y: number, m: number, d: number
    }

    function dayToYMD(day:Day): YMD {
        return {
            y: day.parentMonth.parentYear.yearNumber,
            m: day.parentMonth.monthNumber,
            d: day.dayNumber
        };
    }

    

    function handleNext() {
        if (activeMonth.monthNumber<11){
            const target : Month = activeMonth.parentYear.childrens[activeMonth.monthNumber+1]
            target.activate()
            setActiveMonth(target)
        }
        else{
            const targetYearNumber: number  = activeMonth.parentYear.yearNumber+1;
            let  targetMonth:Month;
            if (!(calendar.childrens.find((y) => y.yearNumber === targetYearNumber)))
                {
                    const targetYear: Year = generateYear(calendar,targetYearNumber);
                    targetYear.activate();
                    targetMonth = targetYear.childrens[0];

                }
            else
                {
                    const targetYear = calendar.childrens.find((y) => y.yearNumber === targetYearNumber)
                    targetYear!.activate()
                    targetMonth = targetYear!.childrens[0]
                }
            targetMonth.activate()
            setActiveMonth(targetMonth)
        }
    }   

    return (
  <div className="w-full max-w-[800px] rounded-2xl bg-[#2F3B40] p-3">
    <div className="flex items-center justify-between gap-4">
      <button onClick={handlePrev}
        className="btn btn-ghost text-xs rounded-full text-white bg-[#0C1406] border-gray-400/50">
        &larr;
      </button>

      <div className="flex flex-col items-center">
        <div className="badge bg-[#0C1406] text-white">{activeMonth.parentYear.yearNumber}</div>
        <div className="badge bg-[#0C1406] text-white mt-1">{monthNames[activeMonth.monthNumber]}</div>
      </div>

      <button onClick={handleNext}
        className="btn btn-ghost text-xs rounded-full text-white bg-[#0C1406] border-gray-400/50">
        &rarr;
      </button>
    </div>

    <div
      className="
        mt-3 grid grid-cols-7 gap-x-2 gap-y-3
        [grid-auto-rows:minmax(2.6rem,1fr)]
      "
    >
      {['Pn','Wt','Śr','Cz','Pt','Sb','Nd'].map((d, i) => (
        <div key={d}
             className={`
               flex mt-2  items-center  justify-center rounded-md
               bg-black/40 text-white text-sm p-2
               ${i>=5 ? 'opacity-90' : ''}  
               h-6
             `}
        >
          {d}
        </div>
      ))}

      {Array.from({ length: Math.max(0, offsetDays - 1) }).map((_, i) => (
        <div key={`pad-${i}`} aria-hidden className="h-12" />
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
            ${day.backGroundColor} ${day.textColor} ${day.borderColor}
            hover:bg-[#379237] hover:text-white
            focus:outline-none focus:ring-2 focus:ring-[#54B435] focus:ring-offset-2 focus:ring-offset-[#2F3B40]
            transition-all
          `}
        >
          <span className="text-base">{day.dayNumber}</span>
        </button>
      ))}
    </div>
  </div>
);
}



