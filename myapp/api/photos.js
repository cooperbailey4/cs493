// Photos functions
const router = require('express').Router();

// const businesses = require('../data/businesses');
// const photos = require('../data/photos');
const mysqlPool = require('../lib/mysqlpool');
const { validateAgainstSchema, extractValidFields } = require('./validation');

exports.router = router;
// exports.photos = photos;
exports.getPhotos = getPhotos;
exports.getPhotosAtIndex = getPhotosAtIndex;
exports.postPhotos = postPhotos;
exports.putPhotoAtIndex = putPhotoAtIndex;
exports.deletePhotosAtIndex = deletePhotosAtIndex;

const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

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




async function postPhotos(req, res) {

  try {
    if (req.user == req.body.userid) {
      const id = await insertNewPhoto(req.body);
      res.status(201).send({ id: id });
    }
    else {
      res.status(400).send({
        error: "user should be logged in"
      });
    }
  }
  catch {
    res.status(500).send({
      error: "Error inserting photo into DB."
  });
  }
};

async function insertNewPhoto(photo) {
  const validatedPhoto = extractValidFields(photo, photoSchema);

  const [ result ] = await mysqlPool.query(
    'INSERT INTO photos SET ?',
    validatedPhoto
  );

  return result.insertId;

};

async function updatePhotoByID(photoId, photo, user) {
  const validatedPhoto = extractValidFields(photo, photoSchema);
  const [ result ] = await mysqlPool.query(
      'UPDATE photos SET ? WHERE id = ? AND userid = ?',
      [ validatedPhoto, photoId, user ]
  );
  return result.affectedRows > 0;
};

async function putPhotoAtIndex(req, res) {

  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = req.params.id;
      const updateSuccessful = await updatePhotoByID(parseInt(id), req.body, req.user);
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
        error: "Unable to update photo."
      });
    }
  }
  else {
    res.status(400).send({
      err: "Request body does not contain a valid photo."
    });
  }
};


async function deletePhotosAtIndex(req, res) {
  const id = req.params.id;
  try {
    const [results] = await mysqlPool.query('DELETE FROM photos WHERE id = ? AND userid = ?',
    [id, req.user]
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
};
