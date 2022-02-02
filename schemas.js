const baseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

//Define a Joi extension to use sanitise on string inputs
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});
//Add the extension
const Joi = baseJoi.extend(extension)

//Use Joi to validate the request against a schema - including rules - defined here
module.exports.pubSchema = Joi.object({
    pub: Joi.object({
        title: Joi.string().required().escapeHTML(),
        //price: Joi.number().required().min(0),
        //image: Joi.string().required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML(),
        garden: Joi.string(),
        food: Joi.string()
    }).required(),
    deleteImages: Joi.array()
});

//Review schema rules - note min and max for reciew score
module.exports.commentSchema = Joi.object({
    comment: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
})