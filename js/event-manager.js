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
    }).upgradeDatabase(2, function(pEvent, pDatabase, pTransaction) {
      pDatabase.deleteObjectStore('Equipment');
      pDatabase.deleteObjectStore('Location');
      pDatabase.deleteObjectStore('Tracklist');
      pDatabase.deleteObjectStore('Track');
      pDatabase.createObjectStore('Equipment', {keyPath: 'equipment_id', autoIncrement: true});
      pDatabase.createObjectStore('Location', {keyPath: 'location_id', autoIncrement: true});
      pDatabase.createObjectStore('Tracklist', {keyPath: 'tracklist_id', autoIncrement: true});
      pDatabase.createObjectStore('Track', {keyPath: 'track_id', autoIncrement: true});
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

        this.types      = [];
        this.equipments = [];

        $http.get("./json/equipment-types.json").success(function(pTypes) {
          thisController.types = pTypes;
        });

        $indexedDB.openStore('Equipment', function(pStore) {
          pStore.getAll().then(function(pEquipments) {
            thisController.equipments = pEquipments;
          });
        });

        this.add = function() {
          var eq = {
            'equipment_typ' : document.equipmentInventoryAdd.elements[0].selectedIndex - 1,
            'equipment_name': document.equipmentInventoryAdd.elements[1].value
          };

          $indexedDB.openStore('Equipment', function(pStore) {
            pStore.insert(eq).then(function() {
              pStore.getAll().then(function(pEquipments) {
                thisController.equipments = pEquipments;
              });
            });
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore('Equipment', function(pStore) {
            pStore.delete(pId).then(function() {
              pStore.getAll().then(function(pEquipments) {
                thisController.equipments = pEquipments;
              });
            });
          });
        };
      },
      controllerAs: 'eqInventory'
    };
  }]);

})();
