import express from 'express';
import * as customerController from "../controllers/customerController.js";
import { deleteCustomer } from "../controllers/customerController.js";
import Customer from "../models/customerModel.js";

const router = express.Router();

router.route("/")
    .post(customerController.createCustomer)
    .get(customerController.getAllCustomers);

router.post('/customer-login', customerController.loginCustomer);

router.delete("/:id", deleteCustomer);

router.get('/filter', customerController.getFilteredCustomers);

router.route("/departments-companies")
    .get(customerController.getDepartmentsAndCompanies);

router.get('/id/:id', customerController.getCustomerById);

router.get("/json", async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(
            JSON.stringify(
                {
                    succeeded: true,
                    customers
                },
                null,
                2 // <--- JSON çıktısını daha okunabilir yapar
            )
        );
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error: error.message
        });
    }
});

export default router;