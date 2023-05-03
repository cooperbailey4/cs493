// Buisness functions
const router = require('express').Router();

const businesses = require('../data/businesses');
const { validate } = require('./validate');

exports.router = router;
exports.businesses = businesses;
exports.getBusinesses = getBusinesses;
exports.getBusinessAtIndex = getBusinessAtIndex;
exports.postBusinesses = postBusinesses;
exports.putBusinessAtIndex = putBusinessAtIndex;
exports.deleteBusinessAtIndex = deleteBusinessAtIndex;


function getBusinesses(req, res) {
    res.status(200).json(businesses);
};

function getBusinessAtIndex(req, res) {
  const id = req.params.id;

  if (id in businesses)
    res.json(businesses[id]);
  else
    res.status(400).json({
        "err": "id not available"
    });
};

function postBusinesses(req, res) {
  const validString = validate(req.body, ["business", "address", "city", "state", "ZIP", "phone", "category"], ["website", "email"])

  if (validString != "ok") {
    res.status(400).json({"err": validString});
  }
  else {
    businesses[nextKey] = req.body;
    res.json({
        "status": "ok",
        "id": nextKey++
    });
  }
};

function putBusinessAtIndex(req, res) {
  const validString = validate(req.body, ["business", "address", "city", "state", "ZIP", "phone", "category"], ["website", "email"])

  const id = req.params.id;

  if (validString != "ok") {
    res.status(400).json({"err": validString});
  }
  else{
    if (id in businesses) {
    businesses[id] = req.body;
    res.json({
      "status": "ok",
      "id": id
    });
    }
    else {
      businesses[id] = req.body;
      if (id >= nextKey){
        nextKey = id + 1;
      }
      res.json({
        "status": "ok",
        "id": id
      });
    }
  }
};

function deleteBusinessAtIndex(req, res) {
  const id = req.params.id;

  delete businesses[id];
  res.json({
    "status": "deleted",
    "id": id
  });
}
