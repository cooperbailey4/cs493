// Buisness functions
const router = require('express').Router();

const businesses = require('../data/businesses');
const { validate } = require('./validate');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
exports.businesses = businesses;
exports.getBusinesses = getBusinesses;
exports.getBusinessAtIndex = getBusinessAtIndex;
exports.postBusinesses = postBusinesses;
exports.putBusinessAtIndex = putBusinessAtIndex;
exports.deleteBusinessAtIndex = deleteBusinessAtIndex;

async function getBusinessesCount() {
  const [ results ] = await mysqlPool.query(
      "SELECT COUNT(*) AS count FROM lodgings"
  );
  return results[0].count;
}

async function getBusinessesPage(page) {
  const count = await getBusinessesCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM lodgings ORDER BY id LIMIT ?,?',
    [offset, pageSize]
  );
  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };

}

async function getBusinesses(req, res) {
    // res.status(200).json(businesses);
  try {
    // print("here")
    const businessesPage = await getBusinessesPage(parseInt(req.query.page) || 1);
    res.status(200).send(businessesPage);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: "Error fetching businesses list. Try again later."
  });
  }
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
