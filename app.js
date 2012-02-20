var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

io.configure(function() {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
	console.log("Listening on " + port);
});

var questions = "";
for (var i = 2; i < 192; i++) {
	if (i != 133) {
		questions += fs.readFileSync(__dirname + '/trivia/tr'+zeroFill(i, 3)+'.txt').toString().replace(/\r\n|\r/g, "\n");
	}
}
questions = questions.split('\n');
console.log(questions.length + ' questions loaded');

function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number;
}

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

var nextQuestion = function() {
    var rawQuestion = questions[Math.floor(Math.random() * questions.length)].toString();
    var answers = rawQuestion.split('*');
    var question = {question: answers[0], answers: answers.slice(1)};
    var clients = io.sockets.clients();
    for (var i = 0; i < clients.length; i++) {
		var socket = clients[i];
		setQuestion(socket,question);
	}
}

var setQuestion = function(socket,question) {
	console.log('question: ' + question.question + ' answer: ' + question.answers[0])
	socket.set('question', question, function() {
		socket.emit('gotquestion', question);
	});
}

io.sockets.on('connection', function (socket) {
	if (io.sockets.clients().length == 1) {
		nextQuestion();
	}
	else {
		for (var i = 0; i < io.sockets.clients().length; i++) {
			if (io.sockets.clients()[i] != socket) {
				var other = io.sockets.clients()[i];
				other.get('question', function(err, question) {
					setQuestion(socket, question);
				});
				break;
			}	
		}
	}
	socket.on('name', function(data) { socket.set('name', data); });
	socket.on('nextquestion', function(data) { nextQuestion(socket);});
	socket.on('userguess', function(data) {
		socket.get('question', function(err, question) {
			socket.get('name', function(err, name) {
				var correct = false;
				var guess = data.guess.toLowerCase();
				for (var i = 0; i < question.answers.length; i++) {
					if (question.answers[i].toLowerCase() === guess) {
						correct = true;
						break;
					}
				}
				if (correct) {
					nextQuestion(socket);
				}
				io.sockets.emit('gottext', {text: '&lt;'+name+'&gt;'+data.guess});
			});
		});
	});
});
