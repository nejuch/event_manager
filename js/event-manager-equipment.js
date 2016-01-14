/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_EQUIPMENT = "Equipment",
      app = angular.module('eventManagerEquipment', ['indexedDB']);

  /**
   * Gemeinsam genutzter Dienst, der das aktuelle Event zur Verfügung stellt.
   */
  app.service('equipmentService', ['$http', '$indexedDB', function($http, $indexedDB) {
    var thisService        = this;
    thisService.types      = [];
    thisService.equipments = [];

    /**
     * Hilfsfunktion zum Laden aller Ausrüstungsgegenstände, da es mehrfach benötigt wird
     */
    var getAllEquipments = function() {
      $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
        pStore.getAll().then(function(pEquipments) {
          thisService.equipments = pEquipments;
        });
      });
    };

    /**
     * Hilfsfunktion zum Laden aller Ausrüstungstypen
     */
    var getAllTypes = function() {
      $http.get("./json/equipment-types.json").success(function(pTypes) {
        thisService.types = pTypes;
      });
    };

    /**
     * Hinzufügen eines Instruments
     * Nach erfolgreichem Hinzufügen wird das Inventar aktualisiert
     * @param {object} pEquipment Datensatz
     */
    thisService.add = function(pEquipment) {
      $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
        pStore.insert(pEquipment).then(getAllEquipments);
      });
    };

    /**
     * Entfernen eines Instruments
     * Nach erfolgreichem Entfernen wird das Inventar aktualisiert
     * @param {number} pId Primärschlüssel
     */
    thisService.remove = function(pId) {
      $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
        pStore.delete(pId).then(getAllEquipments);
      });
    };

    // ~~~ Zum Start alle Ausrüstungsgegenstände und Typen laden
    getAllEquipments();
    getAllTypes();
  }]);


  /**
   * Eigenes Tag für das Instrumenteninventar in den Stammdaten
   */
  app.directive('equipmentInventory', function() {
    return {
      restrict: 'E',
      templateUrl: './html/equipment-inventory.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, equipmentService) {
        var thisController      = this;
        $scope.equipmentService = equipmentService;

        /**
         * Hinzufügen eines Instruments
         */
        this.add = function() {
          var eq = {
            'equipment_typ' : document.equipmentInventoryAdd.eqType.selectedIndex - 1,
            'equipment_name': document.equipmentInventoryAdd.eqName.value
          };
          equipmentService.add(eq);
          document.equipmentInventoryAdd.reset();
        };

        /**
         * Entfernen eines Instruments
         * @param {number} pId Primärschlüssel
         */
        this.remove = function(pId) {
          equipmentService.remove(pId);
        };

      },
      controllerAs: 'inventory'
    };
  });

  /**
   * Eigenes Tag für die Auswahl an Instrumenten/Ausrüstungsgegenständen
   */
  app.directive('equipmentOptions', function() {
    return {
      restrict: 'E',
      templateUrl: './html/equipment-options.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, equipmentService) {
        var thisController      = this;
        $scope.equipmentService = equipmentService;
      },
      controllerAs: 'eqOptions'
    };
  });

})();
