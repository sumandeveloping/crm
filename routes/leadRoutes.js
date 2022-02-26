const express = require("express");
const leadController = require("../controllers/leadController");

const router = express.Router();

//it executes only when any URL has an :id parameter
// router.param("id", leadController.checkID);
router
  .route("/")
  .get(leadController.getAllLeads)
  .post(leadController.createLead);

router.patch("/bulk", leadController.aaa);

router
  .route("/:id")
  .get(leadController.getSingleLead)
  .patch(leadController.updateLead)
  .delete(leadController.deleteLead);

router
  .route("/bulk")
  .post(leadController.upload.single("file"), leadController.uploadToDB);

router.route("/reports/:dupId").get(leadController.downloadDuplicates);
module.exports = router;
