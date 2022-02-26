const Lead = require("../models/leadModel");
const Duplicate = require("../models/duplicateModel");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
var http = require("http");
var url = require("url");
const { path } = require("path");
const cors = require("cors");

//===== middleware functions ================
// exports.checkID = async (req, res, next, id) => {
//   const val = id || req.params.id;
//   console.log("Hello from CheckID middleware 😍");
//   console.log(val);

//   const lead = await Lead.findById(val, (err, data) => {
//     if (err) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "ID does not exist! 😪",
//       });
//     } else {
//       console.log(lead);
//       next();
//     }
//   });
// };

//==================================================================
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find();
    const numOfLeads = await Lead.countDocuments();
    // console.log(uuidv4());
    res.status(200).json({
      status: "success",
      numOfLeads,
      data: {
        leads,
      },
    });
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
    // const uuid = req.params.id;
    const lead = await Lead.findById(req.params.id);
    res.status(200).json({
      status: "success",
      data: {
        lead,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: "ID does not exist! 😕",
    });
  }
};
exports.createLead = async (req, res) => {
  try {
    console.log(req.body);
    const leadObj = { ...req.body };
    const newLead = await Lead.create(leadObj);
    res.status(201).json({
      status: "success",
      data: {
        lead: newLead,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};
exports.updateLead = async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.params.id);
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      status: "success",
      data: {
        lead,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
};
exports.deleteLead = async (req, res) => {
  try {
    const uuid = req.params.id;
    await Lead.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "Lead Deleted!",
      data: null,
    });
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
    // const uniqueFileName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueFileName);
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
    console.log(req.file);
    if (req.file == undefined || req.file == "") {
      return res.status(400).send({
        message: "Please upload a CSV file!",
      });
    }
    // Import a CSV File to MongoDB database
    let csvData = [];
    let csvEmail = [];
    let duplicateEmails = [];
    let dataToEntry = [];
    let duplicateEntries = [];
    const uploadedData = [];
    let filePath = `${__dirname}/../public/data/uploads/${req.file.filename}`;
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        throw error.message;
      })
      .on("data", (row) => {
        //console.log(row.email);
        csvData.push(row);
        //csvData.push(row);
        if (csvEmail.indexOf(row.email) == -1) {
          csvEmail.push(row.email);
        } else {
          //storing duplicateEmails in an array
          duplicateEmails.push(row.email);
        }
      })
      .on("end", () => {
        // Save to DB
        /////////////////////
        // console.log(csvData);
        // console.log(csvEmail);
        // console.log(duplicateEmails);
        // ** CHECK IF CSV FILE CONTAINS ANY DUPLICATE ENTRIES
        console.log(`🤦‍♀️ Duplicates Entries 🤷‍♂️:  ${duplicateEmails.length}`);
        //Removing duplicates leads from csvData array
        csvData.forEach((el) => {
          // 1. entries to upload to DB
          if (!duplicateEmails.includes(el.email)) {
            dataToEntry.push(el);
          } else {
            duplicateEntries.push(el);
          }
        });
        console.log("================================");
        console.log(dataToEntry);
        console.log("================================");
        // console.log(typeof duplicateEntries);
        // console.log(duplicateEntries);
        // console.log("================================");
        //Removing duplicate entries from 'duplicateEntries' array
        const setObj = new Set();
        let filterDuplicateArr = duplicateEntries.filter((el) => {
          const duplicate = setObj.has(el.email);
          setObj.add(el.email);
          return !duplicate;
        });
        console.log(filterDuplicateArr);
        console.log("================================");
        // console.log(setObj);
        // console.log("😍 Uploaded successfully 😅");
        // ** ===========================================
        // ** CHECK IF DATABASE CONTAINS ANY DUPLICATE ENTRIES
        // 3. show the response
        //** alternatively */

        // });
        const promiseArr = Promise.all(
          dataToEntry.map(async (data, index) => {
            let lead = await Lead.findOne({ email: data.email });
            // return lead;
            if (lead) {
              delete lead._id;
              delete lead.__v;
              delete lead.createdAt;
              const { title, firstName, lastName, email, city, zipcode } = lead;
              filterDuplicateArr.push({
                title,
                firstName,
                lastName,
                email,
                city,
                zipcode,
              });
              // return lead;
              return `This lead (${lead.email}) is already present in the database!`;
            } else if (lead === null || lead === undefined) {
              // return "Lead to be added";
              uploadedData.push(data);
              return await Lead.create(data);
            }
          })
        )
          .then((resolve) => {
            console.log(resolve);
            console.log(typeof resolve);
            console.log("😄😀 FINAL DATA Inserted! 😍😍");
            let ID = uuidv4();
            console.log(filterDuplicateArr);
            let duplicateArr = filterDuplicateArr.map((el, ind) => {
              el.dupId = ID;
              // delete el._id;
              // delete el.__v;
              // delete el.createdAt;
              return el;
            });

            //* add duplicates to duplicate collection
            if (duplicateArr.length || duplicateArr.length > 0) {
              Duplicate.insertMany(duplicateArr, { ordered: false });
            }

            console.log("||===================================||");
            console.log(duplicateArr);
            // console.log(duplicateArr[0].dupId);
            // console.log(duplicateArr[1].dupId);
            // console.log(duplicateArr[2].dupId);
            // console.log(duplicateArr[3].dupId);
            // console.log(req.url); // bulk
            // console.log(req.baseUrl); // /api/v1/leads
            let hostname = req.headers.host;
            console.log(hostname); // hostname = 'localhost:8000'
            res.status(200).json({
              status: "success",
              created: uploadedData.length,
              duplicates: filterDuplicateArr.length,
              report: `http://${hostname}${req.baseUrl}/reports/${ID}`,
              data: {
                lead: resolve,
              },
            });
          })
          .catch((err) => {
            console.log(err);
          });

        //console.log(promiseArr);
        // Promise.all(promiseArr)
        //   .then((resolve) => {
        //     console.log(resolve);
        //   })
        //   .catch((err) => {
        //     console.log(err);
        //   });
        console.log("===================================");
        console.log("Final data to store into database!!! 💥");
        //console.log(dataToEntry);
        console.log("===================================");
        //insert to DATABASE
        // if (dataToEntry.length || dataToEntry.length >= 1) {
        //   Lead.insertMany(dataToEntry, { ordered: false })
        //     .then((uploadedData) => {
        //       console.log("😄😀 FINAL DATA Inserted! 😍😍");
        //       console.log(uploadedData);
        //       console.log(req.url); // bulk
        //       console.log(req.baseUrl); // /api/v1/leads
        //       let hostname = req.headers.host; // hostname = 'localhost:8000'
        //       // let pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
        //       // console.log("http://" + hostname + pathname);
        //       res.status(200).json({
        //         status: "success",
        //         created: uploadedData.length,
        //         duplicates: filterDuplicateArr.length,
        //         report: `${req.baseUrl}/reports/`,
        //         data: {
        //           uploadedData,
        //         },
        //       });
        //     })
        //     .catch((e) => {
        //       console.log("ERROR - " + e.message);
        //       console.log(e.insertedIds); //displays all ids of attempted inserts
        //     });
        // } else {
        //   res.status(200).json({
        //     status: "success",
        //     created: 0,
        //     msg: "There in nothing to store in DB!",
        //     // duplicates: filterDuplicateArr.length,
        //     report: `${req.baseUrl}/reports/`,
        //     data: {
        //       uploadedData: "",
        //     },
        //   });
        // }
      });

    //** alternatively */
  } catch (error) {
    console.log("catch error--", error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};

//download duplicate record
exports.downloadDuplicates = async (req, res) => {
  const filepath = `${__dirname}/../public/data/download/test.csv`;
  const ws = fs.createWriteStream(filepath);
  // * =========================
  let data = await Duplicate.find({ dupId: req.params.dupId });
  //console.log(data);
  //console.log(typeof data);
  data = JSON.parse(JSON.stringify(data));
  csv
    .write(data, { headers: true })
    .on("finish", function () {
      console.log("Write to test.csv successfully!");
      // console.log(`${filepath}`);
      setTimeout(function () {
        res.download(filepath, "test.csv");
      }, 2000);

      // res.setHeader("Content-Type", "text/csv");
      // res.setHeader("Content-Disposition", `attachment; filename=test.csv`);
      // res
      //   .status(200)
      //   .send(
      //     `<a href='${filepath}' id='download-btn' download='test.csv'>Download File</a><script>document.getElementById('download-btn').click()</script>`
      //   );
    })
    .pipe(ws);
};

//BUlk update
exports.aaa = async (req, res) => {
  let ids = JSON.parse(JSON.stringify(req.body.id));
  let data = JSON.parse(JSON.stringify(req.body.data));
  // console.log(ids);
  // console.log(typeof ids);
  // console.log(data);
  // console.log(typeof data);

  let promiseAll = Promise.all(
    ids.map(async (id) => {
      try {
        let lead = await Lead.findByIdAndUpdate(id, data, { new: true });
        if (lead) {
          return `Lead having ID (${id}) is updated! 🙂`;
        } else if (lead === null || lead === undefined) {
          //return `Lead having ID (${id}) is not present! 😪`;
          throw new Error("Lead having ID (${id}) is not present! 😪");
        } else {
          throw new Error("Server Error");
        }
      } catch (e) {
        throw new Error(`Lead having ID (${id}) is not present! 😪`);
      }
    })
  )
    .then((resolve) => {
      console.log(resolve);
      // console.log(typeof resolve);
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
