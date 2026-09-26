const request = require('request');
const applyFabricToken = require('./fabric');
const config = require('./config');
const tools = require('./tools');

function createQueryRequest(merchantOrderId) {
  const payload = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: 'payment.queryorder',
    version: '1.0',
    biz_content: {
      appid: config.merchantAppId,
      merch_code: config.merchantCode,
      merch_order_id: merchantOrderId,
    },
  };
  payload.sign = tools.signRequestObject(payload);
  payload.sign_type = 'SHA256WithRSA';
  return payload;
}

async function queryOrder(merchantOrderId) {
  if (!/^(?:CONTRIB[0-9a-f]{32}|[0-9]{10,20})$/.test(merchantOrderId)) {
    throw new Error('Invalid merchant order ID');
  }
  const tokenResult = await applyFabricToken();
  if (!tokenResult || !tokenResult.token) {
    throw new Error('Could not obtain Telebirr access token');
  }
  const payload = createQueryRequest(merchantOrderId);
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: config.baseUrl + '/payment/v1/merchant/queryOrder',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': config.fabricAppId,
        Authorization: tokenResult.token,
      },
      body: JSON.stringify(payload),
      timeout: 15000,
    }, (error, response, body) => {
      if (error) return reject(error);
      if (!response || response.statusCode !== 200) {
        return reject(new Error('Telebirr queryOrder HTTP error'));
      }
      try {
        resolve(JSON.parse(body));
      } catch (parseError) {
        reject(new Error('Telebirr queryOrder returned invalid JSON'));
      }
    });
  });
}

module.exports = { queryOrder, createQueryRequest };
