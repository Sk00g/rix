const express = require("express");
const MongoClient = require("mongodb").MongoClient;

// import routes for api endpoints
const accountsRoute = require("./routes/accounts.js");
const lobbiesRoute = require("./routes/lobbies.js");
const mapsRoute = require("./routes/maps.js");

// create new express app and save it as "app"
const cors = require("cors");
const app = express();

// server configuration
const PORT = 8080;

// Keep track of the DB client after connection
let db = null;

app.use(cors());
app.use(express.static("public/"));
app.use(express.json());

// create a route for the app
app.get("/", (req, res) => {
    res.redirect("dist/index.html");
});

const mongoURL = "mongodb://localhost:27017/perilous";
MongoClient.connect(mongoURL, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error("Mongo connection failed: ", err);
        return;
    }

    console.log("DB connection successful...");

    // Set the DB on the app object to be accessed by each route
    app.set("db", client.db());

    // Assign api routes
    app.use("/api/accounts", accountsRoute);
    app.use("/api/lobbies", lobbiesRoute);
    app.use("/api/maps", mapsRoute);
});

// make the server listen to requests
app.listen(PORT, () => {
    console.log(`Server running at: http://127.0.0.1:${PORT}/`);
});

module.exports = db;
