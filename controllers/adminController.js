import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Admin girişi
const loginAdmin = async (req, res) => {
    try {
        const { adminId, password } = req.body; // adminId ve password al

        // Eğer adminId veya password eksikse, hata mesajı döndür
        if (!adminId || !password) {
            console.log("Eksik veri:", req.body); // Eksik veri varsa logla
            return res.status(400).json({
                succeeded: false,
                error: "Admin ID ve şifre gereklidir"
            });
        }

        // adminId'ye göre admin verisini bul
        const admin = await Admin.findById(adminId);  // username yerine adminId ile bul
        if (!admin) {
            console.log("Admin bulunamadı:", adminId); // Log
            return res.status(401).json({ 
                succeeded: false, 
                error: "Admin ID veya şifre hatalı" 
            });
        }

        // Şifreyi doğrula
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                succeeded: false, 
                error: "Admin ID veya şifre hatalı" 
            });
        }

        // Token oluştur ve cookie'ye kaydet
        const token = createToken(admin._id);
        res.cookie('adminJwt', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
        });
        res.redirect('/admin'); // Başarılı giriş sonrası admin paneline yönlendir
    
    } catch (error) {
        console.error("Admin giriş hatası:", error);
        res.status(500).json({ 
            succeeded: false, 
            error: "Sunucu hatası" 
        });
    }
};

// Token oluşturma
const createToken = (admin_id) => {
    return jwt.sign({ admin_id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

// Admin oluşturma (sadece geliştirme aşamasında kullanılacak)
const createAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = await Admin.create({
            username,
            password: hashedPassword // Hash'lenmiş şifreyi kaydet
        });
        
        res.status(201).json({
            succeeded: true,
            admin: {
                id: admin._id,
                username: admin.username
            }
        });
    } catch (error) {
        console.error("Admin oluşturma hatası:", error);
        res.status(500).json({
            succeeded: false,
            error: error.message || "Admin oluşturulurken bir hata oluştu"
        });
    }
};

export { loginAdmin, createToken, createAdmin };