const { pubSchema, commentSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Pub = require('./models/pub');
const Comment = require('./models/comment');

//Check the user is logged in using Passport inbuilt functions() - nice!
//As this is middleware, we can call this function from our routes
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //req.session.returnTo = req.originalUrl; Superseeded by use of  app.use in app.js
        req.flash('error', 'Please log in.');
        return res.redirect('/login');
    }
    next();
}

//Validation "middleware" function:
module.exports.validatePub = (req, res, next) => {
    //Use Joi to validate against the schema
    const { error } = pubSchema.validate(req.body);
    //If there is an error, map out the message(s) and pass to our error handler for display
    if (error) {
        //Join the messages separated by ", "
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400);
    } else {
        next(); //The important next() to keep the code running
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const pub = await Pub.findById(id);
    if (!pub.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/pubs/${id}`);
    }
    next();
}

module.exports.isCommentAuthor = async (req, res, next) => {
    const { id, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/pubs/${id}`);
    }
    next();
}

//Validation for comment against the schema using joi
module.exports.validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}