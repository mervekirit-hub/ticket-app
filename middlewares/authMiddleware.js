import Customer from '../models/customerModel.js';
import Admin from '../models/adminModel.js';
import jwt from "jsonwebtoken";

const checkCustomer = async (req, res, next) => {
    const token = req.cookies.jwt;
        if(token) {
            jwt.verify(token, process.env.JWT_SECRET, async(err, decodedToken) => {
                if(err) {
                    console.log(err.message);
                    res.locals.customer = null;
                    next();
                } else {
                    const customer = await Customer.findById(decodedToken.customerId);
                    res.locals.customer = customer;
                    next();
                }
            });
        } else {
            res.locals.customer = null;
            next();
        }
};

const authenticateCustomerToken = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            console.log("Customer token eksik.");
            return res.redirect("/user-login");
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log("JWT doğrulama hatası (customer):", err.message);
                return res.redirect("/user-login");
            }

            // Token içeriği customer'a uygun mu
            const { customerId, admin_id, exp } = decodedToken;

            if (!customerId || admin_id) {
                console.log("Token içeriği müşteri için geçersiz.");
                return res.redirect("/user-login");
            }

            const now = Math.floor(Date.now() / 1000);
            if (exp && now >= exp) {
                console.log("Token süresi dolmuş (customer).");
                return res.redirect("/user-login");
            }

            const customer = await Customer.findById(customerId);
            if (!customer) {
                console.log("Müşteri bulunamadı.");
                return res.redirect("/user-login");
            }

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            req.customer = customer;
            return next();
        });

    } catch (error) {
        console.error("authenticateCustomerToken Hatası:", error.message);
        return res.status(401).json({
            succeeded: false,
            error: "Yetkisiz erişim (customer).",
        });
    }
};

const authenticateCustomerTokenAPI = async (req, res, next) => {
    console.log("🔑 authenticateCustomerTokenAPI başladı");
    try {
        let token = req.cookies?.jwt;

        // Cookie header'ından JWT al
        if (!token && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';');
            const jwtCookie = cookies.find(c => c.trim().startsWith('jwt='));
            if (jwtCookie) {
                token = jwtCookie.split('=')[1];
            }
        }

        console.log("Token bulunan:", !!token);

        if (!token) {
            return res.status(401).json({ succeeded: false, message: "Yetkisiz erişim. Lütfen müşteri olarak giriş yapın." });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log("Token doğrulama hatası:", err.message);
                return res.status(401).json({ succeeded: false, message: "Geçersiz token." });
            }

            console.log("Decoded token:", decodedToken);
            
            try {
                const customer = await Customer.findById(decodedToken.customerId);
                
                if (!customer) {
                    console.log("Müşteri bulunamadı");
                    return res.status(401).json({ succeeded: false, message: "Müşteri bulunamadı." });
                }
                
                console.log("Müşteri bulundu:", customer.name, customer.email);
                
                // Customer'ı request nesnesine ekle
                req.customer = customer;
                next();
            } catch (findError) {
                console.error("Müşteri arama hatası:", findError);
                return res.status(500).json({ succeeded: false, message: "Müşteri bilgileri alınırken hata oluştu." });
            }
        });
    } catch (error) {
        console.error("Yetkilendirme hatası:", error);
        res.status(401).json({
            succeeded: false,
            message: "Yetkilendirme başarısız",
        });
    }
};

const checkAdmin = async (req, res, next) => {
    const token = req.cookies.adminJwt;
    if(token) {
        jwt.verify(token, process.env.JWT_SECRET, async(err, decodedToken) => {
            if(err) {
                console.log(err.message);
                res.locals.admin = null;
                next();
            } else {
                const admin = await Admin.findById(decodedToken.admin_id);
                res.locals.admin = admin;
                next();
            }
        });
    } else {
        res.locals.admin = null;
        next();
    }
};

const authenticateAdminToken = async (req, res, next) => {
    try {
        const token = req.cookies.adminJwt;
        if (!token) {
            console.log("Admin token eksik.");
            return res.redirect("/admin-login");
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log("JWT doğrulama hatası (admin):", err.message);
                return res.redirect("/admin-login");
            }

            const { admin_id, customerId, exp } = decodedToken;

            if (!admin_id || customerId) {
                console.log("Token içeriği admin için geçersiz.");
                return res.redirect("/admin-login");
            }

            const now = Math.floor(Date.now() / 1000);
            if (exp && now >= exp) {
                console.log("Token süresi dolmuş (admin).");
                return res.redirect("/admin-login");
            }

            const admin = await Admin.findById(admin_id);
            if (!admin) {
                console.log("Admin bulunamadı.");
                return res.redirect("/admin-login");
            }

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            req.admin = admin;
            return next();
        });

    } catch (error) {
        console.error("authenticateAdminToken Hatası:", error.message);
        return res.status(401).json({
            succeeded: false,
            error: "Yetkisiz erişim (admin).",
        });
    }
};

const authenticateAnyTokenAPI = async (req, res, next) => {
    let token = null;

    // Token'ı cookie veya header'dan al
    if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    } else if (req.cookies?.adminJwt) {
        token = req.cookies.adminJwt;
    } else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        const jwtCookie = cookies.find(c => c.trim().startsWith('jwt='));
        const adminCookie = cookies.find(c => c.trim().startsWith('adminJwt='));
        
        if (jwtCookie) token = jwtCookie.split('=')[1];
        else if (adminCookie) token = adminCookie.split('=')[1];
    }

    if (!token) {
        return res.status(401).json({ succeeded: false, message: "Yetkisiz erişim. Giriş yapın." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log("Token doğrulama hatası:", err.message);
            return res.status(401).json({ succeeded: false, message: "Geçersiz token." });
        }

        try {
            // Token içeriğinden user tipini belirle
            if (decodedToken.customerId) {
                const customer = await Customer.findById(decodedToken.customerId);
                if (!customer) {
                    return res.status(401).json({ succeeded: false, message: "Müşteri bulunamadı." });
                }
                req.user = customer;
                req.userType = 'customer';
            } else if (decodedToken.admin_id) {
                const admin = await Admin.findById(decodedToken.admin_id);
                if (!admin) {
                    return res.status(401).json({ succeeded: false, message: "Admin bulunamadı." });
                }
                req.user = admin;
                req.userType = 'admin';
            } else {
                return res.status(400).json({ succeeded: false, message: "Geçersiz token içeriği." });
            }

            next();
        } catch (e) {
            console.error("Kullanıcı arama hatası:", e);
            return res.status(500).json({ succeeded: false, message: "Kullanıcı doğrulanırken hata oluştu." });
        }
    });
};


export {  checkCustomer, authenticateCustomerToken, checkAdmin, authenticateAdminToken, authenticateCustomerTokenAPI, authenticateAnyTokenAPI };