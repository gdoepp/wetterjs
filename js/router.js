var controller = require('./controller.js');

module.exports = function(app) {
	app.get('/wetter/auswahl', controller.auswahl);
	app.get('/wetter/listMonate', controller.listMonate);
	app.get('/wetter/listMonateWind', controller.listMonateWind);
	app.get('/wetter/listMonat', controller.listMonat);
	app.get('/wetter/listTag', controller.listTag);
	app.post('/wetter/update/:stat', controller.update);
};

