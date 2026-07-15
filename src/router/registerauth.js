const express = require("express");
const controller = require("../controllers/registerController");
const router = express.Router();

router.get("/register", controller.renderRegister);
router.post("/register", controller.postRegister);
router.get("/confirm_register/:id/:token", controller.confirmRegister);
router.get("/register_comp/:id/:email/:token", controller.renderRegisterComp);
router.post("/register_comp/:id/:email/:token", controller.postRegisterComp);
router.get("/changeProfile", controller.getChangeProfile);
router.post("/changeProfile", controller.postChangeProfile);

module.exports = router;
