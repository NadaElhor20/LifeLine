const mongoose = require("mongoose");
const { mongoUrl } = require("../config");
mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.info("connected to Mongo Successfully");
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
