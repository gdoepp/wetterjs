// (c) Gerhard Döppert, 2017,
// SPDX-License-Identifier: GPL-3.0-or-later
var controller = require('./controller.js');

module.exports = function(app) {
	app.get('/wetter/', controller.stats);
	app.get('/wetter/auswahl', controller.aktuell);
	app.get('/wetter/aktuell', controller.aktuell);
	app.get('/wetter/stats', controller.stats);
	app.get('/wetter/listMonate', controller.listMonate);
	app.get('/wetter/listJahr', controller.listMonate);
	app.get('/wetter/listMonat', controller.listMonat);
	app.get('/wetter/downloadJahr', controller.listMonate);
	app.get('/wetter/downloadMonate', controller.listMonate);
	app.get('/wetter/downloadMonat', controller.listMonat);
	app.get('/wetter/downloadTag', controller.listTag);
	app.get('/wetter/listTag', controller.listTag);
	app.post('/wetter/update/:stat', controller.update);	
    app.post('/wetter/import/:stat', controller.importHist);
	app.post('/wetter/insert', controller.insertHome);
	app.options('/wetter/', controller.options);
	app.options('/wetter/stats', controller.options);
	app.options('/wetter/listMonate', controller.options);
	app.options('/wetter/listJahr', controller.options);
	app.options('/wetter/listMonat', controller.options);
	app.options('/wetter/listTag', controller.options);
	app.options('/wetter/auswahl', controller.options);
	app.options('/wetter/aktuell', controller.options);
};

