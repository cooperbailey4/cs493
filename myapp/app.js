const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 3000

app.set('json spaces', 4)
const jsonParser = bodyParser.json();

const multer = require('multer');
const upload = multer({ dest: `${__dirname}/uploads` });


const { getBusinesses, getBusinessAtIndex,  postBusinesses, putBusinessAtIndex, deleteBusinessAtIndex } = require('./api/businesses');
const { getAllBusinessReviews, getReviewAtIndex, postReview, putReviewAtIndex, deleteReviewAtIndex } = require('./api/reviews');
const { getPhotos, getPhotosAtIndex,  postPhotos, putPhotoAtIndex, deletePhotosAtIndex } = require('./api/photos');
const { getUsers, getUserByID, getBusinessesOfUser, getReviewsOfUser, getPhotosOfUser, postNewUser, putUserAtIndex, deleteUserAtIndex, loginUser} = require('./api/users');
const { requireAuthentication } = require('./lib/auth');


// root function

app.get("/", (req, res) => {
  res.send("Hello World! \nIf you don't know what to do, your not supposed to be here yet\n");
})

// Application End-Points

app.get("/businesses", getBusinesses)
app.get("/businesses/:id", getBusinessAtIndex)
app.post("/businesses", jsonParser, requireAuthentication, postBusinesses)
app.put("/businesses/:id", jsonParser, requireAuthentication, putBusinessAtIndex)
app.delete("/businesses/:id", jsonParser, requireAuthentication, deleteBusinessAtIndex)

app.get("/reviews", getAllBusinessReviews)
app.get("/reviews/:id", getReviewAtIndex)
app.post("/reviews", jsonParser, requireAuthentication, postReview)
app.put("/reviews/:id", jsonParser, requireAuthentication, putReviewAtIndex)
app.delete("/reviews/:id", jsonParser, requireAuthentication, deleteReviewAtIndex)

app.get("/photos", getPhotos)
app.get("/photos/:id", getPhotosAtIndex)
app.post("/photos", upload.single('image'), requireAuthentication, postPhotos)
app.put("/photos/:id", upload.single('image'), requireAuthentication, putPhotoAtIndex)
app.delete("/photos/:id", jsonParser, requireAuthentication, deletePhotosAtIndex)

app.get("/users", getUsers)
app.get("/users/:userid", requireAuthentication, getUserByID)
app.get("/users/:userid/:includePassword", requireAuthentication, getUserByID)
app.get("/users/:userid/businesses", requireAuthentication, getBusinessesOfUser)
app.get("/users/:userid/reviews", requireAuthentication, getReviewsOfUser)
app.get("/users/:userid/photos", requireAuthentication, getPhotosOfUser)
app.post("/users", jsonParser, postNewUser)
app.put("/users/:userid", jsonParser, requireAuthentication, putUserAtIndex)
app.delete("/users/:userid", jsonParser, requireAuthentication, deleteUserAtIndex)

app.post("/users/login", jsonParser, loginUser)

// app.get("/thumbnails", getThumbnails)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
