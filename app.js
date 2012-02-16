var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8024);
var questions = fs.readFileSync(__dirname + '/trivia/tr011.txt').toString().replace(/\r\n|\r/g, "\n").split('\n');


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
	socket.on('nextquestion', function(data) { nextQuestion(socket);});
	socket.on('userguess', function(data) {
		socket.get('question', function(err, question) {
			var correct = (question.answers.indexOf(data.guess.toLowerCase()) >= 0);
			if (correct) {
				nextQuestion(socket);
			}
			io.sockets.emit('gottext', {text: data.guess});
		});
	});
});
