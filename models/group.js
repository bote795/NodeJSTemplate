var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Group = new Schema({
    name: String,
    desc: String,
    player_inv: [{ username: String, _Id: mongoose.Schema.Types.objectId, ref: 'Account'}],
    game_inv: [{ name: String, _Id: mongoose.Types.Schema.objectId, ref: 'Game'}],
});

module.exports = mongoose.model('Group', Group);
