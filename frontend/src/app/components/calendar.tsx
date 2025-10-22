'use client';
import { useEffect, useRef, useState } from "react";
import React from "react";



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
                    month = new Month(activeYear, now.getMonth() + 1);
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
    class Month extends CalendarElement
    {
        parentYear: Year;
        monthNumber: number;
        childrens: Day[] = [];
        backGroundColor: string = "bg-green-900/55";
        borderColor: string = "border-gray-400/50";
        constructor(parentYear: Year ,monthNumber: number){
            super();
            this.parentYear = parentYear;
            this.monthNumber = monthNumber;
            parentYear.addChild(this);
        }

        isActive: boolean = false;
        showInfo() {
            console.log("I am Zaba, daughter of Badger, lover of cat, master of ")
        }
        disactivate(){
            this.isActive = false
        }
        activate(){
            // Ensure the parent year is the active year
            this.parentYear.activate();
            // Deactivate currently active month within the same year only
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
        backGroundColor: string = "bg-gray-900/55";
        borderColor: string = "border-gray-400/50";
        constructor(parentMonth: Month,dayNumber: number){
            super();
            this.parentMonth = parentMonth;
            this.dayNumber = dayNumber;
            this.day = this.calcDayOfWeek();
            const today: Date = new Date();
            if (dayNumber == today.getDate() && parentMonth.monthNumber == today.getMonth() && parentMonth.parentYear.yearNumber == today.getFullYear()){
                this.backGroundColor = "bg-blue-900/55"
            }

            parentMonth.addChild(this);
        }
        calcDayOfWeek(): number {
            const date = new Date(this.parentMonth.parentYear.yearNumber, this.parentMonth.monthNumber , this.dayNumber);
            const dayOfWeek:number = date.getDay(); 
            if (dayOfWeek == 0 || dayOfWeek == 6){
                this.backGroundColor = "bg-gray-900/75";
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

type CalendarProps = {
  yearNumber?: number;
  monthNumber?: number;
};




 export default function CalendarComponent({ yearNumber, monthNumber }: CalendarProps) {

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


    // const [selectedDate, setSelectedDate] = useState(selected)

    
    const [activeMonth, setActiveMonth] = useState<Month>(calendar.getActiveMonth())
    const [offsetDays, setOffsetDays] = useState<number>(activeMonth.childrens[0].day)
    const [firstSelectedDate, setFirstSelectedDate] = useState<Day|null>(null);
    const [secondSelectedDate, setSecondSelectedDate] = useState<Day|null>(null);

    useEffect(() => {
        setOffsetDays(activeMonth.childrens[0].day);
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
                setActiveMonth(targetMonth);
                console.log("with year change")

            } 
            else{
                const targetYear = calendar.childrens.find(y => y.yearNumber === targetYearNumber);
                const targetMonth = targetYear!.childrens[11];
                setActiveMonth(targetMonth);
                console.log("without year change")
            }
            
        }
    }
    function handleDayHover(day: Day) {
        console.log("Hovering over day: ", day.dayNumber, " Month: ", day.parentMonth.monthNumber, " Year: ", day.parentMonth.parentYear.yearNumber);
    }

    type DateOperationProp = {
        day1 : Day;
        day2: Day;
    };

    function isDateBefore({day1, day2}: DateOperationProp): boolean{
        if (day1.parentMonth.parentYear.yearNumber == day2.parentMonth.parentYear.yearNumber){
            if (day1.parentMonth.monthNumber == day2.parentMonth.monthNumber){
                return day1.dayNumber<day2.dayNumber
            }
            else
                {
                   return day1.parentMonth.monthNumber<day2.parentMonth.monthNumber 
                }
        }
        else{
            if (day1.parentMonth.parentYear.yearNumber < day2.parentMonth.parentYear.yearNumber){
                return false
            }
            else{
                return true
            }
        }
    }

    function handleDayClick(day: Day) {
        if (!(firstSelectedDate === null)) {
            if (firstSelectedDate == day){
                setFirstSelectedDate(null) // reset if clicket on same date
            }
            else{
                
                
            }
        }
        else{
            setFirstSelectedDate(day);
            
        }
        
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

    return(
        <div className="w-full h-full bg-gray-400 max-w-[600px] rounded-2xl">

            <div className="flex w-[70vw] max-w-[600px] gap-8 justify-between ">

            <button onClick={(e) => {handlePrev()}} className="btn btn-ghost text-xs m-2 rounded-full text-white hover:bg-gray-600 bg-gray-800/40 border-gray-400/50">prev</button>
            <div className="flex flex-col justify-center">
                <div className="badge badge-soft badge-ghost mt-2">{activeMonth.parentYear.yearNumber}</div>
                <div className="badge badge-soft badge-ghost mt-2">{activeMonth.monthNumber+1}</div>
            </div>
            <button onClick={(e) => {handleNext()}} className="btn btn-ghost m-2 text-xs rounded-full text-white hover:bg-gray-600 bg-gray-800/40 border-gray-400/50">next</button>
            </div>

            <div className="grid grid-cols-7 gap-2 max-w-[600px] w-[65vw] p-3">

                {Array.from({ length: Math.max(0, offsetDays - 1) }).map((_, i) => (
                    <div
                        key={i}
                        className="w-[90%] h-full aspect-square flex items-center justify-center"
                    >                       
                    </div>
                ))}
                

                
                {calendar.getActiveMonth().childrens.map(day => (
                    <div
                        onClick={(e) => {day.showInfo()}}
                        onMouseOver={(e) => handleDayHover(day)}
                        key={day.dayNumber}
                        className={`badge badge-soft badge-ghost text-md  ${day.borderColor} ${day.backGroundColor} hover:bg-blue-600/60 hover:w-[93%] transition-all  w-[90%] h-full aspect-square flex items-center justify-center`}
                    >
                        {day.dayNumber}
                    </div>
                ))}
            </div>
        </div>
    );
 }
