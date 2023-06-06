const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const amqp = require('amqplib');

const sizeOf = require('image-size');

const { thumbnailSetup } = require("./api/photos")
let channel;

function getDownloadStreamById(id) {
    const imageData = [];
    downloadStream.on('data', (data) => {
      imageData.push(data);
    });

}

//const message = 'The quick brown fox jumped over the lazy dog';

// message.split(' ').forEach((word) => {
//     channel.sendToQueue('thumbs', Buffer.from(word));
// });
async function main() {
    try {
        channel = await thumbnailSetup()
        console.log("channel running")
        channel.consume("thumb", (msg) => {
        if (msg) {
            console.log(msg.content.toString());
        }
            channel.ack(msg);
        });
    }
    catch (err) {
        console.error(err);
    }
}

main();

// setTimeout(() => { connection.close(); }, 500);




