const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 3000

app.set('json spaces', 4)
const jsonParser = bodyParser.json();

const { getBusinesses, getBusinessAtIndex, postBusinesses, putBusinessAtIndex, deleteBusinessAtIndex } = require('./api/businesses');
const { getAllBusinessReviews, getReviewsOfBusiness, postReview, putReviewAtIndex, deleteReviewAtIndex } = require('./api/reviews');
const { getPhotos, getPhotosOfBusinesses, postPhotos, putPhotosAtIndex, deletePhotosAtIndex } = require('./api/photos');

let nextKey = 4;

// root function

app.get("/", (req, res) => {
  res.send("Hello World!\n If you don't know what to do,your not supposed to be here yet");
})

app.get("/businesses", getBusinesses)
app.get("/businesses/:id", getBusinessAtIndex)
app.post("/businesses", jsonParser, postBusinesses)
app.put("/businesses/:id", jsonParser, putBusinessAtIndex)
app.delete("/businesses/:id", jsonParser, deleteBusinessAtIndex)

app.get("/reviews", getAllBusinessReviews)
app.get("/reviews/:id", getReviewsOfBusiness)
app.post("/reviews", jsonParser, postReview)
app.put("/reviews/:id", jsonParser, putReviewAtIndex)
app.delete("/reviews/:id", jsonParser, deleteReviewAtIndex)

app.get("/photos", getPhotos)
app.get("/photos/:id", getPhotosOfBusinesses)
app.post("/photos", jsonParser, postPhotos)
app.put("/photos/:id", jsonParser, putPhotosAtIndex)
app.delete("/photos/:id", jsonParser, deletePhotosAtIndex)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
