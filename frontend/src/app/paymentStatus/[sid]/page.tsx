"use client";

import React from "react";
import { useEffect, useState, use } from "react";
import lottieAnimation from "../../components/animation";
import { stat } from "fs";

type BackFromPayment = {
  sid: string;
};

export default function Page({ params }: { params: Promise<BackFromPayment> }) {
  const data: BackFromPayment = use(params);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchStatus = async () => {
      try {
        const paymentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/checkpayment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sid: data.sid,
            }),
          },
        );
        const json = await paymentResponse.json();
        if (isActive) {
          setStatus(json?.paymentStatus ?? null);
        }
      } catch (error) {
        if (isActive) {
          setStatus(null);
        }
      }
    };

    fetchStatus();

    return () => {
      isActive = false;
    };
  }, [data.sid]);

  return (
    <div className="bg-[#FAF9F6] p-4 text-[#2F3B40] font-bold text-md mt-4 mb-8 uppercase tracking-wider">
      <div className="bg-white mt-8 p-10 rounded-2xl border border-[#E0D7C6]/30 shadow-sm mb-6 w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center justify-center w-full pt-2">
        <h1>
          {status == "error"
            ? "Rezerwacja zakończona niepowodzeniem."
            : status == "success"
            ? "Dziękujemy za rezerwacje"
            : "Przetwarzanie płatnośći..."}
        </h1>
        <h2 className="text-sm">Nr: {data.sid}</h2>
        <h1>
          Status Płatności:{" "}
          {status == "error"
            ? "Nieudana"
            : status == "pending"
            ? "W trakcie"
            : status == "success" ? "Zakończona sukcesem" : status}
        </h1>
      </div>

      <div className="w-full flex justify-center items-center">
        <div className="w-60">{lottieAnimation(status ?? "pending")}</div>
      </div>

      <div className="flex w-full justify-center items-center pt-4 pb-0">
        <div>
          {status == "error" ? (
            <button className="btn" onClick={() => {
              window.location.href = "/";
            }}>Spróbuj Ponownie</button>
          ) : (
            <button className="btn" onClick={() => {
              window.location.href = 'https://podwawrzka.pl'
            }}>Wróć na stronę główną</button>
          )}
        </div>
      </div>

      </div>
      <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center mt-12 px-4 md:px-0">
        
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-[#E0D7C6]/20">
          <img
            src="/images/towel.png"
            alt="towel"
            className="w-full h-64 md:h-96 object-cover"
            style={{ objectPosition: "center 20%" }} 
          />

          <div
            className="absolute top-0 left-0 w-full h-32"
            style={{
              background: "linear-gradient(to bottom, #FAF9F6 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          
          <div
            className="absolute bottom-0 left-0 w-full h-20"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
