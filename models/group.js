var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Group = new Schema({
    name: String,
    desc: String,
    player_inv: [],
    game_inv: [],
});

module.exports = mongoose.model('Group', Group);
