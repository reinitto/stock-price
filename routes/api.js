/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
var stockHandler = require('../controllers/stockHandler')
var expect = require('chai').expect;
var mongoose = require('mongoose')
const CONNECTION_STRING = process.env.DB;
const db = mongoose.connect(CONNECTION_STRING,{ useNewUrlParser: true } , function(err, db) {return db});

module.exports = function (app) {
  stockHandler(app, db)
};
