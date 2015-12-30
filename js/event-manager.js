/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var app = angular.module('eventManager', ['indexedDB']);

  /**
   * IndexedDB-Configuration
   */
  app.config(function($indexedDBProvider) {
    var db = $indexedDBProvider.connection('EventManagerDB');

    // ~~~ Create initial database version
    db.upgradeDatabase(1, function(pEvent, pDatabase, pTransaction) {
      pDatabase.createObjectStore('Event', {keyPath: 'person_id', autoIncrement: true});
      pDatabase.createObjectStore('Event_Equip', {keyPath: ['person_id', 'equipment_id']});
      pDatabase.createObjectStore('Equipment', {keyPath: 'equipment_id'});
      pDatabase.createObjectStore('Location', {keyPath: 'location_id'});
      pDatabase.createObjectStore('Tracklist', {keyPath: 'tracklist_id'});
      pDatabase.createObjectStore('Tracklist_Track', {keyPath: ['tracklist_id','track_id']});
      pDatabase.createObjectStore('Track', {keyPath: 'track_id'});
    });
  });

  /**
   * Equipment inventory directive
   */
  app.directive('equipmentInventory', ['$http', '$indexedDB', function($http, $indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/equipment-inventory.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this;

        thisController.types      = [];
        thisController.equipments = [];

        $http.get("./json/equipment-types.json").success(function(pTypes) {
          thisController.types = pTypes;
        });

        $indexedDB.openStore('Equipment', function(pStore) {
          pStore.getAll().then(function(pEquipments) {
            thisController.equipments = pEquipments;
          });
        });
      },
      controllerAs: 'eqInventory'
    };
  }]);

})();
