const mongoose = require("mongoose");
const { Schema } = mongoose;

const roomSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  numPeople: {
    type: Number,
    required: true,
  },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
