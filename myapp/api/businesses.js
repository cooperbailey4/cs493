// Buisness functions
const router = require('express').Router();

// const businesses = require('../data/businesses_new');
const { validate } = require('./validate');
const mysqlPool = require('../lib/mysqlpool');

exports.router = router;
// exports.businesses = businesses;
exports.getBusinesses = getBusinesses;
exports.getBusinessAtIndex = getBusinessAtIndex;
exports.postBusinesses = postBusinesses;
exports.putBusinessAtIndex = putBusinessAtIndex;
exports.deleteBusinessAtIndex = deleteBusinessAtIndex;

// const businessSchema = {
//   ownerid: { required: true },
//   name: { required: true },
//   address: { required: true },
//   city: { required: true },
//   state: { required: true },
//   zip: { required: true },
//   phone: { required: true },
//   category: { required: true },
//   subcategory: { required: true },
//   website: { required: false },
//   email: { required: false }
// };

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
  // const validString = validate(req.body, ["id", "ownerid", "business", "address", "city", "state", "ZIP", "phone", "category", "subcategory"], ["website", "email"])

  try {
    // if (validString == "ok")
    // businesses[nextKey] = req.body;
    // res.json({
    //     "status": "ok",
    //     "id": nextKey++
    // });
    const id = await insertNewBusiness(req.body);
    res.status(201).send({ id: id });
  }
  catch {
    res.status(500).send({
      error: "Error inserting lodging into DB."
  });
  }
};

// async function insertNewBusiness(business) {
//   const validatedBusiness = extractValidFields(business, businessSchema);

//   const [ result ] = await mysqlPool.query(
//     'INSERT INTO lodgings SET ?',
//     validatedBusiness
//   );

//   return result.insertId;

// }



function putBusinessAtIndex(req, res) {
  const validString = validate(req.body, ["id", "ownerid", "business", "address", "city", "state", "ZIP", "phone", "category", "subcategory"], ["website", "email"])

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

async function deleteBusinessAtIndex(req, res) {
  const id = req.params.id;
  try {
    const [results] = await mysqlPool.query('DELETE FROM businesses WHERE id = ?',
    id
    );
    if (results.length == 0) {
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
}
