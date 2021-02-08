
var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
const { count } = require('console');
require('dotenv').config()
io = require('socket.io')(server,{
    cors:{
        origin: process.env.DOMAIN_ALLOWED,
        methods: ["GET", "POST"]
    }
})

console.log(process.env.ROOMS)

app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var defaultRomm = 'global'
var channels = process.env.ROOMS??[]

server.listen(8000, function() {
    io.emit('initevent')
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');;
})

app.post('/emit/:channel', (req, res) => {

    var reqchannel = req.params.channel.split(',')

    if(!channels.includes(reqchannel)){

        res.status(403).send({message:'No existe el canal especificado'})
    }

    for (let ii = 0; ii < reqchannel.length; ii++) {
        io.in(reqchannel[ii]).emit('update:'+reqchannel[ii],{
            channel:reqchannel[ii],
            data:req.body
        })
    }

    res.send({message:"Enviado"})

})

io.on('connection', function(socket) {

    var channel;
    
    if(typeof socket.handshake.query.canal == 'undefined'){
        channel = [defaultRomm]
    }else{
        channel = socket.handshake.query.canal.split(',')
    }
    socket.join(socket.handshake.query.canal)

    console.log("cliente "+ socket.id+"  al canal "+socket.handshake.query.canal)

});

