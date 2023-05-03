//const router = require('express').Router();

exports.validate = validate;

function validate(body, requiredKeys, optionalKeys) {
    for (let key in body) {
      if (requiredKeys.indexOf(key) == -1 && optionalKeys.indexOf(key) == -1) {
        return "unknown key within body: " + key;
      }
    }
    for (let key of requiredKeys) {
      if (!(key in body)) {
        return "missing key: " + key;
      }
    }
    return "ok";

  }
