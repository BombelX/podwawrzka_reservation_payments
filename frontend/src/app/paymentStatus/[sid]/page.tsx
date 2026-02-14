"use client";

import React from "react";
import { useEffect, useState, use } from "react";
import lottieAnimation from "../../components/animation";

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
          "http://46.224.13.142:3100/payments/checkpayment",
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
    <div>
      <div className="w-full h-5 bg-gray-100"></div>
      <div className="flex flex-col items-center justify-center w-full pt-2">
        <h1>
          {status == "error"
            ? "Rezerwacja zakończona niepowodzeniem."
            : status == "success"
              ? "Dziękujemy za rezerwacje"
              : "Przetwarzanie płatnośći..."}
        </h1>
        <h1>Nr: {data.sid}</h1>
        <h1>
          Status Płatności:{" "}
          {status == "error"
            ? "Nieudana"
            : status == "pending"
              ? "W trakcie"
              : status}
        </h1>
      </div>

      <div className="w-full flex justify-center items-center">
        <div className="w-60">{lottieAnimation(status ?? "pending")}</div>
      </div>

      <div className="flex w-full justify-center items-center pt-4 pb-0">
        <div>
          {status == "error" ? (
            <button className="btn">Spróbuj Ponownie</button>
          ) : (
            <button className="btn">Wróć na stronę główną</button>
          )}
        </div>
      </div>

      <div className="relative w-full flex justify-center items-center mt-4">
        <img
          src="/images/towel.png"
          alt="towel"
          className="w-full max-h-[350px] object-cover rounded-t-lg shadow-lg"
          style={{ objectPosition: "center top" }}
        />
        {/* Gradient overlay at the top of the image */}
        <div
          className="absolute top-0 left-0 w-full h-20"
          style={{
            background:
              "linear-gradient(to bottom, #f3f4f6 80%, transparent 100%)",
            borderTopLeftRadius: "0.5rem",
            borderTopRightRadius: "0.5rem",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
