const express = require('express');
const router = express.Router();
const pubs = require('../controllers/pubs.js');
const catchAsync = require('../utils/catchAsync');
//Require our middleware isLoggedIn, isAuthor & validatePub functions
const { isLoggedIn, isAuthor, validatePub } = require('../middleware');
//Multer middleware for cloudinary
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

//const Pub = require('../models/pub');

router.route('/')
    //Index
    .get(catchAsync(pubs.index))
    //Create
    .post(isLoggedIn, upload.array('image'), validatePub, catchAsync(pubs.createPub))

//New
router.get('/new', isLoggedIn, pubs.renderNewForm)

router.route('/:id')
    //Show route for a single pub
    .get(catchAsync(pubs.showPub))
    //Received the edited data, now need to write that to the db
    //use our validatePub for the server side validation
    .put(isLoggedIn, isAuthor, upload.array('image'), validatePub, catchAsync(pubs.updatePub))
    //And the delete route - currently just deleting with no checks etc
    .delete(isLoggedIn, isAuthor, catchAsync(pubs.deletePub));

//Edit, find the pub we are going to edit and display
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(pubs.renderEditForm))

module.exports = router;