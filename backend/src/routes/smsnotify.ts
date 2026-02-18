import { request, response, Router } from "express";
import { SMSAPI } from 'smsapi';


const router = Router()
const smsapi = new SMSAPI('oAuthToken');


router.post("sendSMS", async (req,res) => {
    const result = await smsapi.sms.sendSms('+48739973665', 'My first message!');
}
)
export default router;