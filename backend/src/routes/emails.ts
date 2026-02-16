import { request, response, Router } from "express";
import { parse } from "node:path";
import { email, z } from "zod";


const router = Router(); 

const emailData = z.object({
    reciverEmail : z.string().email().min(3).nonoptional(),
    reservationStart: z.coerce.date(),
    reservationEnd: z.coerce.date(),
    amount: z.coerce.number().min(1),
    orderID: z.coerce.number(),
    information: z.coerce.number(),

})


router.post("/send", async (req,res) => {
    const parsedData = emailData.safeParse(req.body)
    if (!parsedData.success) {
        return res.status(400).json(parsedData.error);
    }
    console.log(parsedData)
    

    const reciverName = "test"
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
                    to: [{ email: parsedData.data?.reciverEmail, name: reciverName }],
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

                                <h2 style="margin-top:0;color:#333;">Dziękujemy za rezerwację</h2>
                                <p style="color:#555;font-size:15px;">
                                    Twoja rezerwacja została zapisana.
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
                                        <td style="border:1px solid #e5e7eb;">20.01.2026</td>
                                        <td style="border:1px solid #e5e7eb;">27.01.2026</td>
                                    </tr>
                                    </tbody>
                                </table>

                                <!-- PRICE BOX -->
                                <div style="background:#f7f9fc;padding:20px;border-radius:8px;text-align:center;">
                                    <p style="margin:0;color:#666;">Kwota rezerwacji</p>
                                    <h1 style="margin:5px 0 0 0;color:#2f6fed;">
                                    ${parsedData.data?.amount} zł
                                    </h1>
                                </div>

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
    console.log("elobenc");

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: "Brevo API error",
        details: data,
      });
    }
    console.log("jestesm");

    return res.status(200).json(data)
    }
    catch(err){
        console.error("sending email failure", err);
        return res.status(500).json({ error: "Internal server error" })
    }
});

router.get("/callBack", async (_req, res) => {

});




export default router;