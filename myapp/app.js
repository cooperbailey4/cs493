const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 3000

app.set('json spaces', 4)
const jsonParser = bodyParser.json();
const businesses = {
  "0": {"business": "computersNstuff", "address": "123 lane", "city": "undisclosed", "state": "undisclosed", "ZIP": "12345", "phone": "541 000 0000", "category": "Restaurant"},
  "1": {"business": "Incipisphere", "address": "124 lane", "city": "undisclosed", "state": "undisclosed", "ZIP": "12346", "phone": "541 000 0001", "category": "Orphanage"},
  "2": {"business": "laminitis", "address": "125 lane", "city": "undisclosed", "state": "undisclosed", "ZIP": "12347", "phone": "541 000 0002", "category": "Restaurant"},
  "3": {"business": "McDonalds", "address": "126 lane", "city": "undisclosed", "state": "undisclosed", "ZIP": "12348", "phone": "541 000 0003", "category": "Real Estate"}
};
const reviews = {
  "0": [{ "stars": "4", "dollars" : "2", "review": "Great business", "userId": "1"}],
  "1": [{ "stars": "4", "dollars" : "2", "review": "Great business", "userId": "1"}, { "Stars": "4", "Dollars" : "2$", "review": "Great business", "userId": "2"}],
  "2": [{ "stars": "4", "dollars" : "2", "review": "Great business", "userId": "2"}]

}

const photos = {
  "0": [{ "URL":"www.thisphotoisnotreal.com", "caption":"this is a placeholder"}],
  "1": [{ "URL":"www.inciphispherephoto.com", "caption":"this is a placeholder"}, { "URL":"www.inciphispherephoto.com", "caption":"this is a placeholder"}],
  "2": [{ "URL":"www.laminitis.com", "caption":"this is a placeholder"}]

}

let nextKey = 4;

// helper functions

function validate(body, requiredKeys, optionalKeys) {
  for (let key in body) {
    if (requiredKeys.indexOf(key) == -1 && optionalKeys.indexOf(key) == -1) {
      return "unknown key within body: " + key;
    }
  }
  for (let key of requiredKeys) {
    if (!(key in body)) {
      return "missing key: " + key;
    }
  }
  return "ok";

}

// root function

app.get("/", (req, res) => {
  res.send("Hello World!");
})

// Buisness functions

function getBusinesses(req, res) {
  res.status(200).json(businesses);
}

function getBusinessAtIndex(req, res) {
  const id = req.params.id;

  if (id in businesses)
    res.json(businesses[id]);
  else
    res.status(400).json({
        "err": "id not available"
    });
};

function postBusinesses(req, res) {
  const validString = validate(req.body, ["business", "address", "city", "state", "ZIP", "phone", "category"], ["website", "email"])

  if (validString != "ok") {
    res.status(400).json({"err": validString});
  }
  else {
    businesses[nextKey] = req.body;
    res.json({
        "status": "ok",
        "id": nextKey++
    });
  }
};

function putBusinessAtIndex(req, res) {
  const validString = validate(req.body, ["business", "address", "city", "state", "ZIP", "phone", "category"], ["website", "email"])

  const id = req.params.id;

  if (validString != "ok") {
    res.status(400).json({"err": validString});
  }
  else{
    if (id in businesses) {
    businesses[id] = req.body;
    res.json({
      "status": "ok",
      "id": id
    });
    }
    else {
      businesses[id] = req.body;
      if (id >= nextKey){
        nextKey = id + 1;
      }
      res.json({
        "status": "ok",
        "id": id
      });
    }
  }
};

function deleteBusinessAtIndex(req, res) {
  const id = req.params.id;

  delete businesses[id];
  res.json({
    "status": "deleted",
    "id": id
  });
}

// Review functions

function getAllBusinessReviews(req, res) {
  res.status(200).json(reviews);
}

function getReviewsOfBusiness(req, res){
  if(req.params.id.includes('-')){
    const { id } = req.params;
    const [key, index] = id.split('-'); // splitting the id to get key and index

    if(key in reviews) {
      if(index in reviews[key]) {
        res.json(reviews[key][index])
      }
      else {
        res.status(400).json({
          "err": "no review at given index"
        });
      }
    }
    else {
      res.status(400).json({
        "err": "buisness has no reviews"
      });
    }
  }
  else {
    const id = req.params.id;

    if (id in reviews){
      res.json(reviews[id]);
    }
    else{
      res.status(400).json({
          "err": "id out of range"
      });
    }
  }

}


function postReview(req, res) {
  const validString = validate(req.body, [ "businessId", "userId", "stars", "dollars"], ["review"])

  id = req.body.businessId;
  delete req.body.businessId;

  if (validString != "ok") {
    res.status(400).json({"err ": validString});
  }
  else {
    if(id in businesses) {
      if (!(id in reviews)){
        reviews[id] = [];
      }
      reviews[id].push(req.body);
      res.json({
          "status": "ok",
          "id": reviews[id].length-1
      });
    }
    else {
      res.status(400).json({"err ": "no business to review"})
    }

  }

}

function putReviewAtIndex(req, res) {
  const validString = validate(req.body, ["businessId", "userId", "stars", "dollars"], ["review"]);
  business = req.body.businessId;
  const id = req.params.id;

  delete req.body.businessId;

  if (validString !== "ok") {
    res.status(400).json({ err: validString });
  }
  else {
    if (business in businesses) {
      reviews[business][id] = req.body;
      res.json({
        "status": "ok",
        "businessId": business,
        "id": id
      });
    }
    else{
      res.json({
        "status": "error: no business matches businessId"
      });
    }
  }
}

function deleteReviewAtIndex(req, res) {
  const { id } = req.params;
  const [key, index] = id.split('-'); // splitting the id to get key and index

  if (!(key in reviews)) {
    res.status(404).send(`Review with key ${key} not found`);
    return;
  }

  if (!(index in reviews[key])) {
    res.status(404).send(`Review with index ${index} not found`);
    return;
  }

  reviews[key].splice(index, 1); // remove the review at the specified index
  res.json({
    "status": "deleted",
    "businessId": key,
    "index": index
  });


}

// Photos functions

function getPhotos(req, res) {
  res.status(200).json(photos);
}

function getPhotosOfBuisnesses(req, res) {
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
        "err": "buisness has no photos"
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
app.get("/photos/:id", getPhotosOfBuisnesses)
app.post("/photos", jsonParser, postPhotos)
app.put("/photos/:id", jsonParser, putPhotosAtIndex)
app.delete("/photos/:id", jsonParser, deletePhotosAtIndex)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
