const https = require("http");
const config = require("./config");
var request = require("request");

function applyFabricToken() {
  return new Promise((resolve, reject) => {
    var options = {
      method: "POST",
      url: config.baseUrl + "/payment/v1/token",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
      },
      body: JSON.stringify({
        appSecret: config.appSecret,
      }),
      timeout: 15000,
    };
    request(options, function (error, response) {
      if (error) return reject(error);
      if (!response || response.statusCode !== 200) {
        return reject(new Error('Could not obtain Telebirr fabric token'));
      }
      try {
        resolve(JSON.parse(response.body));
      } catch (parseError) {
        reject(new Error('Invalid Telebirr token response'));
      }
    });
  });
}

module.exports = applyFabricToken;
