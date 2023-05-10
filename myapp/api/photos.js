// Photos functions
const router = require('express').Router();
const { validate } = require('./validate');

// const businesses = require('../data/businesses');
// const photos = require('../data/photos');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
// exports.photos = photos;
exports.getPhotos = getPhotos;
exports.getPhotosAtIndex = getPhotosAtIndex;
exports.postPhotos = postPhotos;
exports.putPhotosAtIndex = putPhotosAtIndex;
exports.deletePhotosAtIndex = deletePhotosAtIndex;

async function getPhotosCount() {
  const [ results ] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM photos'
  );
  return results[0].count;
}

async function getPhotosPage(page) {
  const count = await getPhotosCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos ORDER BY id LIMIT ?,?',
    [offset, pageSize]
  );
  return {
    photos: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };

}

async function getPhotos(req, res) {
  try {
    const photosPage = await getPhotosPage(parseInt(req.query.page) || 1);
    res.status(200).send(photosPage);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: "Error fetching photos list. Try again later."
  });
  }
}

async function getPhotosAtIndex(req, res) {
  const id = req.params.id;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM photos WHERE id = ?',
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

function postPhotos(req, res) {
  const validString = validate(req.body, ["businessId", "URL"], ["caption"]);

  id = req.body.businessId;
  delete req.body.businessId;

  if (validString != "ok") {
    res.status(400).json({"err ": validString});
  }
  else {
    if(id in businesses) {
      if (!(id in photos)){
        photos[id] = [];
      }
      photos[id].push(req.body);
      res.json({
          "status": "ok",
          "id": photos[id].length-1
      });
    }
    else {
      res.status(400).json({"err ": "no business for photos"})
    }

  }
}

function putPhotosAtIndex(req, res) {
  const validString = validate(req.body, ["businessId", "URL"], ["caption"]);
  business = req.body.businessId;
  const id = req.params.id;

  delete req.body.businessId;

  if (validString !== "ok") {
    res.status(400).json({ err: validString });
  }
  else {
    if (business in businesses) {
      photos[business][id] = req.body;
      res.json({
        "status": "ok",
        "businessId": business,
        "index": id
      });
    }
    else{
      res.json({
        "status": "error: no business matches businessId"
      });
    }
  }
}

async function deletePhotosAtIndex(req, res) {
  const id = req.params.id;
  try {
    const [results] = await mysqlPool.query('DELETE FROM photos WHERE id = ?',
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
