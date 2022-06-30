const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserModelSchema = new Schema({ 
    _id: String,
    DisplayName: String,
    Username: String,
    StudentId: String,
    CodeForces: String,
    CodeChef: String,
    CcRating: Number,
    CfRating: Number,
    ClassPoint: Number,
    Rating: Number,
    IsActive: Boolean,
    IsAdmin: Boolean,
    IsRoot: Boolean,
}, {
    versionKey: false,
    collection: 'Users'
});

module.exports = mongoose.model('User', UserModelSchema);