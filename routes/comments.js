const express = require('express');
//mergeParams must be true to access the id in the router path from this route
const router = express.Router({ mergeParams: true });
const { validateComment, isLoggedIn, isCommentAuthor } = require('../middleware');
const { commentSchema } = require('../schemas.js');

const Pub = require('../models/pub');
const Comment = require('../models/comment');
const comments = require('../controllers/comments');

const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');

//Receiving the review data from the form
router.post('/', isLoggedIn, validateComment, catchAsync(comments.createComment));

//Deleting a comment route
router.delete('/:commentId', isLoggedIn, isCommentAuthor, catchAsync(comments.deleteComment));

module.exports = router;