const User = require('../models/user');

//Show form
module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

//Receive the data and createthe registered user
module.exports.register = async (req, res, next) => {
    try {
        //Get what we need from the form
        const { username, password, knownas } = req.body;
        //Create the base user
        const user = new User({ username, knownas });
        //Register the user using Passport to hash and salt the password
        const registeredUser = await User.register(user, password);

        //Passport again, login the user
        req.login(registeredUser, err => {
            if (err) return next(err);
            //Quick welcome and redirect
            req.flash('success', 'Welcome to PubLife!');
            res.redirect('/pubs');
        })
    } catch (e) {
        //Oops flash error and redirect to this form
        req.flash('error', e.message);
        res.redirect('register');
    }
}

//Login form
module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

//Passport middleware to authenticate using local
//sets failure message and redirect if fails
//more time saved
module.exports.login = (req, res) => {
    //Welcome message
    req.flash('success', 'welcome back!');
    //Redirect to where orginal destination OR the pubs
    /*
    const redirectUrl = req.session.returnTo || '/pubs';
    if (redirectUrl.includes('favicon'))
        redirectUrl = '/pubs';
*/
    const redirectUrl = redirectTo(req.session.returnTo || '/pubs');

    //console.log(redirectUrl);
    //Remove the old returnto info
    delete req.session.returnTo;
    //...and redirect
    res.redirect(redirectUrl);
}

function redirectTo(returnTo) {
    var returnThis = returnTo.toLowerCase() || '/pubs';

    if (!(returnThis.includes('pubs') || returnThis.includes('comments') || returnThis.includes('users'))) {
        returnThis = '/pubs';
    }

    return returnThis;
}

//The simple logout function, handled by Passport again!! Yay!
module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', "Cheers!");
    res.redirect('/pubs');
}