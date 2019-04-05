const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Root Route
router.get("/", function (req, res) {
  res.render("landing");
});

// SHOW register form
router.get('/register', (req, res) => {
  res.render('register', {
    page: 'register'
  });
});

// CREATE user
router.post('/register', (req, res) => {
  // get form input values
  let newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });

  // Check if is admin
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }

  // register method by passport-local-mongoose to register the user
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect('back');
    }
    console.log(user);
    passport.authenticate('local')(req, res, () => {
      req.flash("success", "Welcome to YelpCamp " + req.body.username);
      res.redirect('/campgrounds');
    });
  });
});

// SHOW login form
router.get('/login', (req, res) => {
  res.render('login', {
    page: 'login'
  });
});

// LOGIN user
router.post('/login', passport.authenticate('local', {
  successRedirect: '/campgrounds',
  failureRedirect: '/login'
}));

// LOGOUT user
router.get('/logout', (req, res) => {
  req.logout();
  req.flash("success", "See you later!");
  res.redirect('/campgrounds');
});

// SHOW forgout password
router.get('/forgot', (req, res) => {
  res.render('forgot');
});

// UPDATE forgout password
router.post('/forgot', (req, res, next) => {
  async.waterfall([
    // 1st function
    function (done) {
      // create token with a random hash
      crypto.randomBytes(20, (err, buf) => {
        let token = buf.toString('hex');
        done(err, token);
      });
    },
    // 2nd function
    function (token, done) {
      // Finde the user by the request email
      User.findOne({
        email: req.body.email
      }, (err, foundUser) => {
        if (!foundUser) {
          console.log(err);
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        // Set the token by the first function and the expire date
        foundUser.resetPasswordToken = token;
        foundUser.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        // save the user
        foundUser.save(err => {
          done(err, token, foundUser);
        });
      });
    },
    // 3th function (nodeMailer)
    function (token, user, done) {
      // Setup the Email
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'jacobojavier98@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      // Make the Email
      let mailOptions = {
        to: user.email,
        from: 'YelpCamp Admin <jacobojavier98@gmail.com>',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'https://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      // Send the Email
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        res.redirect('/campgrounds');
        done(err, 'done');
      });
    }
  ], function (err) { // callback of the post route
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// SHOW reset password form
router.get('/reset/:token', function (req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (!user) {
      console.log(err);
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    // render the reset template
    res.render('reset', {
      token: req.params.token
    });
  });
});

// UPDATE the new password
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    // 1st function
    function (done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!user) {
          console.log(err);
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        // If the new password match with the confirm password
        if (req.body.password === req.body.confirm) {
          // Set new password to user model 
          user.setPassword(req.body.password, function (err) {
            if (err) console.log(err);

            // reset these values
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // Save the user
            user.save(function (err) {
              if (err) console.log('error saving the user: ' + err);
              // Log In the user
              req.logIn(user, function (err) {
                if (err) console.log(err);
                done(err, user);
              });
            });
          });
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    // 2nd function (nodeMailer)
    function (user, done) {
      // Setup the Email
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'jacobojavier98@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      // Make the Email
      let mailOptions = {
        to: user.email,
        from: 'YelpCamp Admin <jacobojavier98@gmail.com>',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      // Send the Email
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) { // callback of the post route
    res.redirect('/campgrounds');
  });
});

// SHOW user profile
router.get('/users/:id', (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err) {
      req.flash("error", "This user no longer exists.");
      return res.redirect('back');
    }

    Campground.find().where('author.id').equals(foundUser._id).exec((err, campgrounds) => {
      if (err) {
        console.log(err);
        req.flash("error", err.message);
        return res.redirect('back');
      }

      res.render('users/show', {
        user: foundUser,
        campgrounds: campgrounds
      });
    });

  });
});

module.exports = router;