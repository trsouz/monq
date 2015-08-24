var helpers = require('./helpers');

helpers.collection.remove({}, function(){
  helpers.db.close();
});