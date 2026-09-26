const crypto = require("crypto");
const fs = require("fs");
const config = require("./config");
const excludeFields = [
    "sign",
    "sign_type",
    "header",
    "refund_info",
    "openType",
    "raw_request",
    "biz_content",
];
const pmlib = require("./sign-util-lib")

function signRequestObject(requestObject) {
    let fields = [];
    let fieldMap = {};
    for (let key in requestObject) {
        if (excludeFields.indexOf(key) >= 0) {
            continue;
        }
        fields.push(key);
        fieldMap[key] = requestObject[key];
    }
    // the fields in "biz_content" must Participating signature
    if (requestObject.biz_content) {
        let biz = requestObject.biz_content;
        for (let key in biz) {
            if (excludeFields.indexOf(key) >= 0) {
                continue;
            }
            fields.push(key);
            fieldMap[key] = biz[key];
        }
    }
    // sort by ascii
    fields.sort();

    let signStrList = [];
    for (let i = 0; i < fields.length; i++) {
        let key = fields[i];
        signStrList.push(key + "=" + fieldMap[key]);
    }
    let signOriginStr = signStrList.join("&");
    return signString(signOriginStr, config.privateKey);
}

let signString = (text, privateKey) => {
    // Convert base64 private key to PEM format
    // The private key is base64-encoded DER format, need to convert to PEM
    let pemKey;
    if (privateKey.includes('-----BEGIN')) {
        // Already in PEM format
        pemKey = privateKey;
    } else {
        // Convert base64 to PEM format
        const base64Key = privateKey.replace(/\s/g, ''); // Remove any whitespace
        const formattedKey = base64Key.match(/.{1,64}/g).join('\n');
        pemKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    }
    
    // Parse the PEM key to RSAKey object using KEYUTIL
    const rsaKey = pmlib.rs.KEYUTIL.getKey(pemKey);
    
    const sha256withrsa = new pmlib.rs.KJUR.crypto.Signature({
        alg: "SHA256withRSAandMGF1",
    });
    sha256withrsa.init(rsaKey);
    sha256withrsa.updateString(text);
    const sign = pmlib.rs.hextob64(sha256withrsa.sign());
    return sign;
};

function createTimeStamp() {
    return Math.round(new Date() / 1000) + "";
}

function createNonceStr() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
}

module.exports = {
    signRequestObject,
    createTimeStamp,
    createNonceStr
};
