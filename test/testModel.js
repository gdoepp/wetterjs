// (c) Gerhard Döppert, 2017, GNU GPL 3

var assert = require('assert')

var wetter = require('../js/model')
var pg = require('pg');

const pool = new pg.Pool(
		
		{	
		    user: 'www',
		    host: 'localhost',
		    database: 'pgdb',
		    password: process.env.PGPW,
		    port: 5432
	  
		});

wetter.setPg(pool);


describe('check db connection', function() {
  it('returns list of first year per station', function(done) {
	  var result = wetter.years();

    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
  });
});

describe('check monate', function() {
	  it('returns data for a year', function(done) {
		  var result = wetter.listMonate('2017','00000',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monate', function() {
	  it('returns data for a year - history', function(done) {
		  var result = wetter.listMonate('1999','01420',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check auswahl', function() {
	  it('returns data the latest hours', function(done) {
		  var result = wetter.auswahl('00000',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monat', function() {
	  it('returns data for a month', function(done) {
		  var result = wetter.listMonat('05.2017','01420',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag', function() {
	  it('returns data for a day', function(done) {
		  var result = wetter.listTag('01.05.2016','01.05.2016','01420',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monat', function() {
	  it('returns data for a month - history', function(done) {
		  var result = wetter.listMonat('05.2007','01420',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag', function() {
	  it('returns data for a day - history', function(done) {
		  var result = wetter.listTag('01.05.2003','01.05.2003','01420',1);

	    result.then((t)=>{assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

