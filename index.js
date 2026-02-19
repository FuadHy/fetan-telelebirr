const fabric = require("./fabric");
// fabric().then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
const config = require('./config')
const createRawRequest = require("./rawRequest");
const express = require('express')
const app = express()
app.use(express.json());
app.post('/generate-checkout', async (req, res) => {
    const {amount, title, circle_id} = req.body;
    console.log(req.body)
    const prepayId = await createOrder(amount, title, circle_id);
    const checkoutUrl = createCheckoutUrl(prepayId);
    res.json({success: true, checkoutUrl});
})
// });

function createCheckoutUrl(prepayId){
    const rawRequest = createRawRequest.createRawRequest(prepayId);
    return config.webBaseUrl + rawRequest + config.otherParams
}

const createOrder = require("./createOrder");

app.listen(4002, () => {
    console.log("Server started on port 4002");
});