// (c) Gerhard Döppert, 2017, GNU GPL 3

var assert = require('assert')

var wetter = require('../js/model')
var wetter_i = require('../js/model_i')
var updater = require('../js/updater')
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
wetter_i.setPg(pool);

describe('check db connection', function() {
  it('returns list of first year per station', function(done) {
	  var result = wetter.years();

    result.then((t)=>{ assert.ok(t.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
  });
});

describe('check stationen', function() {
	  it('returns list of stations', function(done) {
		  var result = updater.getStats();

	     assert.ok(result.length>0, 'result empty'); done();
	  });
	});


describe('check monate', function() {
	  it('returns data for a year', function(done) {
		  var result = wetter_i.listMonate('2017','00000',1);

	    result.then((t)=>{assert.ok(t.rows.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monate', function() {
	  it('returns data for a year - history', function(done) {
		  var result = wetter.listMonate('1999','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length==12, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check aktuell', function() {
	  it('returns data the latest hours', function(done) {
		  var result = wetter_i.aktuell('00000',1);

	    result.then((t)=>{assert.ok(t.rows.length>0, 'result empty'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monat', function() {
	  it('returns data for a month', function(done) {
		  var result = wetter.listMonat('05.2017','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length==31, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag', function() {
	  it('returns data for a day', function(done) {
		  var result = wetter.listTag('01.05.2016','01.05.2016','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length>20, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag', function() {
	  it('returns data for a day, check links', function(done) {
		  var result = wetter.listTag('01.05.2016','01.05.2016','01420',1);

	    result.then(
	    		(t)=>{
	    			assert.ok(t.links && t.links.length>0, 'links missing');
	    			var nxtlink;
	    			var uplink;
	    			var prvlink;
	    			for (var j=0; j<t.links.length; j++) {
	    				if (t.links[j].rel=='nxt') nxtlink = t.links[j].href;
	    				if (t.links[j].rel=='prv') prvlink = t.links[j].href;
	    				if (t.links[j].rel=='up') uplink = t.links[j].href;
	    			}
	    			assert.ok(nxtlink && uplink && prvlink, 'next/prev/up link missing');
	    			done();
	    			}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag-3T', function() {
	  it('returns data for three days', function(done) {
		  var result = wetter.listTag('30.04.2017','02.05.2017','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length>70, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag-3T local', function() {
	  it('returns data for three days', function(done) {
		  var result = wetter_i.listTag('30.06.2017','02.07.2017','00000',1);

	    result.then((t)=>{assert.ok(t.rows.length > 285, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check monat', function() {
	  it('returns data for a month - history', function(done) {
		  var result = wetter.listMonat('05.2007','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length==31, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

describe('check tag', function() {
	  it('returns data for a day - history', function(done) {
		  var result = wetter.listTag('01.05.2003','01.05.2003','01420',1);

	    result.then((t)=>{assert.ok(t.rows.length>20, 'missing rows'); done();}, (err)=>{assert.fail(err)});
	  });
	});

