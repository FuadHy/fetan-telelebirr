const tools = require("./tools");
const config = require("./config");

// 1. prepayId get from [create order](./requestCreateOrder.md)
function createRawRequest(prepayId) {
  let map = {
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str: tools.createNonceStr(), // tools code you can download form demo
    prepay_id: prepayId,
    timestamp: tools.createTimeStamp(), // tools code you can download form demo
  };
  let sign = tools.signRequestObject(map); // tools code you can download form demo
  // order by ascii in array
  let rawRequest = [
    "appid=" + map.appid,
    "merch_code=" + map.merch_code,
    "nonce_str=" + map.nonce_str,
    "prepay_id=" + map.prepay_id,
    "timestamp=" + map.timestamp,
    "sign=" + sign,
    "sign_type=SHA256WithRSA",
  ].join("&");
  return rawRequest;
}

module.exports = {
  createRawRequest
};