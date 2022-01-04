module.exports = {
    mode: "development",
    entry: "./index.ts",
    output: { filename: "server.js" },
    optimization: {
        minimize: true,
    },
    target: "node",
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: [/node_modules/, /_Archive/],
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                },
            },
            {
                test: /\.(ts)$/,
                loader: "ts-loader",
                exclude: [/node_modules/, /_Archive/],
            },
        ],
    },
    resolve: {
        extensions: ["*", ".ts", ".js"],
    },
};
