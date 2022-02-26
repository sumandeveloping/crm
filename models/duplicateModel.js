const mongoose = require("mongoose");

const duplicateSchema = new mongoose.Schema(
  {
    dupId: String,
    title: {
      type: String,
      required: [true, "A lead must have a title"],
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "A lead must have a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "A lead must have a last name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "A lead must have a email"],
      trim: true,
      unique: true,
    },
    assignee: {
      type: String,
      trim: true,
    },
    leadStatus: {
      type: String,
    },
    leadSource: {
      type: String,
    },
    leadRating: {
      type: Number,
      default: 4.5,
    },
    phone: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
    },
    industry: {
      type: String,
    },
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      default: 0,
    },
    country: {
      type: String,
    },
    zipcode: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: true,
    },
  },
  { autoIndex: false }
);

const Duplicate = mongoose.model("Duplicate", duplicateSchema);
module.exports = Duplicate;
