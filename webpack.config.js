const path = require("path");

module.exports = {
    mode: "development",
    entry: "./public/src/index.js",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "./public/dist"),
    },
    optimization: {
        minimize: false,
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                },
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};
