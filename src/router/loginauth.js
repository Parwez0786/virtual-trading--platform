const express = require("express");
const controller = require("../controllers/loginController");
const router = express.Router();

router.get("/login", controller.renderLogin);
router.post("/login", controller.postLogin);
router.get("/user_land", controller.userLand);
router.get("/get_data2", controller.getData2);
router.get("/deleteAccountForm", controller.deleteAccountForm);
router.post("/deleteUserAccount", controller.deleteUserAccount);

module.exports = router;
