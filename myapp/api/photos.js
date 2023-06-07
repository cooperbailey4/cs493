// Photos functions
const router = require('express').Router();

const mysqlPool = require('../lib/mysqlpool');
const { validateAgainstSchema, extractValidFields } = require('./validation');
const { getChannel, makeThumbnailFromId} = require('../thumb_setup');

const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

const fs = require('fs');


const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

exports.router = router;
exports.getPhotos = getPhotos;
exports.getPhotosAtIndex = getPhotosAtIndex;
exports.postPhotos = postPhotos;
exports.putPhotoAtIndex = putPhotoAtIndex;
exports.deletePhotosAtIndex = deletePhotosAtIndex;

const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  mimetype: {required: true},
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
    'SELECT userid, businessid, caption FROM photos ORDER BY id LIMIT ?,?',
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
    const [results] = await mysqlPool.query('SELECT image, mimetype FROM photos WHERE id = ?',
    id
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else{
      res.setHeader('Content-Type', results[0].mimetype); //image.mimetype
      res.send(results[0].image);
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};


async function insertNewPhoto(photo, req) {
  const validatedPhoto = extractValidFields(req.body, photoSchema);

  const [ result ] = await mysqlPool.query(
    'INSERT INTO photos (userid, businessid, image, mimetype, caption) VALUES (?, ?, BINARY(?), ?, ?)',
    [validatedPhoto.userid, validatedPhoto.businessid, photo, req.file.mimetype, validatedPhoto.caption]
);

  return result.insertId;

};

async function postPhotos(req, res) {

  try {
    if(req.file.mimetype in imageTypes)
      if (req.user == req.body.userid) {
        let image = fs.readFileSync(req.file.path);
        image = Buffer.from(image)
        const id = await insertNewPhoto(image, req);
        channel = getChannel()

        channel.sendToQueue('thumb', Buffer.from(id.toString()));
        makeThumbnailFromId(id)
        res.status(201).send({ id: id });
      }

      else {
        res.status(400).send({
          error: "user should be logged in"
        });
      }
    else {
      res.status(400).send({
        error: "only valid image types allowed"
      })
    }
  }
  catch (err) {
    console.log(err)
    res.status(500).send({
      error: "Error inserting photo into DB."
  });
  }
};



async function updatePhotoByID(photoId, req, image) {
  const validatedPhoto = extractValidFields(req.body, photoSchema);
  validatedPhoto["image"] = image;
  const result = await mysqlPool.query(
      'UPDATE photos SET ? WHERE id = ? AND userid = ?',
      [ validatedPhoto, photoId, req.user ]
  );

  return result[0].affectedRows > 0;
};

async function putPhotoAtIndex(req, res) {

  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      if(req.file.mimetype in imageTypes){
        const id = req.params.id;
        let image = fs.readFileSync(req.file.path);
        image = Buffer.from(image)
        const updateSuccessful = await updatePhotoByID(parseInt(id), req, image);
        if (updateSuccessful > 0) {
          makeThumbnailFromId(id)
          res.status(200).send({
          "status": "ok",
          "index": id
          });
        }
        else {
          res.status(400).send({
            error: "update not successful"
          });
        }
      }
      else {
        res.status(400).send({
          error: "only valid image types allowed"
        })
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




