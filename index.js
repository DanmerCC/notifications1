
var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
const { count } = require('console');
var cors = require('cors');
const { isObject } = require('util');


require('dotenv').config()

var whitelist = process.env.DOMAIN_ALLOWED.split(',')

app.set('view engine', 'ejs')

var corsOptions = {

    origin: function (origin, callback) {
        
      if (whitelist.indexOf(origin) !== -1 || whitelist.includes('*')) {

        callback(null, true)

      } else {

        callback(new Error('Not allowed by CORS'))
      }
    }
}

io = require('socket.io')(server,{
    cors:{
        origin: process.env.DOMAIN_ALLOWED,
        methods: ["GET", "POST"]
    }
})


app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var defaultRomm = 'global'
var channels = ['log','errors']
channels.push(...process.env.ROOMS.split(','))

console.log(channels)

server.listen(process.env.LISTEN_PORT, function() {
    io.emit('initevent')
});


app.get('/', (req, res) => {
    res.render('pages/index',{
        DOMIAN:'localhost'
    });
})

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    next();
});

app.post('/emit/:channel', cors(corsOptions),(req, res) => {

    var reqchannel = req.params.channel.split(',')
    res.setHeader('Access-Control-Allow-Origin','*')

    for (let ii = 0; ii < reqchannel.length; ii++) {
        io.in(reqchannel[ii]).emit('message',req.body)
    }

    res.send({message:"Enviado"})

})

app.post('/test', cors(corsOptions),(req, res) => {

 io.to('log').emit('message',{message:"test"})

  res.send({message:"Enviado"})

})

io.on('connection', function(socket) {

    socket.on('join',(room)=>{
      socket.join(room)
      socket.emit('log',{message:'Se union al room: '+room})
    })

    socket.on('leave',(room)=>{
        
      socket.leave(room, function(err) {
          if (typeof io.sockets.adapter.rooms[room] !== 'undefined' && io.sockets.adapter.rooms[room] != null) {
              console.log(io.sockets.adapter.rooms[room].length)
              console.log(err)
          } else{
              console.log("room is deleted")
              socket.emit('log',{message:'salieron de room: '+room})
          }
      })
        
    })

    socket.on('message',({channel,message})=>{
        
      socket.in(channel).emit('message',message)
      socket.emit('log',{message:'enviando de message: '+message})
        
    })

    socket.emit('message',"Conectado")


});

