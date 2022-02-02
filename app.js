if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

//Requirement essentials
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

//Sanitise stop mongo injection
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const pubRoutes = require('./routes/pubs');
const commentRoutes = require('./routes/comments');
//Mongo as session storage
const MongoStore = require('connect-mongo');


//Mongo Atlas
//const dbUrl = process.env.DB_URL;
//Local
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/publife';

//Connect to mongo via mongoose
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    //useCreateIndex: true, --Getting a not supported error
    useUnifiedTopology: true
    //useFindAndModify: false --another error
});

//Simple connection check
const db = mongoose.connection;
db.on("error", console.error.bind(console, 'Connection Error!'));
db.once("open", () => {
    console.log("Database Connected");
})

//Hook up to Express
const app = express();

//This tells the engine to use ejsMate which was required earlier
app.engine('ejs', ejsMate);
//These are required to use EJS and tell it where the views/pages are
app.set('view engine', 'ejs');
//app.set('views', path.join(__dirname, 'views'));
//urlencode the data coming back from a POST
app.use(express.urlencoded({ extended: true }));
//Use the method override for _method
app.use(methodOverride('_method'));
//Make sure Express serves the public folder
app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

//Config session for Mongo storage
const store = new MongoStore({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

//Configure to use the Express Session
const sessionConfig = {
    store,
    name: 'bloikses',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //This is only for https!!!! secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
//...and use it
app.use(session(sessionConfig))
//Use Flash
app.use(flash());
//Put the helmet on! - not the content security policy though... (below)
//app.use(helmet());
app.use(helmet({ crossOriginEmbedderPolicy: false }));

/*
app.use(helmet({
    contentSecurityPolicy: false,
}));
*/

//Now the CSP as defined by Colt - that'll do... 
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/de57pfhij/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/de57pfhij/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/de57pfhij/"
];
const fontSrcUrls = ["https://res.cloudinary.com/de57pfhij/"];

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", "blob:"],
                objectSrc: [],
                imgSrc: [
                    "'self'",
                    "blob:",
                    "data:",
                    "https://res.cloudinary.com/de57pfhij/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                    "https://images.unsplash.com/"
                ],
                fontSrc: ["'self'", ...fontSrcUrls],
                mediaSrc: ["https://res.cloudinary.com/de57pfhij/"],
                childSrc: ["blob:"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

//Use the sanitiser
// To remove data, use:
app.use(mongoSanitize());
//Passport
app.use(passport.initialize());
app.use(passport.session());
//Telling passport to use local stratergy and to use authenticate which is on the User model.
//authenticate() comes with Passport
passport.use(new LocalStrategy(User.authenticate()));

//Tell passport how to serialise and deserialise a user
//How to store and get a user from a session
//Both provided by Passport
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Flash middleware for all routes
app.use((req, res, next) => {
    //If you are not coming from the login or root, store it for possible redirection purposes later
    //As this runs for every cycle, we will always catch the correct page.
    if (!['/login', '/'].includes(req.originalUrl)) { //Not interested in login or root
        req.session.returnTo = req.originalUrl; //store the last page location
    }
    //Store the logged in user to our locals storage
    res.locals.currentUser = req.user;
    //Whatever is in success, save it to locals var
    res.locals.success = req.flash('success');
    //..and also error
    res.locals.error = req.flash('error');
    next();
})

//User routes
app.use('/', userRoutes);

//Use the Pubs routes
app.use('/pubs', pubRoutes);
//Comments routes with longer prefix
app.use('/pubs/:id/comments', commentRoutes);

//Home route
app.get('/', (req, res) => {
    res.render('home')
});

//404 Handler - anything on all routes
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found.', 404));
})

//Error Handling
app.use((err, req, res, next) => {
    //Our catch all message and status code
    const { statusCode = 500 } = err;
    if (!err.message) err.mesage = 'Something went wrong server side.';
    //respond with the code and whatever message was passed, using our template error.ejs
    res.status(statusCode).render('error', { err });
})

//Of cours, it has to listen
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}.`)
});