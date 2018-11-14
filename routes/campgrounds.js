const express    = require("express"),
      router     = express.Router(),
      Campground = require("../models/campground"),
      middleware = require("../middleware/index");
      
// Multer Setup
const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

// Cloudinary Setup
const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dxvpgpgoq', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



// GET Campgrounds
router.get("/", (req,res) => {
    if(req.query.search) {
        // Get the query formatted
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get only the campgrounds name with the query search
        Campground.find({name: regex}, (err, allCampgrounds) => {
            if(err){
                console.log(err);
            } else {
                // If the query doesnt match any campgrounds
                if(allCampgrounds.length < 1){
                    req.flash("error", "Sorry, no campgrounds match your query. Please try again");
                    return res.redirect('back');
                }
                // Render the campgrounds page
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, (err, allCampgrounds) => {
            if(err){
            console.log(err);
            } else {
            // Render
            res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
            }
        });
    }
});

// NEW Campground
router.get("/new", middleware.isLoggedIn, (req,res) => {
  res.render("campgrounds/new");
});

// CREATE Campground
router.post("/", middleware.isLoggedIn, upload.single('image'), (req,res) => {
    // Upload file to cloudinary
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add image's public id to campground object
        req.body.campground.imageId = result.public_id;
        
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        };
        // Create campground and save to the DB
        Campground.create(req.body.campground, function(err, newlyCampground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            // Redireccion al campground creado
            req.flash("success", "Campground Succesfully Created!");
            res.redirect('/campgrounds/' + newlyCampground._id);
        });
    });
});

// SHOW Campground
router.get('/:id', (req, res) => {
    // Find the campground with provided ID
    let id = req.params.id;
    // Convert comment's campground to a full information comment data
    Campground.findById(id).populate('comments').exec((err, selectedCampground) => {
        if(err){
            console.log(err);
            req.flash("error", "Cant find the selected campground");
            return res.redirect('/campgrounds');
        } else {
            // Render the template
            res.render('campgrounds/show', {campground: selectedCampground});
        }
    });
});

// EDIT Campground
router.get('/:id/edit', middleware.checkCampgroundOwner, (req, res) => {
    // if checkCampgroundOwner returns true:
    Campground.findById(req.params.id).populate('comments').exec((err, selectedCampground) => {
        res.render('campgrounds/edit', {campground: selectedCampground}); 
    });
});

// UPDATE Campground
router.put('/:id', middleware.checkCampgroundOwner, upload.single('image'), (req, res) => {
    // find by id campground
    Campground.findById(req.params.id, async function(err, campground) {
        if(err){
            console.log(err);
            req.flash('error', err.message);
            res.redirect('back');
        } else {
            // Si existe una imagen de cloudinary
            if (req.file) {
              try {
                  // Eliminar la imagen en cloudinary   
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  // Obtener el file desde el formulario de update y subirlo a cloudinary
                  let result = await cloudinary.v2.uploader.upload(req.file.path);
                  // Hacer update de la imagen en nuestro objeto (campground) de la DB
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            // Despues de obtener respuesta del async de cloudinary, hacer update a los demas fields:
            campground.name = req.body.campground.name;
            campground.price = req.body.campground.price;
            campground.description = req.body.campground.description;
            campground.save();
            // Hacer redireccion
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// DESTROY Campground
router.delete('/:id', middleware.checkCampgroundOwner, (req, res) => {
    // find by id campground to remove
    Campground.findById(req.params.id, async (err, campground) => {
        if(err){
            console.log(err);
            req.flash('error', err.message);
            return res.redirect('back');
        } else {
            try {
                // Eliminar la imagen en cloudinary   
                await cloudinary.v2.uploader.destroy(campground.imageId);
                // Delete campground
                campground.remove();
                // Hacer redireccion
                req.flash("success","Campground Successfully Removed");
                res.redirect("/campgrounds");
            } catch(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

// Regex Cleaner Function (for Fuzzy Search feature)
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;