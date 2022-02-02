//Require to use mongoose
const mongoose = require('mongoose');
const Comment = require('./comment');

//shortcut to save a little typing
const Schema = mongoose.Schema;

//WIP schema - comments references embedded
//61703078f19945db692f8bdd

//Example Cloudinary link with a 200 width limit
// https://res.cloudinary.com/douqbebwk/image/upload/w_300/v1600113904/YelpCamp/gxgle1ovzd2f3dgcpass.png

//Schema for images
const ImageSchema = new Schema({
    url: String,
    filename: String
});

//Virtual property on each image to be width 200 - clever!
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

//Need to get the virtual into JSON
const opts = { toJSON: { virtuals: true } };

//Note array of schema images
const PubSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    description: String,
    garden: String,
    food: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
}, opts)

//Virtual property for easier pin info on the map
PubSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/pubs/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

//Middleware to remove all associated comments when a pub is deleted
//Like a CRM postDelete plugin, the message must match - use docs to find which middleware to use.
PubSchema.post('findOneAndDelete', async function (doc) {
    //doc is what was deleted - useful, like a preImage
    if (doc) {
        await Comment.deleteMany({
            _id: {
                $in: doc.comments
            }
        })
    }
})

//Make sure this file exports the Schema
module.exports = mongoose.model('Pub', PubSchema);