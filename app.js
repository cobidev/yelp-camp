const express = require("express");
const app = express();
const expressSession = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const seedDB = require("./seeds");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");

// Requiring ENV Variables (development mode)
if (app.get('env') === 'development') {
  require('dotenv').config();
}

// Schema/Models DB
const User = require("./models/user");

// Requiring Routes
const indexRoutes = require("./routes/index");
const campgroundRoutes = require("./routes/campgrounds");
const commentRoutes = require("./routes/comments");

// DB Connect
const url = process.env.DATABASEURL || "mongodb://localhost:27017/yelp-camp";
mongoose.set('useCreateIndex', true);
mongoose.connect(url, {
  useNewUrlParser: true
});

// View Engine
app.set("view engine", "ejs");

// Middlewares
app.use(bodyParser.urlencoded({
  extended: true
}));
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