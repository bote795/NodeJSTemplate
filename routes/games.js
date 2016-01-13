var express = require('express');
var router = express.Router();
var Game = require('../models/games/index');
var hbs = require('hbs')
  , fs = require('fs')
  , form = fs.readFileSync(__dirname + '/../views/games/_form.hbs', 'utf8');
hbs.registerPartial('formPartial', form); 

router.route('/games')
    .get(function(req, res) {
       Game.all(function (err, games) {
        if (err) {
            res.send(err);
        };
           res.send(games);
       })
    })
    .post(function(req, res) {
        Game.create(req,function(err, newGame) {
            if(err) {
                return res.send(500, err);
            }
            return res.json(newGame);
        });
    });

router.route('/games/:id')
    .put(function(req, res) {
        Game.put(req,function(err, game) {
                if(err) {
                    res.send(err);
                }
                res.json(game);
                //res.render('/groups')
            });
    })
    .get(function(req, res) {
        Game.get(req.params.id, function(err, game) {
            if(err) {
                res.send(err);
            }
            res.render('./game/edit', { view : { put: true, action: "/games/"+game._id}, game: game });
       		//res.json(game);
        });
    })
    .delete(function(req, res) {
      Game.delete(req.params.id, function(err){
        if (err) {
            res.send(err);
        }
        res.json('Deleted!');
      });
    });

module.exports = router;
