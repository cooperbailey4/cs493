const router = require('express').Router();

const { validateAgainstSchema, extractValidFields } = require('./validation');
const { generateAuthToken } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlpool');
const bcrypt = require('bcryptjs');

exports.router = router;
exports.getUsers = getUsers;
exports.getUserByID = getUserByID;
exports.getBusinessesOfUser = getBusinessesOfUser;
exports.getReviewsOfUser = getReviewsOfUser;
exports.getPhotosOfUser = getPhotosOfUser;
exports.postNewUser = postNewUser;
exports.putUserAtIndex = putUserAtIndex;
exports.deleteUserAtIndex = deleteUserAtIndex;

exports.loginUser = loginUser;

const userSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true }
};


async function getUsersCount() {
  const [ results ] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM users'
  );
  return results[0].count;
}

async function getUsersPage(page, req) {
  const count = await getUsersCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const includePassword = req.params.includePassword === 'true'; // Assuming the includePassword query parameter is a string representation of boolean


  let query = 'SELECT ';
  if (includePassword) {
    query += '*';
  }
  else {
    query += 'userid, name, email'; // Exclude password field
  }
  query += ' FROM users ORDER BY userid LIMIT ?,?';

  const [ results ] = await mysqlPool.query(
    query, [offset, pageSize]
  );
  return {
    users: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };

}

async function getUsers(req, res) {
  try {
    const usersPage = await getUsersPage(parseInt(req.query.page) || 1, req);
    res.status(200).send(usersPage);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: "Error fetching users list. Try again later."
  });
  }
};

async function getUserByID(req, res) {
  const id = req.params.userid;
  const includePassword = req.params.includePassword === 'true'; // Assuming the includePassword query parameter is a string representation of boolean
  if (req.user !== req.params.userID) {
    res.status(403).json({
      error: 'Unauthorized to access the specified resource'
    });
  }
  else {
    try {
      let query = 'SELECT ';
      if (includePassword) {
        query += '*';
      }
      else {
        query += 'userid, name, email'; // Exclude password field
      }
      query += ' FROM users WHERE userid = ?';

      const [results] = await mysqlPool.query(query, [id]);
      if (results.length == 0) {
        res.status(404).json({ "Error": "id does not exist" });
      }
      else {
        res.json(results[0]);
        return results[0];
      }
    }
    catch (err) {
      res.status(400).json({
        "err": err
      });
    }
  }
}



async function getBusinessesOfUser(req, res) {
  const userid = req.params.userid;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM businesses WHERE ownerId = ?',
    userid
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else{
      res.json(results);
      return results;
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};


async function getReviewsOfUser(req, res) {
  const userid = req.params.userid;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM reviews WHERE userid = ?',
    userid
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else{
      res.json(results);
      return results;
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};

async function getPhotosOfUser(req, res) {
  const userid = req.params.userid;

  try {
    const [results] = await mysqlPool.query('SELECT * FROM photos WHERE userid = ?',
    userid
    );
    if (results.length == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else{
      res.json(results);
      return results;
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};

async function insertNewUser(user) {
  const validatedUser = extractValidFields(user, userSchema);
  const passwordHash = await bcrypt.hash(user.password, 8);

  validatedUser.password = passwordHash; // Add hashed password to validatedUser

  const [ result ] = await mysqlPool.query(
    'INSERT INTO users SET ?',
    validatedUser
  );

  return result.insertId;

};

async function postNewUser(req, res) {

  try {
    const id = await insertNewUser(req.body);
    res.status(201).send({ id: id });
  }
  catch {
    res.status(500).send({
      error: "Error inserting user into DB."
  });
  }
};

async function updateUsersByID(userid, user) {
  const validatedUsers = extractValidFields(user, userSchema);
  const passwordHash = await bcrypt.hash(user.password, 8);

  validatedUser.password = passwordHash; // Add hashed password to validatedUser

  const [ result ] = await mysqlPool.query(
      'UPDATE users SET ? WHERE userid = ?',
      [ validatedUsers, userid ]
  );
  return result.affectedRows > 0;
};

async function putUserAtIndex(req, res) {

  if (validateAgainstSchema(req.body, userSchema)) {
    try {
      const id = req.params.userid;
      const updateSuccessful = await updateUsersByID(parseInt(id), req.body);
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
        error: "Unable to update users."
      });
    }
  }
  else {
    res.status(400).send({
      err: "Request body does not contain a valid user."
    });
  }
};

async function deleteUserAtIndex(req, res) {
  const userid = req.params.userid;
  try {
    const [results] = await mysqlPool.query('DELETE FROM users WHERE userid = ?',
    userid
    );
    if (results.affectedRows == 0) {
      res.status(404).json({"Error": "id does not exist"});
    }
    else {
      res.json({
      "status": "deleted",
      "id": userid
      });
      return results[0];
    }
  }
  catch(err) {
    res.status(400).json({
        "err": err
    });
  }
};

// Validation

async function validateUser(id, password) {
  let user;
  try {
    let query = 'SELECT * FROM users WHERE userid = ?';

    const [results] = await mysqlPool.query(query, [id]);
    if (results.length == 0) {
      res.status(404).json({ "Error": "id does not exist" });
    }
    else {
      user = results[0];
    }
  }
  catch (err) {
    console.log(err)
  }
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
}

// app.get("/users/:userid", getUserByID)

async function loginUser(req, res) {
  if (req.body && req.body.userid && req.body.password) {
    try {
      const authenticated = await validateUser(req.body.userid, req.body.password);

      if (authenticated) {
        const token = generateAuthToken(req.body.userID);
        res.status(200).send({ token: token });      }
      else {
        res.status(401).send({
          error: "Invalid authentication credentials"
        });
      }
    }
    catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error logging in. Try again later." });
    }
  }
  else {
    res.status(400).json({ error: "Request body needs user ID and password." });
  }
}


