const Pub = require('../models/pub');
const Comment = require('../models/comment');

//Receiving the review data from the form
module.exports.createComment = async (req, res) => {
    //Get the pub from the id
    const pub = await Pub.findById(req.params.id);
    //create a new comment object
    const comment = new Comment(req.body.comment);
    //Set the author
    comment.author = req.user._id;
    //Push on to the array
    pub.comments.push(comment);
    //Save both the comment amd pub
    await comment.save();
    await pub.save();
    req.flash('success', 'Comment Added.');
    //Show the updated pub 
    res.redirect(`/pubs/${pub._id}`);
}

//Deleting a comment route
module.exports.deleteComment = async (req, res) => {
    const { id, commentId } = req.params;
    //Removes from the array ALL instances matching a condition - in this case pull
    //from the comments array, the commentId - cool.
    await Pub.findByIdAndUpdate(id, { $pull: { comments: commentId } });
    //Delete the comment
    await Comment.findByIdAndDelete(commentId);
    req.flash('success', 'Comment Removed.');
    //redirect to the pub
    res.redirect(`/pubs/${id}`);
}