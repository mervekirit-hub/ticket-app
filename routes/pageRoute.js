import express from 'express';
import * as pageController from "../controllers/pageController.js";
import * as authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(pageController.getUserLoginPage);
router.route("/admin-login").get(pageController.getAdminLoginPage);
router.route("/user-login").get(pageController.getUserLoginPage);

// Admin sayfaları
router.route("/admin").get(authMiddleware.authenticateAdminToken, authMiddleware.checkAdmin, pageController.getAdminPage);
router.route("/tickets").get(authMiddleware.authenticateAdminToken, authMiddleware.checkAdmin, pageController.getTicketsPage);
router.route("/customers").get(authMiddleware.authenticateAdminToken, authMiddleware.checkAdmin, pageController.getCustomersPage);

// Customer sayfası
router.route("/customer-login").get(authMiddleware.authenticateCustomerToken, authMiddleware.checkCustomer, pageController.getCustomerLoginPage);

router.route("/logout").get(pageController.getLogout);
router.get('/forgot-password', pageController.getForgotPasswordPage);

export default router;