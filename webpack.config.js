const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const rules = require("./node_modules/paraviewweb/config/webpack.loaders.js");
const plugins = [
  new HtmlWebpackPlugin({
    inject: "body",
  }),
];

const entry = path.join(__dirname, "./src/example/index.js");
const outputPath = path.join(__dirname, "./dist");
const styles = path.resolve("./node_modules/paraviewweb/style");

module.exports = {
  plugins,
  entry,
  output: {
    path: outputPath,
    filename: "CatalystWeb.js",
    libraryTarget: "umd",
  },
  module: {
    rules: [{ test: entry, loader: "expose-loader?CatalystWeb" }].concat(rules),
  },
  resolve: {
    alias: {
      'catalyst-web': __dirname,
      PVWStyle: styles,
    },
  },
  devServer: {
    contentBase: "./dist/",
    port: 9999,
  },
};
