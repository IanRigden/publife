const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
// const User = require('../models/user');
const users = require('../controllers/users');


router.route('/register')
    //Show form
    .get(users.renderRegister)
    //Receive the data and createthe registered user
    .post(catchAsync(users.register));

router.route('/login')
    //Render form
    .get(users.renderLogin)
    //Passport middleware to authenticate using local
    //sets failure message and redirect if fails
    //more time saved
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

//The simple logout function, handled by Passport again!! Yay!
router.get('/logout', users.logout)

module.exports = router;