//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    app = express();

var db_service_name = 'CLOUDANT';

//. env values
require( 'dotenv' ).config();
var settings_db_auth_type = 'DB_AUTH_TYPE' in process.env ? process.env.DB_AUTH_TYPE : '';
var settings_db_url = 'DB_URL' in process.env ? process.env.DB_URL : '';
var settings_db_apikey = 'DB_APIKEY' in process.env ? process.env.DB_APIKEY : '';
var settings_db_username = 'DB_USERNAME' in process.env ? process.env.DB_USERNAME : '';
var settings_db_password = 'DB_PASSWORD' in process.env ? process.env.DB_PASSWORD : '';
var settings_db_name = 'DB_NAME' in process.env ? process.env.DB_NAME : 'qq';

process.env[db_service_name + '_AUTH_TYPE'] = settings_db_auth_type;
process.env[db_service_name + '_URL'] = settings_db_url;
process.env[db_service_name + '_APIKEY'] = settings_db_apikey;
process.env[db_service_name + '_USERNAME'] = settings_db_username;
process.env[db_service_name + '_PASSWORD'] = settings_db_password;

//. DB
var { CloudantV1 } = require( '@ibm-cloud/cloudant' );

//. 環境変数 CLOUDANT_AUTH_TYPE を見て、その内容によって CLOUDANT_URL や CLOUDANT_APIKEY を参照して接続する
var client = CloudantV1.newInstance( { serviceName: db_service_name, disableSslVerification: true } );  //. disableSslVerification は BASIC 認証時に必須（ないとエラー）

/*
client.getServerInformation().then( function( info ){
  console.log( { info } );
}).catch( function( err ){
  console.log( { err } );
});
*/
client.putDatabase( { db: settings_db_name } ).then( function( result ){
}).catch( function( err ){
});

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


app.post( '/api/answer', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var doc = req.body;
  if( doc ){
    var ts = ( new Date() ).getTime();
    doc.type = 'answer';
    doc.created = ts;
    doc.updated = ts;
    client.postDocument( { db: settings_db_name, document: doc } ).then( function( result ){
      res.write( JSON.stringify( { status: true, result: result.result } ) );
      res.end();
    }).catch( function( err ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
      res.end();
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'no document body.' } ) );
    res.end();
  }
});

app.post( '/api/question', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var doc = req.body;
  if( doc ){
    var ts = ( new Date() ).getTime();
    doc.type = 'question';
    doc.created = ts;
    doc.updated = ts;
    client.postDocument( { db: settings_db_name, document: doc } ).then( function( result ){
      res.write( JSON.stringify( { status: true, result: result.result } ) );
      res.end();
    }).catch( function( err ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
      res.end();
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'no document body.' } ) );
    res.end();
  }
});

app.get( '/api/answer/:answer_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.answer_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'answer' ){
        res.write( JSON.stringify( { status: true, doc: doc.result } ) );
        res.end();
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no answer found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.get( '/api/answers/:question_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.question_id;
  if( id ){
    var param = { db: settings_db_name, selector: { '$and': [ { question_id: { '$eq': id } }, { type: { '$eq': 'answer' } } ] }, fields: [ '_id', '_rev', 'user_id', 'question_id', 'answers', 'type', 'created', 'updated' ] };
    client.postFind( param ).then( function( docs ){
      if( docs && docs.result && docs.result.docs ){
        res.write( JSON.stringify( { status: true, answers: docs.result.docs } ) );
        res.end();
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, docs: [] } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.get( '/api/question/:question_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.question_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'question' ){
        res.write( JSON.stringify( { status: true, doc: doc.result } ) );
        res.end();
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no question found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.get( '/api/questions/:user_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.user_id;
  if( id ){
    var param = { db: settings_db_name, selector: { '$and': [ { user_id: { '$eq': id } }, { type: { '$eq': 'question' } } ] }, fields: [ '_id', '_rev', 'user_id', 'label', 'questions', 'type', 'created', 'updated' ] };
    client.postFind( param ).then( function( docs ){
      if( docs && docs.result && docs.result.docs ){
        res.write( JSON.stringify( { status: true, questions: docs.result.docs } ) );
        res.end();
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, docs: [] } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.put( '/api/answer/:answer_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.answer_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'answer' ){
        var newdoc = req.body;
        var ts = ( new Date() ).getTime();
        newdoc._id = doc.result.id;
        newdoc._rev = doc.result.rev;
        newdoc.created = doc.result.created;
        newdoc.updated = ts;
        newdoc.type = 'answer';

        client.postDocument( { db: settings_db_name, document: newdoc } ).then( function( result ){
          res.write( JSON.stringify( { status: true, result: result.result } ) );
          res.end();
        }).catch( function( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no answer found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.put( '/api/question/:question_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.question_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'question' ){
        var newdoc = req.body;
        var ts = ( new Date() ).getTime();
        newdoc._id = doc.result.id;
        newdoc._rev = doc.result.rev;
        newdoc.created = doc.result.created;
        newdoc.updated = ts;
        newdoc.type = 'question';

        client.postDocument( { db: settings_db_name, document: newdoc } ).then( function( result ){
          res.write( JSON.stringify( { status: true, result: result.result } ) );
          res.end();
        }).catch( function( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no question found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.delete( '/api/answer/:answer_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.answer_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'answer' ){
        param.rev = doc.result._rev;
        client.deleteDocument( param ).then( function( result ){
          res.write( JSON.stringify( { status: true } ) );
          res.end();
        }).catch( function( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no answer found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});

app.delete( '/api/question/:question_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.question_id;
  if( id ){
    var param = { db: settings_db_name, docId: id };
    client.getDocument( param ).then( function( doc ){
      if( doc && doc.result && doc.result.type && doc.result.type == 'question' ){
        param.rev = doc.result._rev;
        client.deleteDocument( param ).then( function( result ){
          res.write( JSON.stringify( { status: true } ) );
          res.end();
        }).catch( function( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
          res.end();
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: 'no question found.' } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});


app.get( '/a', function( req, res ){
  var qid = req.query.qid;
  if( qid ){
    /*
    db.get( qid, { include_docs: true }, function( err, body, header ){
      var question = {};
      if( err ){
        console.log( {err} );
      }else{
        console.log( {body} );
        question = body;
      }
      res.render( 'a', { qid: qid, question: question } );
    });
    */
    var param = { db: settings_db_name, docId: qid };
    client.getDocument( param ).then( function( doc ){
      res.render( 'a', { qid: qid, question: doc.result } );
    });
  }else{
    res.render( 'a', { qid: null, question: {} } );
  }
});

app.get( '/', function( req, res ){
  res.render( 'q', {} );
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
