// Review functions
const router = require('express').Router();
const { validate } = require('./validate');

const businesses = require('../data/businesses');
const reviews = require('../data/reviews');

exports.router = router;
exports.reviews = reviews;
exports.getAllBusinessReviews = getAllBusinessReviews;
exports.getReviewsOfBusiness = getReviewsOfBusiness;
exports.postReview = postReview;
exports.putReviewAtIndex = putReviewAtIndex;
exports.deleteReviewAtIndex = deleteReviewAtIndex;



function getAllBusinessReviews(req, res) {
  res.status(200).json(reviews);
}

function getReviewsOfBusiness(req, res){
  if(req.params.id.includes('-')){
    const { id } = req.params;
    const [key, index] = id.split('-'); // splitting the id to get key and index

    if(key in reviews) {
      if(index in reviews[key]) {
        res.json(reviews[key][index])
      }
      else {
        res.status(400).json({
          "err": "no review at given index"
        });
      }
    }
    else {
      res.status(400).json({
        "err": "business has no reviews"
      });
    }
  }
  else {
    const id = req.params.id;

    if (id in reviews){
      res.json(reviews[id]);
    }
    else{
      res.status(400).json({
          "err": "id out of range"
      });
    }
  }

}


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

function deleteReviewAtIndex(req, res) {
  const { id } = req.params;
  const [key, index] = id.split('-'); // splitting the id to get key and index

  if (!(key in reviews)) {
    res.status(404).send(`Review with key ${key} not found`);
    return;
  }

  if (!(index in reviews[key])) {
    res.status(404).send(`Review with index ${index} not found`);
    return;
  }

  reviews[key].splice(index, 1); // remove the review at the specified index
  res.json({
    "status": "deleted",
    "businessId": key,
    "index": index
  });


}
