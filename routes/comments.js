const express    = require("express"),
      router     = express.Router({mergeParams: true}), // mergeParams allows use any (req.params.id) inside of app.use() function
      Campground = require("../models/campground"),
      Comment    = require("../models/comment"),
      middleware = require("../middleware/index");
      
// NEW Comment
router.get("/new", middleware.isLoggedIn, (req, res) => {
    let id = req.params.id;
    // Find by ID the selected campground
    Campground.findById(id, (err, campground) => {
        if (err) {
            console.log(err);
        } else {
            res.render('comments/new', {campground: campground});
        }
    });
});

// CREATE Comment
router.post("/", middleware.isLoggedIn, (req, res) => {
    
    // lookup campground using id
    Campground.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
            res.redirect('/campgrounds');
        } else {
            // Obtener Data desde el formulario
            let newComment = req.body.comment;
            // create new comment
            Comment.create(newComment, (err, comment) => {
                if(err) {
                    console.log(err);
                    req.flash("error", "Error creating the comment");
                    res.redirect('back');
                } else {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    // connect new comment to campground
                    campground.comments.push(comment);
                    campground.save();
                    // redirect
                    req.flash("success", "Succesfully added a comment");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

// EDIT Comment
router.get('/:comment_id/edit', middleware.checkCommentOwner, (req, res) => {
    // get the comment and campground ID
    let commentId    = req.params.comment_id;
    let campgroundId = req.params.id;
    
    // Find the comment by id
    Comment.findById(commentId, (err, foundComment) => {
        if(err) {
            res.redirect('back');
        } else {
            res.render('comments/edit', {
                campground_id: campgroundId,
                comment: foundComment
            });
        }
    });
});

// UPDATE Comment
router.put('/:comment_id', middleware.checkCommentOwner, (req, res) => {
    // get the updated comment from the form
    let commentId = req.params.comment_id;
    let updatedComment = req.body.comment;
    
    // find by id and update campground
    Comment.findByIdAndUpdate(commentId, updatedComment, (err, comment) => {
        if(err){
            res.redirect('back');
        } else {
            req.flash("success", "Comment Succesfully Updated!");
            // redirect to (show page)
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

// DESTROY Campground
router.delete('/:comment_id', middleware.checkCommentOwner, (req, res) => {
    // get comment ID
    let commentId = req.params.comment_id;
    
    // find by id and remove campground
    Comment.findByIdAndRemove(commentId, (err) => {
        if(err){
            console.log(err);
            res.redirect('back');
        } else {
            req.flash("success", "Comment deleted");
            // redirect to campgrounds page
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

module.exports = router;