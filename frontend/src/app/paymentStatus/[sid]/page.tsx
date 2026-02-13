"use client";

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
                    }
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
            <div className="flex flex-col items-center justify-center w-full">
                <h1>{status == 'error' ? "Rezerwacja zakończona niepowodzeniem." : "Dziękujemy za rezerwacje"}</h1>
                <h1>Nr: {data.sid}</h1>
                <h1>Status Płatności: {status == 'error' ? "Nieudana" : status == 'pending' ? 'W trakcie' : status}</h1>
            </div>

            <div className="w-full flex justify-center items-center">
                <div className="w-60">
                    {lottieAnimation(status ?? "pending")}
                </div>
            </div>
            <div className="flex w-full justify-center items-center">
                <div>
                    {status == 'error' ? <button className="btn">Spróbuj Ponownie</button>: <button className="btn">Wróć na stronę główną</button> }
                </div>
            </div>
            <div>
                <img  src="/images/towel.png" alt="towel" />
            </div>
        </div>
    );
}


