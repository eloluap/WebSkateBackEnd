var mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    userID: { type: String, unique: true, required: true },
    userName: { type: String, unique: true, required: true },
    role: { type: String, default: 'user' },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    validated: { type: Boolean, required: true, default: false },
    token: { type: String },
    expirationTime: { type: Number }
}, { timestamps: true });

userSchema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) { return next() };
    bcrypt.hash(user.password, 10).then((hashedPassword) => {
        user.password = hashedPassword;
        next();
    })
}, function (err) {
    next(err)
})

userSchema.methods.comparePassword = function (candidatePassword, next) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) {
            return next(err);
        }
        else {
            next(null, isMatch);
        }
    })
}

module.exports = mongoose.model("user", userSchema);