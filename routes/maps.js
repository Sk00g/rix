const express = require("express");
const fs = require("fs");

const router = express.Router();

router.get("/", (req, res) => {
    let files = fs.readdirSync("./public/dist/maps");
    let mapNames = files.filter((f) => f !== "_archive");

    res.json(mapNames);
});

router.get("/:name", async (req, res) => {
    // #TODO
});

module.exports = router;
