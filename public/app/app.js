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
		url: "/listMonate/:jahr/:stat",
		templateUrl: 'app/partials/listMonate.html',
		controller: 'ListMonateController',
		controllerAs: 'listMonateController'
	  });

	$stateProvider
	  .state('listMonateDT', {
		url: "/listMonateDT/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDT.html',
		controller: 'ListMonateDTController',
		controllerAs: 'listMonateDTController'
	  });
	
	$stateProvider
	  .state('listMonateDP', {
		url: "/listMonteDP/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDP.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonateDH', {
		url: "/listMonteDH/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDP.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonateDN', {
		url: "/listMonteDN/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonateDS', {
		url: "/listMonteDS/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonateDR', {
		url: "/listMonteDR/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDR.html',
		controller: 'ListMonateDPController',
		controllerAs: 'listMonateDPController',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonateDF', {
		url: "/listMonteDF/:jahr/:stat",
		templateUrl: 'app/partials/listMonateDF.html',
		controller: 'ListMonateDFController',
		controllerAs: 'listMonateDPController',
		data: 'windf' 
	  });

	
	$stateProvider
	  .state('listMonat', {
		url: "/listMonat/:monat/:stat",
		templateUrl: 'app/partials/listMonat.html',
		controller: 'ListMonatController',
		controllerAs: 'listTageController'
	  });

	$stateProvider
	  .state('listMonatDT', {
		url: "/listMonatDT/:monat/:stat",
		templateUrl: 'app/partials/listTageDT.html',
		controller: 'ListMonatDTController',
		controllerAs: 'listTageDTController'
	  });
	
	$stateProvider
	  .state('listMonatDP', {
		url: "/listMonatDP/:monat/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonatDH', {
		url: "/listMonatDH/:monat/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonatDN', {
		url: "/listMonatDN/:monat/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonatDS', {
		url: "/listMonatDS/:monat/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonatDR', {
		url: "/listMonatDR/:monat/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListMonatDPController',
		controllerAs: 'listTageDPController',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonatDF', {
		url: "/listMonatDF/:monat/:stat",
		templateUrl: 'app/partials/listTageDF.html',
		controller: 'ListMonatDFController',
		controllerAs: 'listTageDPController',
		data: 'windf' 
	  });

	
	$stateProvider
	  .state('listTag', {
		url: "/listTag/:tag/:stat",
		templateUrl: 'app/partials/listTag.html',
		controller: 'ListTagController',
		controllerAs: 'listTagController'
	  });	
	
	$stateProvider
	  .state('listTagDT', {
		url: "/listTagDT/:tag/:stat",
		templateUrl: 'app/partials/listTageDT.html',
		controller: 'ListTagDTController',
		controllerAs: 'listTageDTController'
	  });	

	$stateProvider
	  .state('listTagDP', {
		url: "/listTagDP/:tag/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'pres' 
	  });	

	$stateProvider
	  .state('listTagDH', {
		url: "/listTagDH/:tag/:stat",
		templateUrl: 'app/partials/listTageDP.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'hum_o' 
	  });	

	$stateProvider
	  .state('listTagDN', {
		url: "/listTagDN/:tag/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'cloud' 
	  });	

	$stateProvider
	  .state('listTagDS', {
		url: "/listTagDS/:tag/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'sun' 
	  });	

	$stateProvider
	  .state('listTagDR', {
		url: "/listTagDR/:tag/:stat",
		templateUrl: 'app/partials/listTageDR.html',
		controller: 'ListTagDPController',
		controllerAs: 'listTageDPController',
		data: 'precip' 
	  });	
	
	$stateProvider
	  .state('listTagDF', {
		url: "/listTagDF/:tag/:stat",
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
