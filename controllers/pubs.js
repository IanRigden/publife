const Pub = require('../models/pub');

//Mapbox stuff
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const { cloudinary } = require("../cloudinary");

//Pubs Index - all of 'em
module.exports.index = async (req, res) => {
    //Get all the pubs
    const pubs = await Pub.find({});
    //render the page, passing in the pubs array of objects
    res.render('pubs/index', { pubs });
}

//Show a blank form for a new pub - has to come before the /id route
//Pass middleware into the function to use that
module.exports.renderNewForm = (req, res) => {
    res.render('pubs/new');
}

//Now the route for the data coming back to be written to the db
//use our validatePub for the server side validation
module.exports.createPub = async (req, res, next) => {
    //If there is not a correct pub object, throw an error before it gets to Mongo - now redundant by validatePub()
    //if (!req.body.pub) throw new ExpressError('Invalid pub data', 400);

    //Get the geocode information for the address:
    const geoData = await geocoder.forwardGeocode({
        query: req.body.pub.location,
        limit: 1
    }).send()

    //The benefit of grouping as "Pub" in the form data...
    const pub = new Pub(req.body.pub);
    //Geo data comes as JSON from MapBox so store as is
    pub.geometry = geoData.body.features[0].geometry;
    //Which image files 
    pub.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    pub.author = req.user._id;
    //save it
    await pub.save();
    req.flash('success', 'Pub Added.');

    //Redirect to the form showing the newly created pub
    res.redirect(`/pubs/${pub._id}`);

}

//Show route for a single pub
module.exports.showPub = async (req, res) => {
    //Note we populate the two relations - reviews and author....and reviews
    const pub = await Pub.findById(req.params.id).populate({
        path: 'comments',
        populate: {
            path: 'author'
        }
    }).populate('author');
    //console.log(pub);
    if (!pub) {
        req.flash('error', 'No such pub.');
        return res.redirect('/pubs');
    }
    res.render('pubs/show', { pub });
}

//Edit, find the pub we are going to edit and display
module.exports.renderEditForm = async (req, res) => {
    const pub = await Pub.findById(req.params.id);
    if (!pub) {
        req.flash('error', 'No such pub.');
        return res.redirect('/pubs');
    }
    res.render('pubs/edit', { pub });
}

//Received the edited data, now need to write that to the db
//use our validatePub for the server side validation
module.exports.updatePub = async (req, res) => {
    //deconstruct the id
    const { id } = req.params;
    //Update by using spread (...) to populate the fields we wish to update - another use of grouping as "Pub"
    const pub = await Pub.findByIdAndUpdate(id, { ...req.body.pub });
    //Push the images onto the pub
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    //spread onto the existing array
    pub.images.push(...imgs);
    //and save
    await pub.save();
    //Remove images from Cloudinary
    //If any are to be deleted
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        //Update the record by pulling the images with a matching filename in those to be deleted
        await pub.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Pub Updated.');
    res.redirect(`/pubs/${pub._id}`);
}

//And the delete route - currently just deleting with no checks etc
module.exports.deletePub = async (req, res) => {
    //deconstruct the id
    const { id } = req.params;
    //Just delete it
    await Pub.findByIdAndDelete(id);
    req.flash('success', 'Pub Deleted.');
    res.redirect('/pubs');
}