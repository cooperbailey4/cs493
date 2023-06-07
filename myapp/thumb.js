
const { thumbnailSetup } = require("./thumb_setup")
let channel;




async function main() {
    try {
        channel = await thumbnailSetup()
        console.log("channel running")
        channel.consume("thumb", (msg) => {
        if (msg) {
            getImageId(msg.content.toString())
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




