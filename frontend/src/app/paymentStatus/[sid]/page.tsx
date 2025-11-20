
type BackFromPayment = {
    sid: string
}

export default async function Page({params}:{
    params: {sid:string};
}){
    const data:BackFromPayment = await params
    const paymentResponse = await fetch("http://46.224.13.142:3100/payments/checkpayment",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sid: data.sid,
        }),
    });
    const json = await paymentResponse.json();
    const status = json?.paymentStatus ?? null;
    

    return (
        <div>
            <h1>Dziękujemy za Rezerwacje</h1>
            <h1>Nr: {data.sid}</h1>
            <h1>Status Płatności: {status}</h1>
        </div>
    );
}


