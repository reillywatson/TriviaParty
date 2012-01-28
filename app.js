var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8024);
var questions = fs.readFileSync(__dirname + '/hgrepo/TriviaParty/res/raw/tr011.txt').toString().split('\n');


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

function nextQuestion (socket) {
    var question = questions[Math.floor(Math.random() * questions.length)].toString();
    var answers = question.split('*');
    socket.emit('gotquestion', { question: answers[0], answers: answers.slice(1) });
}

io.sockets.on('connection', function (socket) {
	nextQuestion(socket);
	socket.on('nextquestion', function(data) { nextQuestion(socket);});
	socket.on('userguess', function(data) {
		console.log(data);
		nextQuestion(socket);
	});
});
