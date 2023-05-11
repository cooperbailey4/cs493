// Review functions
const router = require('express').Router();
const { validate } = require('./validate');

// const businesses = require('../data/businesses');
// const reviews = require('../data/reviews');
const { validateAgainstSchema, extractValidFields } = require('./validation');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
// exports.reviews = reviews;
exports.getAllBusinessReviews = getAllBusinessReviews;
exports.getReviewAtIndex = getReviewAtIndex;
exports.postReview = postReview;
exports.putReviewAtIndex = putReviewAtIndex;
exports.deleteReviewAtIndex = deleteReviewAtIndex;

const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};

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


async function postReview(req, res) {

  try {
    const id = await insertNewReview(req.body);
    res.status(201).send({ id: id });
  }
  catch (err){
    console.log(err);
    res.status(500).send({
      error: "Error inserting review into DB."
  });
  }
};

async function insertNewReview(review) {
  const validatedReview = extractValidFields(review, reviewSchema);

  const [ result ] = await mysqlPool.query(
    'INSERT INTO reviews SET ?',
    validatedReview
  );

  return result.insertId;

}


async function updateReviewByID(reviewId, review) {
  const validatedReview = extractValidFields(review, reviewSchema);
  const [ result ] = await mysqlPool.query(
      'UPDATE reviews SET ? WHERE id = ?',
      [ validatedReview, reviewId ]
  );
  return result.affectedRows > 0;
}

async function putReviewAtIndex(req, res) {

  if (validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const id = req.params.id;
      const updateSuccessful = await updateReviewByID(parseInt(id), req.body);
      if (updateSuccessful > 0) {
        res.status(200).send({
        "status": "ok",
        "index": id
        });
      }
      else {
        next();
      }
    }
    catch (err) {
      console.log(err)
      res.status(500).send({
        error: "Unable to update review."
      });
    }
  }
  else {
    res.status(400).send({
      err: "Request body does not contain a valid review."
    });
  }
};


async function deleteReviewAtIndex(req, res) {
  const id = req.params.id;
  try {
    const [results] = await mysqlPool.query('DELETE FROM reviews WHERE id = ?',
    id
    );
    if (results.affectedRows == 0) {
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
