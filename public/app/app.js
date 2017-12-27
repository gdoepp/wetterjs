//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';

var module = angular.module('wetterDB', ['ui.router', 'ngResource', 'tableSort']);

module.config(configFn);

configFn.$inject= ['$stateProvider', '$urlRouterProvider'];
function configFn($stateProvider, $urlRouterProvider) {
	
	console.log("in configFn");
	
	$urlRouterProvider.otherwise("/auswahl/00000");
	
	$stateProvider
	  .state('auswahl', {
		url: "/auswahl/:stat",	
		component: 'auswahlTable' 
	  });
	
	$stateProvider
	  .state('listMonate', {
		url: "/listMonate/:time/:stat",
		component: 'monateTable' 
	  });

	$stateProvider
	  .state('listMonateDT', {
		url: "/listMonateDT/:time/:stat",
		component: 'monateDT',
		data: 'temp' 
	  });
	
	$stateProvider
	  .state('listMonateDP', {
		url: "/listMonteDP/:time/:stat",
		component: 'monateDP',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonateDH', {
		url: "/listMonteDH/:time/:stat",
		component: 'monateDP',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonateDN', {
		url: "/listMonteDN/:time/:stat",
		component: 'monateDR',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonateDS', {
		url: "/listMonteDS/:time/:stat",
		component: 'monateDR',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonateDR', {
		url: "/listMonteDR/:time/:stat",
		component: 'monateDR',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonateDF', {
		url: "/listMonteDF/:time/:stat",
		component: 'monateDF',
		data: 'windf' 
	  });
	
	$stateProvider
	  .state('listMonat', {
		url: "/listMonat/:time/:stat",
		component: 'monatTable' 
	  });

	$stateProvider
	  .state('listMonatDT', {
		url: "/listMonatDT/:time/:stat",
		component: 'monatDT',
		data: 'temp' 
	  });
	
	$stateProvider
	  .state('listMonatDP', {
		url: "/listMonatDP/:time/:stat",
		component: 'monatDP',
		data: 'pres' 
	  });

	$stateProvider
	  .state('listMonatDH', {
		url: "/listMonatDH/:time/:stat",
		component: 'monatDP',
		data: 'hum_o' 
	  });
	
	$stateProvider
	  .state('listMonatDN', {
		url: "/listMonatDN/:time/:stat",
		component: 'monatDR',
		data: 'cloud' 
	  });

	$stateProvider
	  .state('listMonatDS', {
		url: "/listMonatDS/:time/:stat",
		component: 'monatDR',
		data: 'sun' 
	  });

	$stateProvider
	  .state('listMonatDR', {
		url: "/listMonatDR/:time/:stat",
		component: 'monatDR',
		data: 'precip' 
	  });

	$stateProvider
	  .state('listMonatDF', {
		url: "/listMonatDF/:time/:stat",		
		component: 'monatDF',	
		data: 'windf' 
	  });
	
	$stateProvider
	  .state('listTag', {
		url: "/listTag/:time/:stat",
		component: 'tagTable' 
	  });	
	
	$stateProvider
	  .state('listTagDT', {
		url: "/listTagDT/:time/:stat",
		component: 'tagDT',
		data: 'temp' 
	  });	

	$stateProvider
	  .state('listTagDP', {
		url: "/listTagDP/:time/:stat",
		component: 'tagDP',
		data: 'pres' 
	  });	

	$stateProvider
	  .state('listTageDP', {
		url: "/listTageDP/:time/:stat",
		component: 'tageDP',
		data: 'pres' 
	  });	

	$stateProvider
	  .state('listTagDH', {
		url: "/listTagDH/:time/:stat",
		component: 'tagDP',		
		data: 'hum_o' 
	  });	

	$stateProvider
	  .state('listTagDN', {
		url: "/listTagDN/:time/:stat",
		component: 'tagDR',
		data: 'cloud' 
	  });	

	$stateProvider
	  .state('listTagDS', {
		url: "/listTagDS/:time/:stat",
		component: 'tagDR',
		data: 'sun' 
	  });	

	$stateProvider
	  .state('listTagDR', {
		url: "/listTagDR/:time/:stat",
		component: 'tagDR',
		data: 'precip' 
	  });	
	
	$stateProvider
	  .state('listTagDF', {
		url: "/listTagDF/:time/:stat",
		component: 'tagDF',
		data: 'windf' 
	  });	

	$stateProvider
	  .state('update', {
		url: "/update/:stat",
		component: 'updateResult'
	  });	

	$stateProvider
	  .state('import', {
		url: "/import/:stat",
		component: 'importResult'
	  });	
}
