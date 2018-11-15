const express        = require("express"),
      app            = express(),
      expressSession = require("express-session"),
      flash          = require("connect-flash"),
      passport       = require("passport"),
      bodyParser     = require("body-parser"),
      mongoose       = require("mongoose"),
      seedDB         = require("./seeds"),
      LocalStrategy  = require("passport-local"),
      methodOverride = require("method-override");
      
// Requiring ENV Variables (development mode)
if(app.get('env') === 'development') {
  require('dotenv').config();
}
      
// Schema/Models DB
const Campground = require("./models/campground"),
      Comment    = require("./models/comment"),
      User       = require("./models/user");
      
// Requiring Routes
const indexRoutes = require("./routes/index"),
      campgroundRoutes = require("./routes/campgrounds"),
      commentRoutes = require("./routes/comments");
      
// DB Connect
mongoose.connect(process.env.DATABASEURL);

// View Engine
app.set("view engine", "ejs");

// Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// Moment.JS
app.locals.moment = require('moment');

// Passport Setup
app.use(expressSession({
    secret: 'lala',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // initialize passport session

passport.use(new LocalStrategy(User.authenticate())); // tell passport to use a new local-strategy from the User model

passport.serializeUser(User.serializeUser()); // responsable for reading the data from the session that's un-encoded to encoded it
passport.deserializeUser(User.deserializeUser()); // responsable for reading the data from the session that's encoded to un-encoded it

// static middleware for all request (routes) passing a local variable (currentUser) with the req.user method from passport to check the current state
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.errorMessage = req.flash("error");
    res.locals.successMessage = req.flash("success");
    next();
});

// seedDB(); // Seed the DB

// Routes Setup
app.use('/', indexRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);

// Server Setup
app.listen(process.env.PORT || 3000, process.env.IP, () => {
  console.log("Yelp Camp Server Started...");
});