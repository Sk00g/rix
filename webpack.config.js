const path = require("path");

module.exports = {
    mode: "development",
    entry: "./public/src/index.tsx",
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
                test: /\.(js|jsx)$/,
                exclude: [/node_modules/, /_Archive/],
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                },
            },
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader",
                exclude: [/node_modules/, /_Archive/],
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: ["*", ".ts", ".tsx", ".js", ".jsx"],
    },
};
