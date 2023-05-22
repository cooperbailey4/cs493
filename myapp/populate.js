const reviews = require('./data/reviews_new.json');
const businesses = require('./data/businesses_new.json');
const photos = require('./data/photos_new.json');
const users = require('./data/users.json');
const mysqlPool = require('./lib/mysqlpool');
const bcrypt = require('bcryptjs');



async function populate() {

    // await mysqlPool.query("DELETE FROM businesses");
    await mysqlPool.query("DROP TABLE IF EXISTS businesses");
    await mysqlPool.query('CREATE TABLE businesses (id MEDIUMINT NOT NULL AUTO_INCREMENT, ownerid MEDIUMINT NOT NULL, name VARCHAR(255) NOT NULL, street VARCHAR(255) NOT NULL, city VARCHAR(255) NOT NULL, state VARCHAR(255) NOT NULL, zip CHAR(5) NOT NULL, phone VARCHAR(12) NOT NULL, category VARCHAR(255) NOT NULL, website VARCHAR(255), email VARCHAR(255), PRIMARY KEY(id))');
    for (let i = 0; i < businesses.length; i++) {
        const businessFields = businesses[i];
        console.log(businessFields);
        x = await mysqlPool.query(
            'INSERT INTO businesses ( ownerid, name, street, city, state, zip, phone, category, website, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            Object.values(businessFields)
        );
        console.log(x)
    }
    await mysqlPool.query("DROP TABLE IF EXISTS reviews");
    await mysqlPool.query('CREATE TABLE reviews (id MEDIUMINT NOT NULL AUTO_INCREMENT, userid MEDIUMINT NOT NULL, businessid MEDIUMINT NOT NULL, dollars MEDIUMINT NOT NULL, stars MEDIUMINT NOT NULL, review TEXT, PRIMARY KEY(id))');
    for (let i = 0; i < reviews.length; i++) {
        const reviewFields = reviews[i];
        console.log(reviewFields);
        x = await mysqlPool.query(
            'INSERT INTO reviews (userid, businessid, dollars, stars, review) VALUES (?, ?, ?, ?, ?)',
            Object.values(reviewFields)
        );
        console.log(x)
    }
    await mysqlPool.query("DROP TABLE IF EXISTS photos");
    await mysqlPool.query('CREATE TABLE photos (id MEDIUMINT NOT NULL AUTO_INCREMENT, userid MEDIUMINT NOT NULL, businessid MEDIUMINT NOT NULL, caption TEXT, PRIMARY KEY(id))');
    for (let i = 0; i < photos.length; i++) {
        const photoFields = photos[i];
        console.log(photoFields);
        x = await mysqlPool.query(
            'INSERT INTO photos (userid, businessid, caption) VALUES (?, ?, ?)',
            Object.values(photoFields)
        );
        console.log(x)
    }
    await mysqlPool.query("DROP TABLE IF EXISTS users");
    await mysqlPool.query('CREATE TABLE users (userid MEDIUMINT NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, email VARCHAR(255), password VARCHAR(255) NOT NULL, PRIMARY KEY(userid))');
    for (let i = 0; i < users.length; i++) {
        const userFields = users[i];
        const passwordHash = await bcrypt.hash(users[i].password, 8);

        userFields.password = passwordHash; // Add hashed password to validatedUser

        console.log(userFields);
        x = await mysqlPool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            Object.values(userFields)
        );
        console.log(x)
    }
    mysqlPool.end();
};
populate();


// 'INSERT INTO businesses (id, ownerid, name, street, city, state, zip, phone, category, website, email) VALUES (?)',
// INSERT INTO businesses (id, ownerid, name, street, city, state, zip, phone, category, website, email) VALUES (`id` = 0, `ownerid` = 0, `name` = 'Block 15', `street` = '300 SW Jefferson Ave.', `city` = 'Corvallis', `state` = 'OR', `zip` = '97333', `phone` = '541-758-2077', `category` = 'Restaurant', `website` = 'http://block15.com', `email` = 'block15@block15.com')
