const Lead = require("../models/leadModel");
const db = require("../connection");
const Duplicate = require("../models/duplicateModel");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
var http = require("http");
var url = require("url");
const { path } = require("path");
const cors = require("cors");

exports.getAllLeads = async (req, res) => {
  try {
    // console.log(req.query);
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 2;
    const skip = (page - 1) * limit; // (3-1) * 20

    // const leads = await Lead.find().skip(skip).limit(limit);
    db.query(
      `SELECT * FROM leads LIMIT ${skip}, ${limit}`,
      (err, rows, fields) => {
        if (err) throw err;
        let numOfLeads = rows.length;
        let leads = numOfLeads > 0 ? rows : "No leads found";
        rows.length;
        res.status(200).json({
          status: "success",
          numOfLeads,
          leads,
        });
      }
    );
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
};
exports.getSingleLead = async (req, res) => {
  try {
    //console.log(typeof req.params.id);
    const leadId = req.params.id.trim();
    const sql = "SELECT * FROM `leads` WHERE `id` = ?";
    // const lead = await Lead.findById(req.params.id);
    db.query(sql, [leadId], (err, rows, fields) => {
      if (err) throw err;
      let numOfLeads = rows.length;
      let lead =
        numOfLeads > 0
          ? rows
          : `Lead having ID (${req.params.id}) does not exist!`;
      rows.length;
      res.status(200).json({
        status: "success",
        numOfLeads,
        lead,
      });
    });
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: "Not Found 😕",
    });
  }
};
exports.createLead = async (req, res) => {
  try {
    //console.log(req.body);
    const leadID = uuidv4();
    const newLeadObj = { id: leadID, ...req.body };
    // console.log(newLeadObj);
    db.query("INSERT INTO `leads` SET ?", newLeadObj, (err, rows, fields) => {
      if (err) throw err;
      res.status(200).json({
        status: "success",
        lead: newLeadObj,
      });
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};
exports.deleteLead = async (req, res) => {
  try {
    const leadID = db.escape(req.params.id);
    // await Lead.findByIdAndDelete(req.params.id);
    db.query(
      "DELETE FROM `leads` WHERE `id` = " + leadID,
      (err, rows, fields) => {
        if (err) throw err;
        res.status(204).json({
          status: "Lead Deleted!",
          affectedRows: rows.affectedRows,
        });
      }
    );
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: err.message,
    });
  }
};
exports.updateLead = async (req, res) => {
  try {
    // console.log(req.body);
    const queryObj = { ...req.body };
    const leadID = req.params.id;
    const query = db.query(
      "SELECT * FROM `leads` WHERE `id` = ?",
      leadID,
      (err, rows, fields) => {
        if (err) throw err;
        if (!rows.length) {
          res.status(404).json({
            status: "Failed",
            message: "Lead ID does not exist!",
          });
        } else {
          if (Object.keys(queryObj).length) {
            let updateValues = [];
            let sql = "UPDATE `leads` SET ";
            Object.entries(queryObj).forEach(([key, value]) => {
              updateValues.push(value);
              sql += ` ${key} = ?,`;
            });
            // Removing the last ',' from sql string
            sql = sql.slice(0, -1);
            sql += " WHERE `id` = ?";
            //adding 'id' to the updateValues array
            updateValues.push(leadID);
            let runUpdateQuery = db.query(
              sql,
              updateValues,
              (err, result, fields) => {
                if (err) throw err;
                res.status(200).json({
                  status: "success",
                  message: "Lead has been updated successfully!",
                  dataModified: result.affectedRows,
                });
              }
            );
          } else {
            res.status(200).json({
              status: "success",
              message: "There is nothing to update!",
            });
          }
        }
      }
    );
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
};

//* UPLOAD CSV
// 1. Multer upload storage
const storageFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/../public/data/uploads`);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});
// 2. File Filter
const csvFilter = (req, file, cb) => {
  console.log(`File type -${file.mimetype} - 💥`);
  if (file.mimetype.includes("csv")) {
    cb(null, true);
  } else {
    cb("Please upload only csv file.", false);
  }
};

exports.upload = multer({ storage: storageFile, fileFilter: csvFilter });

// 3. Upload csv file to DB
exports.uploadToDB = async (req, res) => {
  try {
    // return console.log(req.file);
    if (req.file == undefined || req.file == "") {
      return res.status(400).send({
        message: "Please upload a CSV file!",
      });
    }
    // Import a CSV File to MongoDB database
    let csvData = [],
      csvIDS = [],
      duplicateIDS = [],
      dataToEntry = [],
      duplicateEntries = [],
      uploadedData = [],
      hostname = req.headers.host,
      filePath = `${__dirname}/../public/data/uploads/${req.file.filename}`;
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        throw error.message;
      })
      .on("data", (row) => {
        //console.log(row.email);
        csvData.push(row);
        //csvData.push(row);
        if (csvIDS.indexOf(row.id) == -1) {
          csvIDS.push(row.id);
        } else {
          //storing duplicateEmails in an array
          duplicateIDS.push(row.id);
        }
      })
      .on("end", () => {
        // Save to DB
        // ** CHECK IF CSV FILE CONTAINS ANY DUPLICATE ENTRIES
        //Removing duplicates leads from csvData array
        csvData.forEach((el) => {
          // 1. entries to upload to DB
          if (!duplicateIDS.includes(el.id)) {
            dataToEntry.push(el);
          } else {
            duplicateEntries.push(el);
          }
        });
        //Removing duplicate entries from 'duplicateEntries' array
        const setObj = new Set();
        let filterDuplicateArr = duplicateEntries.filter((el) => {
          const duplicate = setObj.has(el.id);
          setObj.add(el.id);
          return !duplicate;
        });
        // ** ===========================================
        // ** CHECK IF DATABASE CONTAINS ANY DUPLICATE ENTRIES
        // ** 3. show the response
        const promiseAll = Promise.all(
          dataToEntry.map((el) => {
            //1. check if id already exists in the DB
            return new Promise((resolve, reject) => {
              let lead = db.query(
                "SELECT id FROM `leads` WHERE `id` = ?",
                el.id,
                (err, result, fields) => {
                  if (err)
                    throw new Error(
                      `Something went wrong when running the query. Error:- ${error}`
                    );
                  if (result.length && result.length >= 1) {
                    //if id already exists in the DB then add this el to duplicate array
                    filterDuplicateArr.push(el);
                    resolve(el);
                  } else {
                    //if id does NOT EXISTS in the DB then INSERT To the DB
                    let leadId = el.id || uuidv4();
                    let newLeadObj = { id: leadId, ...el };
                    db.query(
                      "INSERT INTO `leads` SET ?",
                      newLeadObj,
                      (err, rows, fields) => {
                        if (err) throw err;
                        uploadedData.push(newLeadObj);
                        resolve(newLeadObj);
                      }
                    );
                  }
                }
              );
            });
          })
        )
          .then((data) => {
            //console.log(filterDuplicateArr);
            writeDuplicates(filterDuplicateArr).then(() => {
              res.status(200).json({
                status: "success",
                created: uploadedData.length,
                duplicates: filterDuplicateArr.length,
                report: `http://${hostname}${req.baseUrl}/reports/duplicates`,
              });
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
  } catch (error) {
    console.log("catch error--", error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};

//BUlk update
exports.bulkUpdate = async (req, res) => {
  let ids = JSON.parse(JSON.stringify(req.body.id));
  let data = JSON.parse(JSON.stringify(req.body.data));

  let promiseAll = Promise.all(
    ids.map((id) => {
      return new Promise((resolve, reject) => {
        let lead = db.query(
          "SELECT id FROM `leads` WHERE `id` = ?",
          id.trim(),
          (err, result, fields) => {
            if (err) throw err;
            if (!result.length) {
              // 1. Check if id is present in the DB or not
              return resolve(`Lead having ID (${id}) does not exist`);
            } else if (result.length || result.length >= 1) {
              // 2. If id is present in the DB then RUN UPDATE query
              // making the sql string
              if (Object.keys(data).length >= 1) {
                let sql = "UPDATE leads SET";
                let updateValues = [];
                Object.entries(data).forEach(([key, value]) => {
                  sql += ` ${key} = ?,`;
                  updateValues.push(value);
                });
                sql = sql.slice(0, -1);
                sql += " WHERE `id` = ?";
                updateValues.push(id.trim());
                //running the update query
                let runUpdateQuery = db.query(
                  sql,
                  updateValues,
                  (err, row, fields) => {
                    if (err)
                      return reject(
                        new Error("SQL error while running the update query!!")
                      );
                    return resolve(
                      `Lead having ID(${id}) is updated successfully!`
                    );
                  }
                );
              }
            } else {
              return reject(new Error("Server Error"));
            }
          }
        );
      });
    })
  )
    .then((resolve) => {
      console.log(resolve);
      res.status(404).json({
        status: "Success",
        modifiedData: resolve,
      });
    })
    .catch((err) => {
      console.log(err.message);
      res.status(404).json({
        status: "Failed",
        message: err.message,
      });
    });
};
//WRITE DUPLICATES
writeDuplicates = async (dataArr) => {
  const filepath = `${__dirname}/../public/data/download/duplicates.csv`;
  const ws = fs.createWriteStream(filepath);
  csv
    .write(dataArr, { headers: true })
    .on("finish", function () {
      console.log("Duplicate records has been written successfully!");
      // console.log(`${filepath}`);
    })
    .pipe(ws);
};
//download duplicates
exports.downloadDuplicates = async (req, res) => {
  const filepath = `${__dirname}/../public/data/download/duplicates.csv`;
  res.download(filepath, "duplicates.csv");
};
