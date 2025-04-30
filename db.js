import mongoose from 'mongoose';

const conn = () => {
    mongoose.connect(process.env.DB_URI, {
        dbName: 'users'
    })
    .then (() => {
        console.log('Connected to the DB succesfully');
    })
    .catch((err) => {
        console.log(`DB connection err:, ${err}`);
    });
};

export default conn;