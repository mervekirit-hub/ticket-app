import * as ticketController from "./ticketController.js";
import * as customerController from "./customerController.js";
import Ticket from "../models/ticketModel.js";
import Customer from "../models/customerModel.js";

const getUserLoginPage = (req, res) => {
    res.render("user-login");
};

const getAdminLoginPage = (req, res) => {
    res.render("admin-login");
};

const getAdminPage = async (req, res) => {
    try {
        const tickets = await ticketController.getAllTickets(req, res);
        const recentCustomers = await customerController.getRecentCustomers(req, res);
        const ticketStats = await ticketController.getTicketStats();

        res.render("admin", { 
            tickets, 
            recentCustomers,
            ticketStats,
            admin: res.locals.admin
        });
    } catch (error) {
        console.error("Error rendering admin page:", error);
        res.status(500).send("Server error");
    }
};

const getTicketsPage = async (req, res) => {
    try {
        const tickets = await ticketController.getAllTickets(req, res);
        res.render("tickets", { 
            tickets,
            admin: res.locals.admin 
        });
    } catch (error) {
        console.error("Error rendering tickets page:", error);
        res.status(500).send("Server error");
    }
};

const getCustomersPage = async (req, res) => {
    try {
        await customerController.getAllCustomers(req, res);
    } catch (error) {
        console.error("Error rendering customers page:", error);
        res.status(500).send("Server error");
    }
};

const getCustomerLoginPage = async (req, res) => {
    try {
        const customer = res.locals.customer;
        
        if (!customer) {
            return res.status(401).send("Kullanıcı girişi gerekiyor");
        }

        const tickets = await Ticket.find({ "user.email": customer.user.email }).sort({ createdAt: -1 });

        res.render("customer-login", { 
            customer,
            tickets
        });
    } catch (error) {
        console.error("Error rendering customer login page:", error);
        res.status(500).send("Server error");
    }
};

const getLogout =  (req, res) => {
    res.cookie('jwt', '', {
        maxAge: 1,
    });
    res.cookie('adminJwt', '', {
        maxAge: 1,
    });
    res.redirect('/');
};

const getForgotPasswordPage = (req, res) => {
    res.render('forgot-password');
};

export { getUserLoginPage, getAdminLoginPage, getAdminPage, getTicketsPage, getCustomersPage, getCustomerLoginPage, getLogout, getForgotPasswordPage };