// import { request, response, Router } from "express";
import { SMSAPI } from 'smsapi';
import  {z} from 'zod';

// const router = Router()
let smsapi: any;
if (process.env.SMS_API != null){
    smsapi = new SMSAPI(process.env.SMS_API ?? "no-key");
}
else{
    smsapi = null;
}
const smsData = z.object({
    phoneNumber : z.string(),
    message : z.string().nonempty()
})



export async function sendSMS(message : string, phoneNumber : string){
    if (smsapi != null){
        try{
            const result = await smsapi.sms.sendSms(phoneNumber, message);
            return result
        }   
        catch{
            return false
        }
    }
}


export async function sendEmail(email:string , amount: number, orderNumber : number, name : string, arrivalTime : string , guestNumber : number , from : string , to :string ){
    const reciverName = "Podwawrzką"
    try{
        const resp = await fetch("https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": `${process.env.EMAIL_API_KEY}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    "sender":{
                        email: "rezerwacje@podwawrzka.pl",
                        name: "Podwawrzką"
                    },
                    to: [{ email, name: reciverName }],
                    subject: "Potwierdzenie rezerwacji Podwawrzką",
                    htmlContent: `
                    <html>
                    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
                        <tr>
                        <td align="center">

                            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                            <!-- HEADER -->
                                <tr>
                                    <td>
                                    <img 
                                        src="https://podwawrzka.pl/wp-content/uploads/2024/11/DSC08558-768x512.jpg"
                                        width="600"
                                        style="display:block;width:100%;max-width:600px;height:auto;"
                                        alt="Podwawrzka"
                                    />
                                    </td>
                                </tr>

                            <!-- CONTENT -->
                            <tr>
                                <td style="padding:30px;">

                                <h2 style="margin-top:0;color:#333;">Dziękujemy za rezerwację !</h2>
                                <p style="color:#555;font-size:15px;">
                                    Twoja rezerwacja została przeyjeta.
                                </p>
                                <p style="color:#555;font-size:15px;">
                                    Nr zamówienia: ${orderNumber}
                                </p>
                                <p style="color:#555;font-size:15px;">
                                    Liczba gości: ${guestNumber}
                                </p>


                                <!-- DATE TABLE -->
                                <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse;margin:25px 0;">
                                    <thead>
                                    <tr style="background:#f0f2f5;">
                                        <th align="left" style="border:1px solid #e5e7eb;">Od</th>
                                        <th align="left" style="border:1px solid #e5e7eb;">Do</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td style="border:1px solid #e5e7eb;">${from}}</td>
                                        <td style="border:1px solid #e5e7eb;">${to}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #e5e7eb;">${arrivalTime}</td>
                                        <td style="border:1px solid #e5e7eb;">11:00</td>
                                    </tr>
                                    </tbody>
                                </table>

                                <!-- PRICE BOX -->
                                <div style="background:#f7f9fc;padding:20px;border-radius:8px;text-align:center;">
                                    <p style="margin:0;color:#666;">Kwota rezerwacji</p>
                                    <h1 style="margin:5px 0 0 0;color:#45a968">
                                    ${amount} zł
                                    </h1>
                                </div>

                                </td>
                            </tr>
                                <tr>
                                <td style="padding:0 30px 30px 30px;">

                                    <h3 style="margin:0 0 12px 0;color:#333;font-size:18px;">
                                    Dojazd
                                    </h3>

                                    <!-- MAP IMAGE (clickable) -->
                                    <a href="https://maps.app.goo.gl/vcLS3H4DaDyRGeHe6" target="_blank" style="text-decoration:none;">
                                    <img
                                        src="https://i.postimg.cc/MTQNgBwq/image-2026-02-17-170659094.png"
                                        width="540"
                                        alt="Mapa dojazdu do Podwawrzka"
                                        style="display:block;width:100%;max-width:540px;height:auto;border:0;border-radius:10px;"
                                    />
                                    </a>

                                    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto 0 auto;">
                                    <tr>
                                        <td bgcolor="#45a970" style="border-radius:8px;">
                                        <a
                                            href="https://maps.app.goo.gl/vcLS3H4DaDyRGeHe6"
                                            target="_blank"
                                            style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;border-radius:8px;"
                                        >
                                            Uzyskaj wskazówki dojazdu
                                        </a>
                                        </td>
                                    </tr>
                                    </table>

                                    <p style="margin:12px 0 0 0;color:#777;font-size:12px;text-align:center;">
                                    Jeśli przycisk nie działa, otwórz:
                                    <a href="https://maps.app.goo.gl/vcLS3H4DaDyRGeHe6" target="_blank" style="color:#2f6fed;">
                                        mapy Google
                                    </a>
                                    </p>

                                </td>
                                </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style="background:#f0f2f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                                W razie pytań skontaktuj się z nami:<br>
                                kontakt@podwawrzka.pl
                                </td>
                            </tr>

                            </table>

                        </td>
                        </tr>
                    </table>

                    </body>
                </html>`,
            })
        }
    );
    const data = await resp.json();
    console.log("elo benc");

    return resp.status
    }
    catch(err){
        console.error("sending email failure", err);
        return 500
    }

}






// router.post("/sendsms", async (req,res) => {
//     console.log("Sending Sms");

//     const parsedBody = smsData.safeParse(req.body);
//     if (!parsedBody.success){
//         return res.status(403).json({
//             error : "Wrong payload !"
//         })
//     }
//     const data = parsedBody.data
//     console.log(data);
//     if (smsapi != null){
//         try{
//             const result = await smsapi.sms.sendSms(data.phoneNumber, data.message);
//             return res.status(200).json({
//                 status: "sended",
//                 info : result,
//             })
//         }   
//         catch{
//             return res.status(400)
//         }
//     }
//     else{
//         return res.status(500).json({
//             error: "Internal server error"
//         })
//     }
// }

// export default router;