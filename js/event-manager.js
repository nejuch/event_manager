/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_EVENT     = "Event",
      STORE_EVENT_EQP = "Event_Equip",
      STORE_LOCATION  = "Location",
      STORE_EQUIPMENT = "Equipment",
      STORE_TRACK     = "Track",
      app = angular.module('eventManager', ['eventManagerEquipment', 'eventManagerTracklist', 'indexedDB', 'angular-sortable-view']);

  /**
   * IndexedDB-Configuration
   */
  app.config(function($indexedDBProvider) {
    var db = $indexedDBProvider.connection('EventManagerDB');
    if ( typeof(db) === 'undefined' ) {
      alert("Unable to connect to Database.\nYou have to enable web storage in your browser options.");
      return;
    }

    // ~~~ Create initial database version
    db.upgradeDatabase(1, function(pEvent, pDatabase, pTransaction) {
      pDatabase.createObjectStore(STORE_EVENT, {keyPath: 'event_id', autoIncrement: true});
      pDatabase.createObjectStore(STORE_EVENT_EQP, {keyPath: ['event_id', 'equipment_id']});
      pDatabase.createObjectStore(STORE_EQUIPMENT, {keyPath: 'equipment_id', autoIncrement: true});
      pDatabase.createObjectStore(STORE_LOCATION, {keyPath: 'location_id', autoIncrement: true});
      pDatabase.createObjectStore('Tracklist', {keyPath: 'tracklist_id', autoIncrement: true});
      pDatabase.createObjectStore('Tracklist_Track', {keyPath: ['tracklist_id','track_id']});
      pDatabase.createObjectStore(STORE_TRACK, {keyPath: 'track_id', autoIncrement: true});
    });
  });

  /**
   * Controller for the differet pages of the event manager
   */
  app.controller("TabControl", ['currentEventProvider', function(currentEventProvider) {
    this.tab = 2;

    this.isSet = function(pTab) {
      return( this.tab === pTab );
    };
    this.setTab = function(pTab) {
      if ( pTab === 3 && !Array.isArray(currentEventProvider.event.event_track) ) {
        alert("There are no tracks listed for the current event.\nYou cannot start performing the current event.");
        return;
      }
      this.tab = pTab;
    };
  }]);

  /**
   * Gemeinsam genutzter Dienst, der das aktuelle Event zur Verfügung stellt.
   */
  app.service('currentEventProvider', ['$indexedDB', 'equipmentService', 'tracklistService', function($indexedDB, equipmentService, tracklistService) {
    var thisFactory = this;

    thisFactory.eventIdx   = -1;
    thisFactory.eventId    = 0;
    thisFactory.event      = {};
    thisFactory.events     = [];
    thisFactory.equipments = [];
    thisFactory.tracks     = [];

    /**
     * Hilfsfunktion zum Laden aller Veranstaltungen
     * @param {boolean} pPositionOnLast Soll auf den nach dem Laden letzten positioniert werden? (Nach addEvent)
     */
    function getAllEvents(pPositionOnLast) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.getAll().then(function(pEvents) {
          thisFactory.events = pEvents;
          if ( pPositionOnLast ) {
            thisFactory.position( thisFactory.events.length-1 );
          } else if ( thisFactory.eventId !== 0 ) {
            thisFactory.position( thisFactory.eventIdx );
          }
        });
      });
    }

    /**
     * Hilfsfunktion zum Integrieren des eigentlichen Datensatzes der Ausrüstungsgegenstände der Veranstaltung
     */
    function getAllEquipments() {
      if ( !Array.isArray(thisFactory.event.event_equip) ) {
        return;
      }

      thisFactory.equipments = [];
      $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
        var i;
        for ( i=0; i<thisFactory.event.event_equip.length; i++) {
          pStore.find(thisFactory.event.event_equip[i]).then(function(pEquipment) {
            thisFactory.equipments.push(pEquipment);
          });
        }
      });
    }

    /**
     * Hilfsfunktion zum Integrieren des eigentlichen Datensatzes der Lieder der Veranstaltung
     */
    function getAllTracks() {
      if ( !Array.isArray(thisFactory.event.event_track) ) {
        return;
      }

      thisFactory.tracks = [];
      $indexedDB.openStore(STORE_TRACK, function(pStore) {
        var i;
        for ( i=0; i<thisFactory.event.event_track.length; i++) {
          pStore.find(thisFactory.event.event_track[i]).then(function(pTrack) {
            thisFactory.tracks.push(pTrack);
          });
        }
      });
    }

    /**
     * Hilfsfunktion zum Ermitteln des Indexes eines Events innerhalb der Events von der Datenbank
     * @param {number} pEventId Primärkey
     */
    function getEventIdx(pEventId) {
      var i;
      for (i=0; i<thisFactory.events.length; i++) {
        if ( thisFactory.events[i].event_id === pEventId ) {
          return(i);
        }
      }
      return(-1);
    }

    /**
     * Hilfsfunktion zum Ermitteln des Indexes eines Ausrüstungsgegenstands in der Tabelle
     * @param {number} pId Primärkey
     */
    function getEquipmentIdx(pId) {
      return( thisFactory.event.event_equip.indexOf(pId) );
    }

    /**
     * Hilfsfunktion zum Ermitteln des Indexes eines Ausrüstungsgegenstands in der Tabelle
     * @param {number} pId Primärkey
     */
    function getTrackIdx(pId) {
      return( thisFactory.event.event_track.indexOf(pId) );
    }

    /**
     * Hilfsfunktion zum Verschieben des aktiven Events
     * @param {number} pEventId Primärkey
     */
    function shift() {
      if ( thisFactory.eventIdx === -1 ) {
        thisFactory.eventId  = 0;
        thisFactory.event    = {};
      } else {
        thisFactory.event    = thisFactory.events[thisFactory.eventIdx];
        thisFactory.eventId  = thisFactory.event.event_id;
        getAllEquipments();
        getAllTracks();
      }
    }

    /**
     * Eine Veranstaltung hinzufügen
     * Nach erfolgreichem Hinzufügen wird zunächst das modale Fenster geschlossen und danach das Array der Events nachgeladen.
     * @param {object} pEvent Datensatz
     */
    this.addEvent = function(pEvent) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.insert(pEvent).then(function() {
          getAllEvents(true);
        });
      });
    };

    /**
     * Eine Veranstaltung aktualisieren
     * Nach erfolgreichem Entfernen wird das Array der Events nachgeladen.
     * @param {number} pEvent Datensatz
     */
    this.setEvent = function(pEvent) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.upsert(pEvent).then(function() {
          getAllEvents(false);
        });
      });
    };

    /**
     * Eine Veranstaltung entfernen
     * Nach erfolgreichem Entfernen wird das Array der Events nachgeladen.
     * @param {number} pEventId Index
     */
    this.removeEvent = function(pEventId) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.delete(pEventId).then(function() {
          getAllEvents(false);
          thisFactory.recede(); // ~~~ Auf vorheriges Event positionieren
        });
      });
    };

    /**
     * Einen Ausrüstungsgegenstand hinzufügen
     * Nach erfolgreichem Hinzufügen werden Ausrüstungsgegenstände des Events neu geladen.
     * @param {object} pId Primärschlüssel des Ausrüstungsgegenstands
     */
    this.addEquipment = function(pId) {
      if ( !Array.isArray(thisFactory.event.event_equip) ) {
        thisFactory.event.event_equip = [];
      }
      thisFactory.event.event_equip.push( pId );
      thisFactory.setEvent( thisFactory.event );
    };

    /**
     * Einen Ausrüstungsgegenstand entfernen
     * @author m11t
     * @param {number} pId Primärschlüssel
     */
    this.removeEquipment = function(pId) {
      thisFactory.event.event_equip.splice(getEquipmentIdx(pId), 1);
      thisFactory.setEvent( thisFactory.event );
    }

    /**
     * Ein Lied hinzufügen
     * Nach erfolgreichem Hinzufügen werden die Lieder des Events neu geladen.
     * @param {object} pId Primärschlüssel des Lieds
     */
    this.addTrack = function(pId) {
      if ( !Array.isArray(thisFactory.event.event_track) ) {
        thisFactory.event.event_track = [];
      }
      thisFactory.event.event_track.push( pId );
      thisFactory.setEvent( thisFactory.event );
    };

    /**
     * Ein Lied entfernen
     * @author m11t
     * @param {number} pId Primärschlüssel
     */
    this.removeTrack = function(pId) {
      thisFactory.event.event_track.splice(getTrackIdx(pId), 1);
      thisFactory.setEvent( thisFactory.event );
    }

    /**
     * Ein Lied verschieben
     * @author m11t
     * @param {number} pFrom Start-Index
     * @param {number} pTo   Ziel-Index
     */
    this.reorderTrack = function(pFrom, pTo) {
      thisFactory.event.event_track.splice(pTo, 0, thisFactory.event.event_track.splice(pFrom, 1)[0]);
      thisFactory.setEvent( thisFactory.event );
    }

    /**
     * Die Events neu laden
     */
    this.reload = function() {
      getAllEvents(false);
    };

    /**
     * Ist das aktuelle Event der Platzhalter fürs Anlegen?
     * @author M11
     */
    this.isCreator = function() {
      return( thisFactory.eventId === 0 );
    };

    /**
     * Ist das übergebene Event das aktuell dargestellte?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isActive = function(pEventId) {
      return( thisFactory.eventId === pEventId );
    }

    /**
     * Ist das übergebene Event links vom aktuellen?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isLeft = function(pEventId) {
      return( pEventId < thisFactory.eventId );
    }

    /**
     * Ist das übergebene Event rechts vom aktuellen?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isRight = function(pEventId) {
      return( pEventId > thisFactory.eventId );
    }

    /**
     * Hat das angegebene Event einen Ort?
     * @param {number} pEventId Primärschlüssel
     */
    this.hasLocation = function(pEventId) {
      var vIdx = getEventIdx(pEventId);
      return( typeof(thisFactory.events[vIdx].street) !== 'undefined' || typeof(thisFactory.events[vIdx].city) !== 'undefined' );
    }

    /**
     * Hat das angegebene Event einen Ort?
     */
    this.getMapsLocation = function() {
      return( encodeURIComponent(thisFactory.event.city + '+' + thisFactory.event.street + '+' + thisFactory.event.zip) );
    }

    /**
     * Hat das angegebene Event einen Ort?
     * @param {number} pEventId Primärschlüssel
     */
    this.hasEquipment = function(pEventId) {
      var vIdx = getEventIdx(pEventId);
      return( Array.isArray(thisFactory.events[vIdx].event_equip) );
    }

    /**
     * Hat das angegebene Event einen Ort?
     * @param {number} pEventId Primärschlüssel
     */
    this.hasTracklist = function(pEventId) {
      var vIdx = getEventIdx(pEventId);
      return( Array.isArray(thisFactory.events[vIdx].event_track) );
    }

    /**
     * Aktives Event neu positionieren
     * @param {number} pIdx Index des neuen aktiven Events in der Datenbank
     */
    this.position = function(pIdx) {
      thisFactory.eventIdx = pIdx;
      shift();
    }

    /**
     * Aktives Event neu positionieren anhand event_id
     * @param {number} pId Event_id
     */
    this.positionById = function(pId) {
      thisFactory.eventIdx = getEventIdx(pId);
      shift();
    }

    /**
     * Nächstes Event selektieren
     */
    this.proceed = function() {
      if ( thisFactory.eventIdx === (thisFactory.events.length-1) ) {
        thisFactory.position( -1 );
      } else {
        thisFactory.position( thisFactory.eventIdx+1 );
      }
    }

    /**
     * Vorheriges Event selektieren
     */
    this.recede = function() {
      if ( thisFactory.eventIdx === -1 ) {
        thisFactory.position( thisFactory.events.length-1 );
      } else {
        thisFactory.position( thisFactory.eventIdx-1 );
      }
    }

    // ~~~ Zum Start alle Events laden
    getAllEvents(false);
  }]);

  /**
   * Eigenes Tag für das modale Formular zum Hinzufügen eines Events
   */
  app.directive('eventCreator', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-creator.html'
    };
  });

  /**
   * Eigenes Tag für das aktuell ausgewählte Event
   */
  app.directive('eventPlanner', ['$indexedDB', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-planner.html',
      /**
       * Event-Planner Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB, currentEventProvider) {
        var thisController  = this;

        thisController.provider = currentEventProvider;

      },
      controllerAs: 'planner'
    };
  }]);

  /**
   * Eigenes Tag für das aktuell ausgewählte Event
   */
  app.directive('eventPerformer', function() {
    return {
      restrict: 'E',
      templateUrl: './html/event-performer.html',
      /**
       * Event-Planner Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, currentEventProvider) {
        var thisController   = this;
        thisController.track = 0;
        $scope.provider      = currentEventProvider;


        /**
         * Ein Lied verschieben
         * @param {number} pFrom Start-Index des Liedes
         * @param {number} pTo   Ziel-Index des Liedes
         */
        thisController.start = function(pFrom, pTo) {
          currentEventProvider.reorderTrack(pFrom, pTo);
        };

        /**
         * Ein Lied verschieben
         * @param {number} pFrom Start-Index des Liedes
         * @param {number} pTo   Ziel-Index des Liedes
         */
        thisController.reorder = function(pFrom, pTo) {
          currentEventProvider.reorderTrack(pFrom, pTo);
        };


      },
      controllerAs: 'performer'
    };
  });

  /**
   * Eigenes Tag für die Ausrüstungsgegenstände des ausgewählten Events
   */
  app.directive('eventEquipment', function() {
    return {
      restrict: 'E',
      templateUrl: './html/event-equipment.html',
      /**
       * Event-Planner Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, currentEventProvider, equipmentService) {
        var thisController      = this;
        $scope.provider         = currentEventProvider;
        $scope.equipmentService = equipmentService;

        /**
         * Einen Ausrüstungsgegenstand hinzufügen
         * @param {number} pId Primärschlüssel des Ausrüstungsgegenstands
         */
        thisController.add = function(pId) {
          currentEventProvider.addEquipment(pId);
        };

        /**
         * Einen Ausrüstungsgegenstand entfernen
         * @param {number} pId Primärschlüssel des Ausrüstungsgegenstands
         */
        thisController.remove = function(pId) {
          currentEventProvider.removeEquipment(pId);
        };
      },
      controllerAs: 'luggage'
    };
  });

  /**
   * Eigenes Tag für die Lieder des ausgewählten Events
   */
  app.directive('eventTracklist', function() {
    return {
      restrict: 'E',
      templateUrl: './html/event-tracklist.html',
      /**
       * Event-Planner Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, currentEventProvider, tracklistService) {
        var thisController = this;
        $scope.provider    = currentEventProvider;
        $scope.tracklistService = tracklistService;

        /**
         * Ein Lied hinzufügen
         * @param {number} pId Primärschlüssel des Liedes
         */
        thisController.add = function(pId) {
          currentEventProvider.addTrack(pId);
        };

        /**
         * Ein Lied entfernen
         * @param {number} pId Primärschlüssel des Liedes
         */
        thisController.remove = function(pId) {
          currentEventProvider.removeTrack(pId);
        };

        /**
         * Ein Lied verschieben
         * @param {number} pFrom Start-Index des Liedes
         * @param {number} pTo   Ziel-Index des Liedes
         */
        thisController.reorder = function(pFrom, pTo) {
          currentEventProvider.reorderTrack(pFrom, pTo);
        };
      },
      controllerAs: 'tracklist'
    };
  });

  /**
   * Eigenes Tag zur Anzeige aller verfügbaren Events und zur Auswahl eines Events aus der Liste.
   */
  app.directive('eventCarousel', ['$indexedDB', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-carousel.html',
      /**
       * Event-Creator Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB, currentEventProvider) {
        var thisController  = this;

        thisController.provider = currentEventProvider;

        /**
         * Hinzufügen eines Events
         */
        this.add = function() {
          var vEvent = {
            'event_name'       : document.eventCreator.eventName.value,
            'date'             : new Date(document.eventCreator.eventDate.value),
            'time'             : document.eventCreator.eventTime.value,
            'event_description': document.eventCreator.eventDescription.value,
            'street'           : document.eventCreator.locationStreet.value,
            'zip'              : document.eventCreator.locationZIP.value,
            'city'             : document.eventCreator.locationCity.value
          };
          thisController.provider.addEvent(vEvent);
          document.eventCreator.reset(); // ~~~ Formular leeren
        };

        /**
         * Entfernen eines Events.
         * Nach erfolgreichem Entfernen wird zunächst das Karussel umpositioniert
         * @param {number} pId Index
         */
        this.remove = function(pId) {
          thisController.provider.removeEvent(pId);
        };
      },
      controllerAs: 'carousel'
    };
  }]);

  /**
   * Eigenes Tag zum nachträglichen Bearbeiten eines Events
   */
  app.directive('eventDefiner', function() {
    return {
      restrict: 'E',
      templateUrl: './html/event-definer.html',
      /**
       * Event-Definer Controller
       * @author m11t
       * @param {object} $scope               Scope
       * @param {object} currentEventProvider Service handling events
       */
      controller: function($scope, currentEventProvider) {
        $scope.provider = currentEventProvider;

        /**
         * Ändern eines Events
         */
        this.submit = function() {
          var vEvent = {
            'event_id'         : currentEventProvider.eventId,
            'event_name'       : document.eventDefiner.eventName.value,
            'date'             : new Date(document.eventDefiner.eventDate.value),
            'time'             : document.eventDefiner.eventTime.value,
            'event_description': document.eventDefiner.eventDescription.value,
            'street'           : document.eventDefiner.locationStreet.value,
            'zip'              : document.eventDefiner.locationZIP.value,
            'city'             : document.eventDefiner.locationCity.value
          };
          currentEventProvider.setEvent(vEvent);
        };

        /**
         * Verwerfen der Änderungen eines Events
         */
        this.reset = function() {
          currentEventProvider.reload();
        };

      },
      controllerAs: 'definer'
    };
  });

})();
