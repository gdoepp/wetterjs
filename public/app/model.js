'use strict';
angular.module('wetterDB')
 .factory('auswahlFactory', auswahlFactory)
 .factory('listMonateFactory', listMonateFactory)
 .factory('listMonatFactory', listMonatFactory)
 .factory('listTagFactory', listTagFactory)
 .factory('updateFactory', updateFactory);

auswahlFactory.$inject = ['$http'];

function auswahlFactory($http) {
	return {
		getAuswahl: function() {
			var result = {};
			$http.get('wetter/auswahl')
			.then( function success(resp) {
				result.list=resp.data.rows;
				result.admin=resp.data.admin;			
				if (result.list.length > 0) {
					var t = new Date(result.list[0].time_d);
					result.tag = t.getDate() + '.' + (t.getMonth()+1) + '.' + t.getFullYear();
				}
			}, function error(resp) {
				result.auswahl = undefined;
			});
			return result;
		}
	}	
}


listMonateFactory.$inject = ['$http'];

function listMonateFactory($http) {
	return {
		getListMonate: function(jahr, stat, prepare, typ, feld) {
			var result = {};
			$http.get('wetter/listMonate?jahr='+jahr+'&stat='+stat)
			.then( function success(resp) {
				result.list=resp.data;
				if (prepare) {
					prepare(result, typ, feld);
				}
			}, function error(resp) {
				result.list = undefined;
			});
			return result;
		}				
	};
}




listMonatFactory.$inject = ['$http'];

function listMonatFactory($http) {
	return {
		getListMonat: function(monat, stat, prepare, typ,feld) {
			var result = {};
			$http.get('wetter/listMonat?monat='+monat+'&stat='+stat)
			.then( function success(resp) {
				result.list=resp.data;
				if (prepare) {
					prepare(result, typ, feld);
				}
			}, function error(resp) {
				result.list = undefined;
			});
			return result;
		}				
	};
}

listTagFactory.$inject = ['$http'];

function listTagFactory($http) {
	return {
		getListTag: function(tag, stat, prepare, typ, feld) {
			var result = {};
			$http.get('wetter/listTag?tag='+tag+'&stat='+stat)
			.then( function success(resp) {
				result.list=resp.data;
				if (prepare) {
					prepare(result, typ, feld);
				}
			}, function error(resp) {
				result.list = undefined;
			});
			return result;
		}				
	};
}

updateFactory.$inject = ['$http'];

function updateFactory($http) {
	return {
		update: function(statid) {
			var result = {};
			$http.post('wetter/update/'+statid)
			.then( function success(resp) {
				result.list=resp.result;
			}, function error(resp) {
				result.list = undefined;
			});
			return result;
		}				
	};
}
