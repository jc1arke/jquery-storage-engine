var app = app || {};

app.utils = app.utils || {
  storage: $.storage
};

app.settings = app.settings || {
  engine: 'websql',
  persistent: true,
  debug: true,
  websql: {
    dbBytes: 500000,
    dbName: 'jquery_storage_test',
    dbTitle: 'jquery_storage_test'
  }
};

app.utils.storage(app.settings, init);

var init = function(result) {
  console.log('app.init', result);
  app.utils.storage('createTable', 
    { tableName: 'test', 
      fields: [
        {name: 'id', type: 'INTEGER', nullAllowed: false, keyType: 'PRIMARY KEY', special: 'AUTOINCREMENT'}, 
        {name: 'name', type: 'VARCHAR(25)', nullAllowed: false, keyType: 'UNIQUE'},
        {name: 'password', type: 'VARCHAR(50)', nullAllowed: false}
      ]
    }, save);
}

var save = function(tx, result) {
  console.log('save', tx, result);
  result = result || tx;
  if( result ) {
    app.utils.storage('save',
      {
        tableName: 'test',
        fields: [
          {key: 'name', value: 'john'},
          {key: 'password', value: 'test', transform: 'MD5'}
        ] 
      }, clear
    );
  }
}

var clear = function(result) {
  // TODO
}