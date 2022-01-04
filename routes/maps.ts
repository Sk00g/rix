import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/", (req, res) => {
    let files = fs.readdirSync("./public/dist/maps");
    let mapNames = files.filter((f) => f !== "_archive");

    res.json(mapNames);
});

router.get("/:name", async (req, res) => {
    // #TODO
});

export default router;
