import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const adminSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Şifre hashlemek için pre-save hook
adminSchema.pre('save', function(next) {
    const admin = this;
    if (admin.isModified('user.password')) {
        bcrypt.hash(admin.user.password, 10, (err, hash) => {
            if (err) return next(err);
            admin.user.password = hash;
            next();
        });
    } else {
        next(); // Şifre değişmediyse atla
    }
});
const Admin = mongoose.model('Admin', adminSchema);
export default Admin;