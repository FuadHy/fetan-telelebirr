const applyFabricToken = require("./fabric");
const tools = require("./tools"); // Import the tools module
const config = require("./config");
const https = require("http");
var request = require("request");

// Manual input - edit these values directly in the code


// Main function to create an order with manual input
async function createOrder(amount, title, circle_id) {
  
  console.log(`Title: ${title} Amount: ${amount}`);
  
  let applyFabricTokenResult = await applyFabricToken();
  let fabricToken = applyFabricTokenResult.token;
  console.log("fabricToken =", fabricToken);
  
  let createOrderResult = await requestCreateOrder(
    fabricToken,
    title,
    amount,
    circle_id
  );
  console.log('baba***************', createOrderResult);
  let prepayId = createOrderResult.biz_content.prepay_id;
  console.log("Prepay ID:", prepayId);
  return prepayId;
}

async function requestCreateOrder(fabricToken, title, amount, circle_id) {
  return new Promise((resolve) => {
    let reqObject = createRequestObject(title, amount, circle_id);
    console.log('reqObject***************', reqObject);
    var options = {
      method: "POST",
      url: config.baseUrl + "/payment/v1/merchant/preOrder",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        Authorization: fabricToken,
      },
      rejectUnauthorized: false, //add when working with https sites
      requestCert: false, //add when working with https sites
      agent: false, //add when working with https sites
      body: JSON.stringify(reqObject),
    };

    request(options, function (error, response) {
      console.log("Error:", error);
      if (error) throw new Error(error);
      let result = JSON.parse(response.body);
      resolve(result);
    });
  });
}
  
function createRequestObject(title, amount, circle_id) {
  let req = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };

  // callback_url=SERVER_URL + "/api/contribute/activate-circle/new/" + str(circle_id),
  //               tx_ref="",
  //               return_url=SERVER_URL + "/api/contribute/activate-circle/new/" + str(circle_id)
            // )
  
  let biz = {
    notify_url: 'https://api.fetanequb.com' + "/api/contribute/activate-circle/new/" + circle_id, //When the payment is completed, the payment callback result is sent to this URL.
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    merch_order_id: createMerchantOrderId(),
    trade_type: "Checkout",
    title: title,
    total_amount: amount,
    trans_currency: "ETB",
    timeout_express: "120m",
    business_type: "BuyGoods",
    payee_identifier: config.merchantCode,
    payee_identifier_type: "04",
    payee_type: "5000",
    redirect_url: 'https://api.fetanequb.com' + "/api/contribute/activate-circle/new/" + circle_id,
    callback_info: "From web",
  };
  
  req.biz_content = biz;
  req.sign = tools.signRequestObject(req); // tools code you can download form demo
  console.log('req***************', req, biz);
  req.sign_type = "SHA256WithRSA";
  console.log('req***************', req);
  return req;
}

function createMerchantOrderId() {
  return new Date().getTime() + "";
}

// Run the script if called directly
if (require.main === module) {
  createOrder()
    .then((prepayId) => {
      console.log("Order created successfully. Prepay ID:", prepayId);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error creating order:", error);
      process.exit(1);
    });
}

// Export for use in other modules if needed
module.exports = createOrder;
module.exports.requestCreateOrder = requestCreateOrder;