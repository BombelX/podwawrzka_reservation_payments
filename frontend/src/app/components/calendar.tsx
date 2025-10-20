'use client';
import { useState } from "react";
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
        constructor(parentYear: Year ,monthNumber: number){
            super();
            this.parentYear = parentYear;
            this.monthNumber = monthNumber;
            parentYear.addChild(this);
        }

        isActive: boolean = false;
        backGroundColor: string = "bg-green-900/55";
        borderColor: string = "border-gray-400/50";
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
        constructor(parentMonth: Month,dayNumber: number){
            super();
            this.parentMonth = parentMonth;
            this.dayNumber = dayNumber;
            parentMonth.addChild(this);
        }
        displayed: boolean = false;
        day: number = 0;
        backGroundColor: string = "bg-gray-900/55";
        borderColor: string = "border-gray-400/50";
         showInfo() {
            console.log("Day: ",this.dayNumber,"Month: ",this.parentMonth.monthNumber,"Year: ",this.parentMonth.parentYear.yearNumber);
        }
    }




    




 export default function CalendarComponent(){

     const calendar = new Calendar();
     const yeart = new Year(2010,calendar);
     const year = new Year(2024,calendar);
     const month1 = new Month(year,12);
     const day1 = new Day(month1,1);
     const day2 = new Day(month1,2);
     const month2 = new Month(year,5);
     const day3 = new Day(month2,1);
     const day4 = new Day(month2,2);
     const day5 = new Day(month2,3);
    const day6 = new Day(month2,4);
    const day7 = new Day(month2,5);
    const day8 = new Day(month2,6);
    const day9 = new Day(month2,7)
    const day10 = new Day(month2,8);
    const day11 = new Day(month2,9);
    const day12 = new Day(month2,10);
    const day13 = new Day(month2,11);
    const day14 = new Day(month2,12);
    const day15 = new Day(month2,13);
    const day16 = new Day(month2,14)

    month2.activate()
    year.activate()


    const selected = new Date(
        calendar.getActiveYear().yearNumber,
        // JavaScript Date months are 0-based; our monthNumber is 1-based
        calendar.getActiveMonth().monthNumber - 1
    );
     const [selectedDate, setSelectedDate] = useState(selected)

    console.log(selectedDate)
    console.log(calendar.getActiveMonth())

    function generateDaysInMonth() {
        const month = calendar.getActiveMonth()
        const offsetDays = month.childrens[0].dayNumber;
        
    }

    const [activeMonth, setActiveMonth] = useState(calendar.getActiveMonth())


    return(
        <div className="w-full h-full bg-gray-400 max-w-[600px] rounded-xl">

            <div className="flex w-[70vw] max-w-[600px] gap-8 justify-between ">

            <button className="btn btn-ghost text-xs m-2 rounded-full text-white hover:bg-gray-600 bg-gray-800/40 border-gray-400/50">prev</button>
            <div className="flex flex-col justify-center">
                <div className="badge badge-soft badge-ghost mt-2">{selectedDate.getFullYear()}</div>
                <div className="badge badge-soft badge-ghost mt-2">{selectedDate.toLocaleString('pl-PL',{month: 'long'})}</div>
            </div>
            <button className="btn btn-ghost m-2 text-xs rounded-full text-white hover:bg-gray-600 bg-gray-800/40 border-gray-400/50">next</button>
            </div>

            <div className="grid grid-cols-7 gap-2 max-w-[600px] w-[65vw] p-3">
                {calendar.getActiveMonth().childrens.map(day => (

                    <div
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
