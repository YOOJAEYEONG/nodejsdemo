/**
 * 환경변수 사용을 위한 라이브러리를 설치 npm install dotenv
 * 환경변수가 있는 server.js에 방금 설치한 라이브러리를 등록
 * 
 * 여러분이 나중에 AWS, Google, Naver 클라우드 등을 이용해서 서버를 발행할 때
    env파일을 똑같이 이용할 수 있습니다. 
    구글 클라우드 서비스에 올릴 경우 env 파일을 따로 만드는게 아니라 app.yaml 파일 내에 환경변수들을 포함해야하는데
    https://cloud.google.com/appengine/docs/standard/nodejs/config/appref#environment_variables
    이런 곳을 참고해서 똑같이 환경변수를 제작하면 되겠습니다. 
    다만 변수만드는 문법에 등호 대신 콜론 (:)을 씁니다.
 */
require('dotenv').config();

const express = require('express');
const app = express();

//bodyparser lib 1
const bodyParser = require('body-parser');
//bodyparser lib 2
app.use(bodyParser.urlencoded({extended:true}));
/**
 * main.css 파일을 link 시키기위해 추가함
 */
app.use('/public',express.static('public'));

//Mongodb 1
const MongodbConnectionURL = process.env.DB_URL;
//Mongodb 2
const MongoClient = require('mongodb').MongoClient;
const { render } = require('ejs');
//Mongodb 4
var db;
var ObjectId = require('mongodb').ObjectID;
var util = require('./util/util.js');
//ejs lib 사용을 선언 
/*
ejs 파일들은 항상 views 폴더 안에 있어야한다.
*/
app.set('view engine','ejs');
//Mongodb 3
MongoClient.connect(MongodbConnectionURL,function (error, client) {
    if (error) {
        return console.log(error);
    }
    db = client.db('ToDO');
    //db에 연결되면 서버 가동
    app.listen(process.env.PORT,function () {
        console.log('listening on '+process.env.PORT);
        /**
         * 라우터로 분리된 곳에서 db 연결 객체를 사용하기위해 추가함
         * 사용할때는 req.app.db.collection()... 형태로 사용
         */
        app.db = db;
    });
});




/* 로그인 기능 구현을 위해 설치한 lib 
여기서는 JWT 방식, session 방식 중 session 방식을 이용하여 로그인 기능을 구현함
*/
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
/** 
 * app.use() // 미들웨어 사용을 명시함, 
 * 'secretkey1231' 는 session 을 만들때 비밀번호이다. 임의로 써주면 된다.
 */
app.use(session({secret : 'secretkey1231', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

 /**
  * 인증하는 방법을 Stretegy 라고 함
  * /login 으로 post 요청시 아래를 이용하여 아이디/비번을 검증함
  * 
  */
  passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,//세션 저장할지 여부를 결정
    passReqToCallback: false,// (요기는 아이디/비번말고 다른 정보검사가 필요한지)
    //사용자 아이디/비번을 검증하는 부분
  }, function (입력한아이디, 입력한비번, done) {
    //아이디, 비번을 인증하는 세부 코드를 작성..
    console.log('LocalStrategy',입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        console.log('LocalStrategy:findOne',결과);
      if (에러) return done(에러)
  
      /*
      done(a,b,c) 3개의 파라미터를 갖을 수 있다.
      a : 서버에러
      b : 인증 성공시 사용자 데이터를 넣음(사용자 정보가 안맞을 시 false 를 담아야 함)
      c : 에러 메시지를 넣을 수 있다.
      */
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

/**
 * 로그인시 실행됨
 * id를 이용해서 세션을 저장시키는 코드
 * 이 유저의 정보를 serialize 하게 만들어서 저장한다.
 * 결과 == user 임
*/
passport.serializeUser(function (user, done) {
    /**
     * 세션데이터를 만들고 세션의 id 정보를 쿠키로 생성해줌
     */
    done(null, user.id) 
 });
/**
 * 이 세션데이터를 가진 유저를 DB에서 찾는다. 
 * 마이페이지 접속시 실행됨
 * db 에서 로그인한 유저를 찾은 뒤 유저정보를 done (null, 요기 )에 넣음
 */
 passport.deserializeUser(function (id, done) {
     db.collection('login').findOne({id: id}, function (error, result) {
        console.log('deserializeUser',result);
        //request.user 에 정보를 저장한다.
        done(null, result)
     });
 });

 app.get('/',function (req,res) {
    // res.sendFile(__dirname+'/index.html');
    res.render('index.ejs');
});


app.get('/fail', function (req,res) {
    console.log('get/fail');
    res.sendFile(__dirname+'/fail.html');
});





app.get('/login', function (req,res) {
    console.log(req);
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(req, res){
    res.redirect('/list');

});



 /* 로그인 한 유저만 접속할 수있는 마이 페이지 */
 /**
  * /mypage 접속 요청때마다 미들웨어 실행 후 응답을 해주게 된다.
  */
 app.get('/mypage',util.isLogin, function (req,res) {
    res.render('mypage.ejs', {info: req.user});
 });





  /**
   * multer 를 이용한 이미지를 하드에 저장하기 
   * 
   * npm install multer >> multer 라는 파일 라이브러리 를 설치함
   * 
   */

const multer = require('multer');
var storage = multer.diskStorage({
    destination : function (req,file, cb) {
        cb(null, './public/image')
    },
    filename : function (req, file, cb) {
        cb(null,file.originalname)
    },
    // filefilter : 파일 업로드 제한
    // limits : 파일 사이즈 제한
});

var uploader = multer({storage : storage});

/**
 * 이미지 업로드 페이지
 */
app.get('/upload',function (req,res) {
    res.render('upload.ejs');
});

/**
 * uploader.single(input태그의 name 속성값) :  업로드할 파일이 하나면 
 * uploader.array() :  업로드할 파일이 여러개일때
 *  
 */
app.post('/upload', uploader.single('imagefile'), function (req, res) {
    res.send('업로드 완료');
});


  /**
   * 이미지 보내주는 api
   */
  app.get('/image/:filename', function (req, res) {
      req.sendFile(__dirname + '/public/image/'+req.params.filename);
  });
  

  /**
   * 채팅방 페이지
   */
  app.get('/chat',util.isLogin, function (req, res) {
      res.render('chat.ejs');
  });






 /**
  * 라우터 사용하기
  *  app.use() : 요청과 응답 사잉에 사용할 미들웨어를 사용하고자 할때 사용한다.
  * 미들웨어를 사용할 경로를 넣어주면 해당 경로로 접속할때만 미들웨어를 사용하게 된다.
  * 
  * 
  */
  app.use('/shop', require('./routes/shop.js') );
  app.use( require('./routes/todo.js'));


app.get('/chatroom/:id', util.isLogin , function (req,res) {
    console.log('채팅방',req.params.id);
    var condition = { $or : 
            [
                {member : [req.params.id, req.user.id]}, 
                {member : [req.user.id, req.params.id]}
            ]
        };
    db.collection('chatroom').find(condition).toArray(function (error, result) {
        if (error)  console.log(error);
        console.log('채팅방 검색결과', result); 
        if (result.length == 0 && req.params.id != req.user.id) {
            var data = {
                //게시물 작성자 id , 채팅건 유저의 id
                member : [req.params.id ,req.user.id], 
                date : new Date(),
            }
            db.collection('chatroom').insertOne(data , function (error,result) {
                if (error)  console.log(error);
                console.log('insertOne',result);
                if (result.acknowledged) {
                    db.collection('chatroom')
                        .find({ member : req.user.id })
                        .toArray(function (error, result1) {
                            result1.forEach(element => {
                                if (req.user.id == element.member[0]) {
                                    element.title = element.member[1];
                                } else {
                                    element.title = element.member[0];
                                }
                            });
                            res.render('chat.ejs', {chatlist : result1});
                    });
                }
            });
        } else {
            db.collection('chatroom').find({member : req.user.id}).toArray(function (error, result3) {
                console.log('result3', result3);
                res.render('chat.ejs', {chatlist : result3});
            });
        }
    });
});

/**
 * 채팅내역 조회
 */
app.get('/dialog', util.isLogin, (req,res)=>{
    console.log('get/dialog',req.query);
    db.collection('message').find({ chatRoomId : req.query.chatRoomId }).toArray((err,result)=>{
        console.log('get/dialog',result);
        res.send(result);
    });
});

/**
 * 채팅발행
 */
app.post('/message/',util.isLogin, (req,res)=>{
    var postItem = {
        chatRoomId : req.body.chatRoomId
        ,postId : req.user.id
        ,contents : req.body.content
        ,date : new Date()
    }
    db.collection('message').insertOne(postItem,(error,result)=>{
        res.sendStatus(200);
    });
});


app.get('/message', util.isLogin, (req,res)=>{
    console.log('get/message',req.query);
    /**
     * SSE 를 이용하여 채팅 구현하기
     * SSE 의 특징으로는 서버 -> 유저에게 일방적으로 통신이 가능하다. 
     * 양방향으로 통신 하려면 WebSocket 을 이용해야 한다.
     * 1:n 응답을 보내기 위해 response header 를 설정하면 응답을 여러번 보낼 수 있다.
     */
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      }
    );


    /**
     * mongodb change stream 를 설정해 놓으면 db에 변동이 있을때마다 조회 가능하다.
     * $match 에 조건을 부여 하므로써 일정 부분만 감시하게 된다.
     */
    const pipeline = [
        { 
            $match : { 'fullDocument.chatRoomId' : req.query.chatRoomId } 
        }
    ];
    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline);//.watch()를 붙이면 DB가 해당 document 를 감시한다.
    /**
     * @param result 수정, 삭제 등의 변경된 DB 데이터
     */
    changeStream.on('change', (result)=>{
        if(1){
            console.log('changeStream START====');
            /*
            {
                _id: {
                    _data: '82619B58890000006D2B022C0100296E5A10042BE5BE7DBB214BC589C6F6E486D3D76946645F69640064619B5889C8CE49FAF819C41F0004'
                },
                operationType: 'insert',
                clusterTime: new Timestamp({ t: 1637570697, i: 109 }),
                fullDocument: {
                    _id: new ObjectId("619b5889c8ce49faf819c41f"),
                    chatRoomId: '619b4c186fe6e59d4362f586',
                    postId: 'test1',
                    contents: '5',
                    date: 2021-11-22T08:44:57.111Z
                },
                ns: { db: 'ToDO', coll: 'message' },
                documentKey: { _id: new ObjectId("619b5889c8ce49faf819c41f") }
                }
            */
            // console.log('result',result);
            console.log('result.fullDocument',result.fullDocument);//{}
            console.log('changeStream END======');
        }
        /* 
        "event : xxx" 이렇게 쓰면 화면에서  이벤트 수신을 못한다
        "event: xxx" 붙여서 써야 한다.
        */
        res.write('event: testevent\n');
        res.write(`data: ${JSON.stringify([result.fullDocument])}\n\n`);
    });
});

//////////// WebSocket 기능 추가
/*
1. npm install socket.io 라이브러리 설치 
2. 아래 기능 정의

*/
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const { debug } = require('console');
const io = new Server(http);
/*
(이랬던걸)
app.listen(8080, function () {
  console.log('listening on 8080')
});

(이렇게)
http.listen(8080, function () {
  console.log('listening on 8080')
}); 
뭘 한거냐면 그냥 간략하게 express를 이용해서 서버를 띄우던걸
http라는 nodejs 기본 라이브러리 + socket.io를 이용해서 띄운겁니다.
*/
http.listen(8086, ()=>{
    console.log('listening on 8086 WebSocket Server Port');
});

app.get('/socket', (req,res)=>{
    res.render('socket.ejs');
});

let userList = new Map();
/**
 * 어떤유저가 접속하면 들어오게 된다.
 */
io.on('connection', (socket)=>{
    // console.log('WebSocekt 접속됨', socket.client.id); 
    /**
     * 어떤 유저가 'user-send'라는 이름으로 보내면 수신할 수 있게 된다.
     */
    socket.on('user-send', (data)=>{
        while (data.message.indexOf('\n') > 0) {
            data = data.replace('\n','\\n');
        }
        console.debug('접속된 유저들', socket.nsp.sockets.keys());
        var sockets = socket.nsp.sockets;
        console.log('data',data.id,data.username);
        userList.set(data.id, data.username);
        console.debug('userList',userList);
        // 소켓에 접속하지 않은 유저는 목록에서 제외 
        userList.forEach((value,key) => {
            console.debug('key',key)
            var has = false;
            sockets.forEach(socket => {
                if (key == socket.id) {
                    has = true;
                }
            });
            has || userList.delete(key);
        });
        var resdata = {
            userList : Object.fromEntries(userList),
            data : data
        }
        /**
         * io.emit 은 모은유저에게 보낸다
         */
        io.emit('broadcast', resdata);
        /**
         * 특정 socket id 를 갖는 유저에게만 전송하는 방법
         */
        // io.to(socket.id).emit('broadcast', resdata);


        /**
         * 채팅방을 여러개로 구분하기
         */
        socket.on('room1-send', function (data) {
            /**
             * 해당 socket 유저를 'room1'이라는 채널에 넣었다.
             */
            socket.join('room1');    
        });
        socket.on('room1-send', function (data) {
            /**
             * socket id 대신 room1 을 넣으면 해당 채널에 들어간 유저에게만 전송이 된다.
             */
            socket.to('room1').emit('key','value');    
        });
    });
});

