const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const debugRoutes = require("./debug");
app.use(debugRoutes);

const commentsRoutes = require("./comments");
app.use(commentsRoutes);

const convertRoutes = require("./convert");
app.use(convertRoutes);

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
