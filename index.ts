import express from "express";
import cors from "cors";
import * as mongo from "mongodb";

// import routes for api endpoints
import accountsRoute from "./routes/accounts";
import lobbiesRoute from "./routes/lobbies";
import mapsRoute from "./routes/maps";
import gameStatesRoute from "./routes/gameState";
import path from "path";

// create new express app and save it as "app"
const app = express();

// server configuration
const PORT = 8080;

// Keep track of the DB client after connection
let db = null;

app.use(cors());
app.use(express.static("public/dist"));
app.use(express.json());

const mongoURL = "mongodb://localhost:27017/perilous";
mongo.MongoClient.connect(mongoURL, { useUnifiedTopology: true }, (err, client) => {
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
    app.use("/api/gameStates", gameStatesRoute);

    // create a route for the app
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "public/dist/index.html"));
    });
});

// make the server listen to requests
app.listen(PORT, () => {
    console.log(`Server running at: http://192.168.1.75:${PORT}/`);
});

export default db;
