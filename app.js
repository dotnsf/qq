//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    app = express();
var settings = require( './settings' );

//. DB
var CloudantLib = require( '@cloudant/cloudant' );
var db = null;
if( settings.db_username && settings.db_password && settings.db_url ){
  var cloudant = CloudantLib( { account: settings.db_username, password: settings.db_password, url: settings.db_url } );
  if( cloudant ){
    cloudant.db.get( settings.db_name, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name, function( err, body ){
            if( err ){
            }else{
              db = cloudant.db.use( settings.db_name );
            }
          });
        }else{
          db = cloudant.db.use( settings.db_name );
        }
      }else{
        db = cloudant.db.use( settings.db_name );
      }
    });
  }else{
  }
}

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
    db.insert( doc, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, result: body } ) );
        res.end();
      }
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
    db.insert( doc, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, result: body } ) );
        res.end();
      }
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, answer: body }, null, 2 ) );
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
    db.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var answers = [];
        body1.rows.forEach( function( doc ){
          var _doc = JSON.parse(JSON.stringify(doc.doc));
          if( _doc.question_id && _doc.question_id == id ){
            answers.push( _doc );
          }
        });

        res.write( JSON.stringify( { status: true, answers: answers }, null, 2 ) );
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, question: body }, null, 2 ) );
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
    db.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var questions = [];
        body1.rows.forEach( function( doc ){
          var _doc = JSON.parse(JSON.stringify(doc.doc));
          if( _doc.user_id && _doc.user_id == id ){
            questions.push( _doc );
          }
        });

        res.write( JSON.stringify( { status: true, questions: questions }, null, 2 ) );
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        if( body && body.type && body.type == 'answer' ){
          var newdoc = req.body;
          var ts = ( new Date() ).getTime();
          newdoc._id = body._id;
          newdoc._rev = body._rev;
          newdoc.created = body.created;
          newdoc.updated = ts;
          newdoc.type = 'answer';

          db.insert( newdoc, function( err, body, header ){
            if( err ){
              res.status( 400 );
              res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
              res.end();
            }else{
              res.write( JSON.stringify( { status: true, result: body } ) );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: 'no answer found.' } ) );
          res.end();
        }
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        if( body && body.type && body.type == 'question' ){
          var newdoc = req.body;
          var ts = ( new Date() ).getTime();
          newdoc._id = body._id;
          newdoc._rev = body._rev;
          newdoc.created = body.created;
          newdoc.updated = ts;
          newdoc.type = 'question';

          db.insert( newdoc, function( err, body, header ){
            if( err ){
              res.status( 400 );
              res.write( JSON.stringify( { status: false, doc: null, error: err } ) );
              res.end();
            }else{
              res.write( JSON.stringify( { status: true, result: body } ) );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: 'no question found.' } ) );
          res.end();
        }
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2. ) );
        res.end();
      }else{
        if( body && body.type && body.type == 'answer' ){
          var rev = body._rev;
          db.destroy( id, rev, function( err, body, header ){
            if( err ){
              res.status( 400 );
              res.write( JSON.stringify( { status: false, doc: null, error: err }, null, 2 ) );
              res.end();
            }else{
              res.write( JSON.stringify( { status: true }, null, 2 ) );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: 'no answer found.' }, null, 2. ) );
          res.end();
        }
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
    db.get( id, { include_docs: true }, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2. ) );
        res.end();
      }else{
        if( body && body.type && body.type == 'question' ){
          var rev = body._rev;
          db.destroy( id, rev, function( err, body, header ){
            if( err ){
              res.status( 400 );
              res.write( JSON.stringify( { status: false, doc: null, error: err }, null, 2 ) );
              res.end();
            }else{
              res.write( JSON.stringify( { status: true }, null, 2 ) );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, doc: null, error: 'no question found.' }, null, 2. ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, doc: null, error: 'parameter id need to be specified.' } ) );
    res.end();
  }
});


app.get( '/', function( req, res ){
  var qid = req.query.qid;
  if( qid ){
    db.get( qid, { include_docs: true }, function( err, body, header ){
      var question = {};
      if( err ){
      }else{
        question = body;
      }
      res.render( 'a', { qid: qid, question: question } );
    });
  }else{
    res.render( 'a', { qid: null, question: {} } );
  }
});

app.get( '/q', function( req, res ){
  res.render( 'q', {} );
});


app.post( '/setcookie', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var value = req.body.value;
  res.setHeader( 'Set-Cookie', value );

  res.write( JSON.stringify( { status: true }, null, 2 ) );
  res.end();
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
