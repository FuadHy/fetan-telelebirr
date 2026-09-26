const fabric = require("./fabric");
// fabric().then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
const config = require('./config')
const createRawRequest = require("./rawRequest");
const express = require('express')
const { queryOrder } = require('./queryOrder');
const crypto = require('crypto');
const app = express()
app.use(express.json());
app.post('/query-order', async (req, res) => {
    const remoteAddress = req.socket.remoteAddress;
    const isLocal = remoteAddress === '127.0.0.1' || remoteAddress === '::1' ||
        remoteAddress === '::ffff:127.0.0.1';
    const expectedToken = process.env.TELEBIRR_INTERNAL_TOKEN;
    if (!isLocal || !expectedToken || req.get('X-Internal-Token') !== expectedToken) {
        return res.sendStatus(403);
    }
    try {
        const providerResponse = await queryOrder(req.body?.merch_order_id);
        const responseBody = JSON.stringify(providerResponse);
        // The provider response omits merchant identity fields. Attest that this
        // exact response came from our localhost service using our merchant
        // credentials, so Django can bind it to the configured merchant while
        // the SP public key is unavailable.
        const merchantBinding = `${config.merchantAppId}:${config.merchantCode}`;
        const mac = crypto.createHmac('sha256', expectedToken)
            .update(`${merchantBinding}\n${responseBody}`)
            .digest('hex');
        res.set('X-Equb-Merchant-App-Id', config.merchantAppId);
        res.set('X-Equb-Merchant-Code', config.merchantCode);
        res.set('X-Equb-Query-Mac', mac);
        res.type('json').send(responseBody);
    } catch (error) {
        console.error('Telebirr queryOrder failed:', error.message);
        res.status(502).json({ error: 'Could not verify payment with Telebirr' });
    }
});
app.post('/generate-checkout', async (req, res) => {
    const {amount, title, circle_id, tx_ref, type} = req.body;
    try {
        const prepayId = await createOrder(amount, title, circle_id, tx_ref, type);
        const checkoutUrl = createCheckoutUrl(prepayId);
        res.json({success: true, checkoutUrl});
    } catch (error) {
        console.error('Telebirr checkout failed:', error.message);
        res.status(502).json({success: false, error: 'Could not start Telebirr checkout'});
    }
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
