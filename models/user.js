const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//Using passport-local-mongoose for authentication - makes life a lot easier
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    knownas: {
        type: String,
        required: true,
        unique: false
    }
});

//This automatically adds in username, hashed password and salt value plus a bunch of methods (apparantly)
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);