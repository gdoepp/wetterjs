//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';

var module = angular.module('wetterDB');

function prepareList(data) {
	for (var k=0; k<data.list.length; k++) {
    	var tv = data.list[k];
    	tv.windd = Math.round(tv.windd[1],0);
	}
}

function MonateTableController($state, $stateParams, listMonateFactory) {
	this.stat=$stateParams.stat;	
	this.time='Monate';
	this.data = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, prepareList);
}


function MonatTableController($state, $stateParams, listMonatFactory) {
	this.monat=$stateParams.time;
	this.stat=$stateParams.stat;	
	this.time='Monat';
	this.data = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, prepareList);
}

function TagTableController($state, $stateParams, listTagFactory) {
	var tag = new Tag($stateParams.time, 0);
	this.title = tag.title;
	this.stat=$stateParams.stat;	
	this.monat=tag.monat;
	this.time='Tag';
	this.data = listTagFactory.getListTag($stateParams.time, $stateParams.stat, prepareList);
}

function AuswahlTableController($state, $stateParams, auswahlFactory) {
	this.data = auswahlFactory.getAuswahl($stateParams.stat);
}

module.component('monateTable', {
  templateUrl: 'app/partials/monateTable.html',
  
  controller: MonateTableController
});

module.component('monatTable', {
	  templateUrl: 'app/partials/monatTable.html',
	  
	  controller: MonatTableController
	});


module.component('tagTable', {
  templateUrl: 'app/partials/tagTable.html',
  require: { parent: '^root'
  },
  controller: TagTableController
});

module.component('auswahlTable', {
	  templateUrl: 'app/partials/auswahlTable.html',
	  
	  controller: AuswahlTableController
	});


/**
 * 
 */