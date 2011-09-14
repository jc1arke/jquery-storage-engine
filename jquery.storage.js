/**
 * jQuery Storage Engine Plugin
 * 
 * This plugin is a simple but effective wrapper used to provide awesome-sauce storage capabilities in a browser
 * It supports:
 * a) WebSQL aka SQLite for Browsers
 * b) LocalStorage
 * c) SessionStorage
 * d) Storage
 * e) Flash Cookie
 * f) Cookies
 *
 * @author JA Clarke
 * @since 2011/09/13
 * @link http://twitter.com/jc1arke
 */
alert = function(message){ console.log(message); };

(function($, undefined){
  $.storage = function(func, options, cb) {
    if( typeof func == 'string' ) {
      var jqStorage = $(document.body).data('jqStorage');
      switch(func) {
        case 'createTable':
          /**
           * Check that it is a WebSQL engine or not
           */
          if( jqStorage.settings.engine == 'websql' ) {
            jqStorage.settings.dbOperations.createTable(jqStorage.db, options, cb);
          } else {
            jqStorage.events.error('Sorry, but that command is not understood for the current storage engine', jqStorage.settings.errorCallback);
            if( cb ) {
              cb(false);
            }
          }
        case 'save':
          jqStorage.settings.dbOperations.save(jqStorage.db, options, cb);
          break;
        case 'delete':
        case 'update':
        case 'search':
        case 'select':
        case 'clear':
          jqStorage.events.error('bleh', jqStorage.settings.errorCallback);
          break;
        default:
          alert('test');
          break;
      }
      return;
    }
    /**
     * Magic!
     */
    cb = cb || options;
    options = options || func;

    var settings = {
      /**
       * General settings
       */
      engine: 'websql',
      persistent: false,
      debug: false,
      autoFallback: false, // TODO

      /**
       * WebSQL Engine settings
       */
      websql: {
        dbName: 'websql_' + new Date().getTime(),
        dbVersion: '1.0',
        dbTitle: 'websql_' + new Date().getTime(),
        dbBytes: 0,
        dbCallback: function(event) { console.log(event); }
      },

      /**
       * Events
       */
      onInit: function(message, cb) { if(cb) { cb( message ); } else { alert(message); } },
      onError: function(message, cb) { if( cb ) { cb( message ); } else { alert(message); } },
      onSuccess: function(message, cb) { if( cb ) { cb( message ); } else { alert(message); } },
      onDebug: function(message, cb) { if( cb ) { cb( message ); } else { alert(message); } },

      /**
       * Event callbacks
       */
      initCallback: function(event) { console.log(event); },
      errorCallback: function(event) { console.log(event); },
      successCallback: function(event) { console.log(event); },
      debugCallback: function(event) { console.log(event); }
    };

    /**
     * Merge the options
     */
    if( options ) {
      $.extend( settings, options );
    }
    
    var events = {
      /**
       * General
       */
      init: function(message, cb) {
        settings.onInit('[INIT]: ' + message, cb);
      },
      error: function(message, cb) {
        settings.onError('[ERROR]: ' + message, cb);
      },
      success: function(message, cb) {
        settings.onSuccess('[SUCCESS]: ' + message, cb);
      },
      debug: function(debugData, cb) {
        settings.onDebug( debugData, cb );
      },

      /**
       * Setup
       */
      initDB: function() {
        switch(settings.engine) {
          case 'websql':
            settings.dbOperations = engines.websql;
            return engines.websql._init(settings.websql);
            break;
          case 'localstorage':
            // TODO
            // break;
          case 'sessionstorage':
            // TODO
            // break;
          case 'storage':
            // TODO
            // break;
          case 'flash':
            // TODO
            // break;
          case 'cookie':
            // TODO
            // break;
          default:
            events.error('Sorry, but that is either a unknown storage engine or we don\'t support it ... yet ;)', settings.errorCallback);
            return false;
            break
        }        
      }
    };

    if( settings.debug ) {
      events.debug( {options: options, settings: settings}, settings.debugCallback );
    }

    var engines = {
      websql: {
        _init: function(_websqlSettings) {
          var _db;
          if( settings.debug ) {
            events.debug(_websqlSettings, settings.debugCallback);
          }
          try {
            _db = window.openDatabase(_websqlSettings.dbName, _websqlSettings.dbVersion, _websqlSettings.dbTitle, _websqlSettings.dbBytes, _websqlSettings.dbCallback);
          } catch(e) {
            events.error( e, settings.errorCallback );
            return false;
          }
          console.log(_db);
          if( _db.version !== 'undefined' ) {            
            this.onInitSuccess('DB Initialized');
            return _db;
          } else {
            events.error('Could not initialize WebSQL database with the settings provided');
            return false;
          }
        },
        /**
         * Create a table in the SQLite DB
         */
        createTable: function(db, _createTableOptions, cb) {
          var _f = [],
              tableName = _createTableOptions.tableName, 
              fields = _createTableOptions.fields,
              _q = '',
              sqlWin = cb || this.onSuccess,
              sqlFail = cb || this.onFail,
              txFail = cb || this.onFail,
              txWin = cb || this.onSuccess;
          fields.forEach( function(_e, _i){
            _f.push( _e.name + ' ' + _e.type + ' ' + (_e.nullAllowed==true?'':'NOT NULL') + ' ' + (_e.keyType||'') + ' ' + (_e.special||'') );
          });
          _q = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + _f.join(', ') + ');';
          if( settings.debug ) {
            events.debug(_q, settings.debugCallback);
          }
          db.transaction( function(tx){
            tx.executeSql(
              _q,
              [],
              sqlWin,
              sqlFail
            );
          }, txFail, txWin);
        },
        /**
         * Insert something somewhere
         */
        save: function(db, _insertTableOptions, cb) {
          var _f = [],
              _d = [],
              _p = [],
              _t = _insertTableOptions.tableName,
              _q = '',
              sqlWin = cb || this.onSuccess,
              sqlFail = cb || this.onFail,
              txFail = cb || this.onFail,
              txWin = cb || this.onSuccess;
          if( settings.debug ) {
            events.debug( [_insertTableOptions, cb], settings.debugCallback );
          }
          delete _insertTableOptions.tableName;
          _insertTableOptions.fields.forEach(function(_e, _i){
            _f.push(_e.key);
            _d.push(_e.transform?_e.transform+'('+_e.value+')':_e.value);
            _p.push('?');
          });
          _q = 'INSERT INTO ' + _t + ' (' + _f.join(', ') + ') VALUES (' + _p.join(', ') + ');';
          if( settings.debug ) {
            events.debug(_q, settings.debugCallback);
          }
          db.transaction( function(tx){
            tx.executeSql(
              _q,
              _d,
              sqlWin,
              sqlFail
            );
          }, txFail, txWin);
        },
        update: function(db, _updateTableOptions, cb) {
          // TODO
        },
        search: function(db, _searchTableOptions, cb) {
          // TODO
        },
        select: function(db, _selectTableEntryOptions, cb) {
          // TODO
        },
        delete: function(db, _deleteTableEntryOptions, cb) {
          // TODO
        }
        clear: function(db, _clearTableOptions, cb) {
          // TODO
        }
        onInitSuccess: function(event) {
          events.init(event, settings.initCallback);
        },
        onSuccess: function(tx, response) {
          response = response || 'Operations was successful';
          events.success(response, settings.successCallback);
          return true;
        },
        onError: function(err) {
          events.errors(err, settings.errorCallback);
          return false;
        }
      }
    };

    settings.db = settings.db || events.initDB();

    if( cb ) {
      cb(settings.db);
    }

    $(document.body).data('jqStorage', {settings: settings, events: events, engines: engines, db: settings.db});
  };  
})(jQuery);