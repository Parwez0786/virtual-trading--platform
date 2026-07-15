const express = require("express");
const controller = require("../controllers/passwordController");
const router = express.Router();

router.get("/forget-password", controller.forgetPassword);
router.post("/forget-password", controller.postForgetPassword);
router.get("/reset-password/:id/:token", controller.resetPassword);
router.post("/reset-password/:id/:token", controller.postResetPassword);

module.exports = router;
