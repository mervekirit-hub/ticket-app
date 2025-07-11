import express from 'express';
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.post('/login', adminController.loginAdmin);

router.post('/create', adminController.createAdmin);

export default router;