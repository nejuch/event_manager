/**
 * Wrapperklasse für IndexedDB
 * @author M11
 * @class DB
 */
(function () {

  var iDB = window.IndexedDB || window.mozIndexedDB || window.webkitIndexedDB;

  // ~~~ Abbruchbedingung, falls keine IndexedDB vorhanden ist
  if ( iDB === null ) {
    window.alert("IndexedDB is not supported by your Browser. Therefore you will be unable to use Studio as intended. Please consider installing a browser supporting IndexedDB (see caniuse.com for reference).");
    return;
  }

  function DB(pDB, pTableCreateCallback) {

    var APP_DB         = {},
        mDBOpenRequest = iDB.open(pDB), // ~~~ Sort of the database management system
        mDBConnection;             // ~~~ Database Connection

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * Private Membermethoden
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

    /**
     * Verarbeitung eines Fehlers in der Datenbankkommunikation
     * @private
     * @author M11
     * @param {object} pEvent [[Description]]
     */
    function onDatabaseError(pEvent) {
      window.alert("Database error: " + pEvent.code + " - " + pEvent.message);
    }
    mDBOpenRequest.onError = onDatabaseError;

    /**
     * Die Verbindung zur Datenbank wurde hergestellt und das Verbindungsobjekt wird übernommen.
     * @private
     * @author M11
     * @param {object} pEvent [[Description]]
     */
    function onDatabaseConnected(pEvent) {
      window.console.log("Database connection established to " + pDB + ".");
      mDBConnection = pEvent.target.result;
    }
    mDBOpenRequest.onSuccess = onDatabaseConnected;

    /**
     * Die Datenbank benötigt eines Neukonfiguration.
     * @private
     * @author M11
     * @param {object} pEvent [[Description]]
     */
    function onUpgradeNeeded(pEvent) {
      if ( pTableCreateCallback instanceof Function ) {
        pTableCreateCallback(mDBConnection);
      } else {
        window.console.warn("No function for Table creation provided. Database " + pDB + " is probably not up to date.");
      }
    }
    mDBOpenRequest.onUpgradeNeeded = onUpgradeNeeded;

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * Public Membermethoden
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */


    APP_DB.Table = function(pTableName, pPrimaryKey, pAutoIncrement) {

      var APP_DB_Table = {};


      return(APP_DB_Table);
    };

  }


}());
