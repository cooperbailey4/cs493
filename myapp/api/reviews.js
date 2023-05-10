// Review functions
const router = require('express').Router();
const { validate } = require('./validate');

// const businesses = require('../data/businesses');
// const reviews = require('../data/reviews');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
// exports.reviews = reviews;
exports.getAllBusinessReviews = getAllBusinessReviews;
exports.getReviewAtIndex = getReviewAtIndex;
exports.postReview = postReview;
exports.putReviewAtIndex = putReviewAtIndex;
exports.deleteReviewAtIndex = deleteReviewAtIndex;

async function getReviewsCount() {
  const [ results ] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM reviews'
  );
  return results[0].count;
}

async function getReviewsPage(page) {
  const count = await getReviewsCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews ORDER BY id LIMIT ?,?',
    [offset, pageSize]
  );
  return {
    reviews: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };

}

async function getAllBusinessReviews(req, res) {
  try {
    const reviewsPage = await getReviewsPage(parseInt(req.query.page) || 1);
    res.status(200).send(reviewsPage);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: "Error fetching reviews list. Try again later."
  });
  }
}

async function getReviewAtIndex(req, res) {
  const id = req.params.id;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM reviews WHERE id = ?',
    id
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else{
      res.json(results[0]);
      return results[0];
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};


function postReview(req, res) {
  const validString = validate(req.body, [ "businessId", "userId", "stars", "dollars"], ["review"])

  id = req.body.businessId;
  delete req.body.businessId;

  if (validString != "ok") {
    res.status(400).json({"err ": validString});
  }
  else {
    if(id in businesses) {
      if (!(id in reviews)){
        reviews[id] = [];
      }
      reviews[id].push(req.body);
      res.json({
          "status": "ok",
          "id": reviews[id].length-1
      });
    }
    else {
      res.status(400).json({"err ": "no business to review"})
    }

  }

}

function putReviewAtIndex(req, res) {
  const validString = validate(req.body, ["businessId", "userId", "stars", "dollars"], ["review"]);
  business = req.body.businessId;
  const id = req.params.id;

  delete req.body.businessId;

  if (validString !== "ok") {
    res.status(400).json({ err: validString });
  }
  else {
    if (business in businesses) {
      reviews[business][id] = req.body;
      res.json({
        "status": "ok",
        "businessId": business,
        "id": id
      });
    }
    else{
      res.json({
        "status": "error: no business matches businessId"
      });
    }
  }
}

async function deleteReviewAtIndex(req, res) {
  const id = req.params.id;
  try {
    const [results] = await mysqlPool.query('DELETE FROM reviews WHERE id = ?',
    id
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else {
      res.json({
      "status": "deleted",
      "id": id});
      return results[0];
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
}
