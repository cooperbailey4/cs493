// Buisness functions
const router = require('express').Router();

const { validateAgainstSchema, extractValidFields } = require('./validation');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
exports.getBusinesses = getBusinesses;
exports.getBusinessAtIndex = getBusinessAtIndex;
exports.postBusinesses = postBusinesses;
exports.putBusinessAtIndex = putBusinessAtIndex;
exports.deleteBusinessAtIndex = deleteBusinessAtIndex;

const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  street: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: false },
  website: { required: false },
  email: { required: false }
};

async function getBusinessesCount() {
  const [ results ] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM businesses'
  );
  return results[0].count;
}

async function getBusinessesPage(page) {
  const count = await getBusinessesCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses ORDER BY id LIMIT ?,?',
    [offset, pageSize]
  );
  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };

}

async function getBusinesses(req, res) {
  try {
    const businessesPage = await getBusinessesPage(parseInt(req.query.page) || 1);
    res.status(200).send(businessesPage);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: "Error fetching businesses list. Try again later."
  });
  }
};

async function getBusinessAtIndex(req, res) {
  const id = req.params.id;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM businesses WHERE id = ?',
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


async function postBusinesses(req, res) {

  try {
    if (req.user == req.body.ownerid) {
      const id = await insertNewBusiness(req.body);
      res.status(201).send({ id: id });
    }
    else {
      res.status(400).send({
        error: "owner should be logged in"
      });
    }
  }
  catch {
    res.status(500).send({
      error: "Error inserting business into DB."
  });
  }
};

async function insertNewBusiness(business) {
  const validatedBusiness = extractValidFields(business, businessSchema);

  const [ result ] = await mysqlPool.query(
    'INSERT INTO businesses SET ?',
    validatedBusiness
  );

  return result.insertId;

};

async function updateBusinessByID(businessId, business, user) {
  const validatedBusiness = extractValidFields(business, businessSchema);
  const [ result ] = await mysqlPool.query(
      'UPDATE businesses SET ? WHERE id = ? AND ownerid = ?',
      [ validatedBusiness, businessId, user ]
  );
  return result.affectedRows > 0;
};

async function putBusinessAtIndex(req, res) {

  if (validateAgainstSchema(req.body, businessSchema)) {
    try {
      const id = req.params.id;
      const updateSuccessful = await updateBusinessByID(parseInt(req.params.id), req.body, req.user);
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
        error: "Unable to update business."
      });
    }
  }
  else {
    res.status(400).send({
      err: "Request body does not contain a valid Business."
    });
  }
};

async function deleteBusinessAtIndex(req, res) {
  const id = req.params.id;

  try {
    const [results] = await mysqlPool.query('DELETE FROM businesses WHERE id = ? AND ownerid = ?',
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
