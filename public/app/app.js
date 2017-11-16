//  (c) Gerhard Döppert, 2017

'use strict';
angular.module('wetterDB', ['ui.router', 'ngResource'])
.config(configFn);

console.log("config app");

configFn.$inject= ['$stateProvider', '$urlRouterProvider'];

function configFn($stateProvider, $urlRouterProvider) {
	
	console.log("in configFn");
	
	$urlRouterProvider.otherwise("/auswahl/00000");
	
	$stateProvider
	  .state('auswahl', {
		url: "/auswahl/:stat",
		templateUrl: 'app/partials/auswahl.html',
		controller: 'AuswahlController',
		controllerAs: 'auswahlController'
	  });
	
	$stateProvider
	  .state('listMonate', {
		url: "/listMonate/:time/:stat",
		templateUrl: 'app/partials/listMonate.html',
		controller: 'ListMonateController',
		controllerAs: 'listMonateController'
	  });

	$stateProvider
	  .state('listMonateDT', {
		url: "/listMonateDT/:time/:stat",
		templateUrl: 'app/partials/listMonateDT.html',
		controller: 'ListMonateDTController',
		controllerAs: 'listMonateDTController',
		data: 'temp' 
	  });
	
	$stateProvider
	  .state('listMonateDP', {
		url: "/listMonteDP/:time/:stat",
		templateUrl: 'app/partials/listMonateDP.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonateDH', {
		url: "/listMonteDH/:time/:stat",
		templateUrl: 'app/partials/listMonateDP.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonateDN', {
		url: "/listMonteDN/:time/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonateDS', {
		url: "/listMonteDS/:time/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonateDR', {
		url: "/listMonteDR/:time/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonateDF', {
		url: "/listMonteDF/:time/:stat",
		templateUrl: 'app/partials/listMonateDF.html',
		controller: 'ListMonateDFController',
		controllerAs: 'listMonateDPController',
		data: 'windf' 
	  });

	
	$stateProvider
	  .state('listMonat', {
		url: "/listMonat/:time/:stat",
		templateUrl: 'app/partials/listMonat.html',
		controller: 'ListMonatController',
		controllerAs: 'listTageController'
	  });

	$stateProvider
	  .state('listMonatDT', {
		url: "/listMonatDT/:time/:stat",
		templateUrl: 'app/partials/listTageDT.html',
		controller: 'ListMonatDTController',
		controllerAs: 'listTageDTController',
		data: 'temp' 
	  });
	
	$stateProvider
	  .state('listMonatDP', {
		url: "/listMonatDP/:time/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonatDH', {
		url: "/listMonatDH/:time/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonatDN', {
		url: "/listMonatDN/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonatDS', {
		url: "/listMonatDS/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonatDR', {
		url: "/listMonatDR/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonatDF', {
		url: "/listMonatDF/:time/:stat",
		templateUrl: 'app/partials/listTageDF.html',
		controller: 'ListMonatDFController',
		controllerAs: 'listTageDPController',
		data: 'windf' 
	  });

	
	$stateProvider
	  .state('listTag', {
		url: "/listTag/:time/:stat",
		templateUrl: 'app/partials/listTag.html',
		controller: 'ListTagController',
		controllerAs: 'listTagController'
	  });	
	
	$stateProvider
	  .state('listTagDT', {
		url: "/listTagDT/:time/:stat",
		templateUrl: 'app/partials/listTageDT.html',
		controller: 'ListTagDTController',
		controllerAs: 'listTageDTController',
		data: 'temp' 
	  });	

	$stateProvider
	  .state('listTagDP', {
		url: "/listTagDP/:time/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'pres' 
	  });	

	$stateProvider
	  .state('listTagDH', {
		url: "/listTagDH/:time/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'hum_o' 
	  });	

	$stateProvider
	  .state('listTagDN', {
		url: "/listTagDN/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'cloud' 
	  });	

	$stateProvider
	  .state('listTagDS', {
		url: "/listTagDS/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'sun' 
	  });	

	$stateProvider
	  .state('listTagDR', {
		url: "/listTagDR/:time/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'precip' 
	  });	
	
	$stateProvider
	  .state('listTagDF', {
		url: "/listTagDF/:time/:stat",
		templateUrl: 'app/partials/listTageDF.html',
		controller: 'ListTagDFController',
		controllerAs: 'listTageDPController',
		data: 'windf' 
	  });	
	
	$stateProvider
	  .state('update', {
		url: "/update/:stat",
		templateUrl: 'app/partials/auswahl.html',
		controller: 'UpdateController',
		controllerAs: 'updateController'
	  });	

}
