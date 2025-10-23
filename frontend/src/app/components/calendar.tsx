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
        selected: boolean = false;
        backGroundColor: string = "bg-white";
        isBeetweenSelected: boolean = false;
        borderColor: string = "border-black/90";
        textColor: string = "text-black"
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
                this.backGroundColor = "bg-blue-900/55"
            }

            parentMonth.addChild(this);
        }
        setSelected(value: boolean){
            this.selected = value;
            if (value){
                this.borderColor = "border-red-500"
            }
            else{
                this.borderColor = "border-gray-400/50"
            }
        }
        setIsBetweenSelected(value: boolean) {
            this.isBeetweenSelected = value;
            if (value){
                this.borderColor = "border-green-500"
            }
            else{
                this.borderColor = "border-gray-400/50"
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


    const [activeMonth, setActiveMonth] = useState<Month>(calendar.getActiveMonth())
    const [offsetDays, setOffsetDays] = useState<number>(activeMonth.childrens[0].day);
    const [firstSelectedDate, setFirstSelectedDate] = useState<Day|null>(null);
    const [secondSelectedDate, setSecondSelectedDate] = useState<Day|null>(null);

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

    function beetweenSelected(day1: Day|null, day2: Day|null, oldDay1: Day|null, oldDay2: Day|null): void{
        console.log(day1, day2, oldDay1, oldDay2);
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
        console.log("Clicked on day: ", day.dayNumber, " Month: ", day.parentMonth.monthNumber, " Year: ", day.parentMonth.parentYear.yearNumber);
        console.log("First selected date: ", firstSelectedDate ? firstSelectedDate.dayNumber : "null");
        console.log("Second selected date: ", secondSelectedDate ? secondSelectedDate.dayNumber : "null");
        if (firstSelectedDate !== null) {
            console.log("Kot kocha zabe-1");
            if (firstSelectedDate == day){
                console.log("Kot kocha zabe0");
                setFirstSelectedDate(null) // reset if clicked on same date
                day.setSelected(false);

                if (secondSelectedDate !== null){
                    console.log("Kot kocha zabe2");
                    secondSelectedDate.setSelected(false);
                    beetweenSelected(firstSelectedDate, day, firstSelectedDate, secondSelectedDate);
                    setSecondSelectedDate(null);
                }
                day.setSelected(false);
                return;
            }
            else{
                if (isDateBefore({ day1: firstSelectedDate, day2: day })){
                    console.log("Kot kocha zabe3");
                    if (secondSelectedDate !== null){
                        console.log("Kot kocha zabe4");
                        secondSelectedDate.setSelected(false);
                    }
                    beetweenSelected(firstSelectedDate, day, firstSelectedDate, secondSelectedDate!);
                    setSecondSelectedDate(day);
                    day.setSelected(true);
                }
                else{
                    console.log("Kot kocha zabe5");
                    firstSelectedDate.setSelected(false);
                    beetweenSelected(null, null, firstSelectedDate, secondSelectedDate);
                    setFirstSelectedDate(day);
                    day.setSelected(true);
                }
            }
        }
        else{
            console.log("Kot kocha zabe6");
            setFirstSelectedDate(day);
            day.setSelected(true);
        }
        console.log("After Click - First selected date: ", firstSelectedDate ? firstSelectedDate.dayNumber : "null");
        console.log("After Click - Second selected date: ", secondSelectedDate ? secondSelectedDate.dayNumber : "null");
        console.log(day);
        
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

    return(
        <div className="w-full h-full bg-black/20 max-w-[600px] rounded-2xl">

            <div className="flex w-[70vw] max-w-[600px] gap-8 justify-between ">

            <button onClick={(e) => {handlePrev()}} className="btn btn-ghost text-xs m-2 rounded-full text-white hover:bg-gray-600 bg-gray-800/40 border-gray-400/50">prev</button>
            <div className="flex flex-col justify-center">
                <div className="badge badge-soft badge-ghost mt-2 ">{activeMonth.parentYear.yearNumber}</div>
                <div className="badge badge-soft badge-ghost mt-2">{monthNames[activeMonth.monthNumber]}</div>

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
                

                
                {activeMonth.childrens.map(day => (
                    <div
                        onClick={(e) => {handleDayClick(day)}}
                        onMouseOver={(e) => handleDayHover(day)}
                        key={day.dayNumber}
                        className={`badge badge-soft badge-ghost text-md  ${day.borderColor} ${day.backGroundColor} hover:bg-blue-600/60 hover:w-[93%] transition-all  w-[90%] h-full aspect-square flex items-center justify-center`}
                    >
                        <h1 className={` ${day.textColor} `}>{day.dayNumber}</h1>

                    </div>
                ))}
            </div>
        </div>
    );
 }
