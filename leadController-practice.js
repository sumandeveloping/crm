const Lead = require("../models/leadModel");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
var http = require("http");
var url = require("url");

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
    console.log(req.body);
    console.log(req.params.id);
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
        const filterDuplicateArr = duplicateEntries.filter((el) => {
          const duplicate = setObj.has(el.email);
          setObj.add(el.email);
          return !duplicate;
        });
        console.log(filterDuplicateArr);
        console.log("================================");
        // console.log(setObj);
        console.log("😍 Uploaded successfully 😅");
        // ** ===========================================
        // ** CHECK IF DATABASE CONTAINS ANY DUPLICATE ENTRIES
        dataToEntry.forEach((data, index) => {
          // 1. findOne & create
          Lead.findOne({ email: data.email }, (err, result) => {
            if (err) console.log(err);
            if (result) {
              console.log(result, index);
              console.log(
                `This Lead having email(${result.email}) is already in database`
              );
              dataToEntry = dataToEntry.splice(index, 1);
            } else {
              // 2. If no matches in DB then create a new lead
              // Lead.create(data).then((res) => {
              //   uploadedData.push(data);
              //   console.log("new lead created 🙂");
              // });
            }
          });
        });
        console.log("===================================");
        console.log("Final data to store into database!!! 💥");
        console.log("===================================");

        console.log(dataToEntry);

        console.log("===================================");
        // 3. show the response

        // Lead.insertMany(dataToEntry, { ordered: false })
        //   .then((uploadedData) => {
        //     console.log("Data Inserted! 😍😍");
        //     console.log(uploadedData);
        //     console.log(req.url); // bulk
        //     console.log(req.baseUrl); // /api/v1/leads
        //     let hostname = req.headers.host; // hostname = 'localhost:8000'
        //     // let pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
        //     // console.log("http://" + hostname + pathname);
        //     res.status(200).json({
        //       status: "success",
        //       created: uploadedData.length,
        //       duplicates: filterDuplicateArr.length,
        //       report: `${req.baseUrl}/reports/`,
        //       data: {
        //         uploadedData,
        //       },
        //     });
        //   })
        //   .catch((e) => {
        //     console.log("ERROR - " + e.message);
        //     console.log(e.insertedIds); //displays all ids of attempted inserts
        //   });
      });
  } catch (error) {
    console.log("catch error--", error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};
