// (c) Gerhard Döppert, 2017, GNU GPL 3

var controller = require('./controller.js');

module.exports = function(app) {
	app.get('/wetter/auswahl', controller.auswahl);
	app.get('/wetter/stats', controller.stats);
	app.get('/wetter/listMonate', controller.listMonate);
	app.get('/wetter/listMonat', controller.listMonat);
	app.get('/wetter/listTag', controller.listTag);
	app.post('/wetter/update/:stat', controller.update);	
	app.post('/wetter/import/:stat', controller.importHist);
	app.post('/wetter/insert', controller.insertHome);
};

