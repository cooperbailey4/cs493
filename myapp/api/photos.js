// Photos functions
const router = require('express').Router();
const { validate } = require('./validate');

const businesses = require('../data/businesses');
const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;
exports.getPhotos = getPhotos;
exports.getPhotosOfBusinesses = getPhotosOfBusinesses;
exports.postPhotos = postPhotos;
exports.putPhotosAtIndex = putPhotosAtIndex;
exports.deletePhotosAtIndex = deletePhotosAtIndex;


function getPhotos(req, res) {
    res.status(200).json(photos);
}

function getPhotosOfBusinesses(req, res) {
  if(req.params.id.includes('-')){
    const { id } = req.params;
    const [key, index] = id.split('-'); // splitting the id to get key and index

    if(key in photos) {
      if(index in photos[key]) {
        res.json(photos[key][index])
      }
      else {
        res.status(400).json({
          "err": "no photos at given index"
        });
      }
    }
    else {
      res.status(400).json({
        "err": "business has no photos"
      });
    }
  }
  else {
    const id = req.params.id;

    if (id in photos){
      res.json(photos[id]);
    }
    else{
      res.status(400).json({
          "err": "index out of range"
      });
    }
  }
}

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

function deletePhotosAtIndex(req, res) {
  const { id } = req.params;
  const [key, index] = id.split('-'); // splitting the id to get key and index

  if (!(key in photos)) {
    res.status(404).send(`photos with key ${key} not found`);
    return;
  }

  if (!(index in photos[key])) {
    res.status(404).send(`photos with index ${index} not found`);
    return;
  }

  photos[key].splice(index, 1); // remove the review at the specified index
  res.json({
    "status": "deleted",
    "businessId": key,
    "index": index
  });

}
