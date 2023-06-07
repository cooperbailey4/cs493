const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const mysqlPool = require('./lib/mysqlpool');
const sizeOf = require('image-size');
const sharp = require('sharp');

exports.thumbnailSetup = thumbnailSetup;
exports.thumb = thumb;
exports.getChannel = getChannel;
exports.makeThumbnailFromId = makeThumbnailFromId;
exports.getThumbnailById = getThumbnailById;
// Thumbnails code
let channel;

async function thumbnailSetup() {
    try {
      const connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      await channel.assertQueue('thumb');
      return channel;
    }
    catch (err) {
        console.log(err);
    }
}

async function thumb() {
    channel = await thumbnailSetup()
    return channel
}



async function makeThumbnailFromId(id){
    try {
        const [results] = await mysqlPool.query('SELECT image, mimetype FROM photos WHERE id = ?',
            id
        );
        let thumb = sharp(results[0].image)
        resized_thumb = thumb.resize(100, 100)
        const buf = await resized_thumb.toBuffer()


        await mysqlPool.query(
            'INSERT INTO thumbnails (id, thumbnail, mimetype) VALUES (?, ?, ?)',
            [id, buf, results[0].mimetype]
        );

    }
    catch (err) {
        console.log(err);
    }
}

async function getThumbnailById(req, res) {
    const id = req.params.id;

    try {
      const [results] = await mysqlPool.query('SELECT thumbnail, mimetype FROM thumbnails WHERE id = ?',
      id
      );
      if (results.length == 0) {
        res.status(404).json({"Error": "id does not exist"});
      }
      else{
        res.setHeader('Content-Type', results[0].mimetype); //image.mimetype
        res.send(results[0].thumbnail);
      }
    }
    catch(err) {
      res.status(400).json({
          "err": err
      });
    }
  };

function getChannel() {
    return channel;
}
