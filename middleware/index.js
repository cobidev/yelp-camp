const Campground = require("../models/campground");
const Comment = require("../models/comment");

const middlewareObj = {};

// Check if user is Logged In
middlewareObj.isLoggedIn = function (req, res, next) { // check if user is logged in
    if( req.isAuthenticated() ) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that"); // Add this flash to the next request
    res.redirect('/login');
};

// Check if Campground Owner is the same of the Logged User
middlewareObj.checkCampgroundOwner = function (req, res, next) {
    // If user is logged in
    if (req.isAuthenticated()) {
        // Find the campground with provided ID
        let id = req.params.id;
        // Convert comment's campground to a full information comment data
        Campground.findById(id, (err, selectedCampground) => {
            if(err){
                req.flash("error", "Campground Not Found");
                res.redirect('back');
            } else {
                // If user is the same author of the campground
                if ( selectedCampground.author.id.equals(req.user._id) || req.user.isAdmin ) {
                    // Continue the request
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect('/campgrounds/' + req.params.id);
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect('/login');
    }
};

// Check if Comment Owner is the same of the Logged User
middlewareObj.checkCommentOwner = function (req, res, next) {
    // If user is logged in
    if (req.isAuthenticated()) {
        // Find the comment ID in the params
        let commentId = req.params.comment_id;
        
        // Find the comment with provided ID
        Comment.findById(commentId, (err, foundComment) => {
            if(err){
                console.log(err);
                req.flash("error", "Comment Not Found");
                res.redirect('back');
            } else {
                // If user is the same author of the comment
                if ( foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    // Continue the request
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect('/campgrounds/' + req.params.id);
                }
            }
        });
    // If user not authenticate
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect('/login');
    }
};

module.exports = middlewareObj;