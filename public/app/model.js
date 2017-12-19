//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';
angular.module('wetterDB')
 .factory('statsFactory', statsFactory)
 .factory('auswahlFactory', auswahlFactory)
 .factory('listMonateFactory', listMonateFactory)
 .factory('listMonatFactory', listMonatFactory)
 .factory('listTagFactory', listTagFactory)
 .factory('updateFactory', updateFactory);

statsFactory.$inject = ['$http'];

function statsFactory($http) {
	return {
		getStats: function() {
			var result = {};
			console.log("get stats")
			$http.get('wetter/stats')
			.then( function success(resp) {
				result.admin=resp.data.admin;			
				result.stats=resp.data.stats;
				result.stat=resp.data.stat;
			}, function error(resp) {
				result.stats = undefined;
				result.admin = 0;
			});
			return result;
		}
	}	
}

auswahlFactory.$inject = ['$http'];

function auswahlFactory($http) {
	return {
		getAuswahl: function(stat) {
			var result = {};
			$http.get('wetter/auswahl?stat='+stat)
			.then( function success(resp) {
				result.list=resp.data.rows;
				
				if (result.list.length > 2) {
					var t = new Date(result.list[1].mtime);
					result.tag = t.getDate() + '.' + (t.getMonth()+1) + '.' + t.getFullYear();
				}
			}, function error(resp) {
				result.list = undefined;
			});
			return result;
		},
		getAuswahlP: function(stat) {
			return $http.get('wetter/auswahl?stat='+stat);
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
			$http.get('wetter/listTag?tag='+tag +'&stat='+stat)
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
				result.result = resp.data;
			}, function error(resp) {
				result.result = { update: -2 };
			});
			return result;
		}				
	};
}
