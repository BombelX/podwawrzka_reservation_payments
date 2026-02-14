import { request, response, Router } from "express";
import { email, z } from "zod";


const router = Router(); 

const emailData = z.object({
    reciverEmail : z.string().email().min(3),
    reservationStart: z.coerce.date(),
    reservationEnd: z.coerce.date(),
    amount: z.coerce.number().min(1),
    orderID: z.coerce.number(),
    information: z.coerce.number(),

})


router.post("/email", async (req,res) => {
    console.log("elo")
    try{
        const resp = fetch("ttps://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": `${process.env.EMAIL_API_KEY}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    "sender":{},
                    "to":{},
                "subject":"Elo benc",
                "params":{
                    "variable":"420",
                },
                "htmlContent":""
            })
        }
    );
    const data = await response.json();
    res.status(200).json(data);
    }
    catch(err){
        console.error("sending email faliture",err);
        res.status(500);
    }
});

router.get("/callBack", async (_req, res) => {

});




export default router;