
type BackFromPayment = {
    sid: string
}

export default async function Page({params}:{
    params: {sid:string}
}){
    const data:BackFromPayment = await params
    return (
        <div>
            <h1>Dziękujemy za Rezerwacje</h1>
            <h1>Nr: {data.sid}</h1>
        </div>
    );
}


