var router = require('express').Router();
var util = require('../util/util.js');
var ObjectId = require('mongodb').ObjectID;


/**
  * 미들웨어 사용하는 법
  * 로그인 상태 검사하는 함수 
  * 로그인상태면 다음으로 넘어가고 아니면 메시지를 보냄
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
// function util.isLogin(req,res,next) {
//     // 로그인후 세션이 있으면 user 값을 갖고 있게 된다.
//     console.log('util.isLogin', req.user);
//     if (req.user) {
//         //미들웨어를 여러개 호출할 수도 있는데  next('route') 를 호출하게되면 다음 미들웨어를 모두 건너뛴다
//         next();
//     } else {
//         res.send('로그인하지 않았음');
//     }   
// }


router.get('/list',function (req,res) {
    console.log('get /list',req.query, req.query.value);
    if (req.query && req.query.value ) {
        /*
        find() 는 기본적으로 full scan 이기 때문에 조회 속도가 떨어진다.
        */
        // db.collection('post').find( {title : req.query.value}).toArray(function (error,result) {
        /*
        full scan 을 개선하기 위해 mongodb 에 인덱스를 생성해놓았다. 
        index 를 이용한 검색은 binary search 라고 함. 
        이를 이용하기 위해서는 인덱스로 사용할 컬럼을 지정해 놓아야 db 내부에서 해당 컬럼의 튜플들을
        미리 정렬 시켜 놓는다. 
        id 값은 숫자 여야 하고, 
        title 값은 text 형으로 지정해 놓는다. 그리고 아래와 같이 검색 파라미터를 생성한 인덱스 값으로 
        지정하여 사용할 수 있다. 
        text index 만들어두면 구글 검색법같은 검색 기능을 사용할 수 있다.
        -[검색어] 로 검색하는경우 해당 단어는 제외한 검색결과를 얻을 수 있다.
        "[검색어]" 로 검색하면 정확히 일치하는 것을 검색할 수 있다.
        */
        // db.collection('post').find( { $text : { $search : req.query.value } } ).toArray(function (error,result) {
        //     console.log('get:/list1',result);
        //     error && console.log(error);
        //     res.render('list.ejs', {posts : result});
        // });

        /*
        find() 안에 저렇게 $text 어쩌구로 시작하시면 만들어둔 text 인덱스에서 검색이 가능합니다.
        이렇게 기능개발해놓으면 간단한 검색엔진처럼 검색도 가능한데 검색창에
        이닦기 글쓰기라고 검색하면 이닦기 or 글쓰기가 포함된 모든 문서를 찾아줌
        이닦기 -글쓰기라고 검색하면 이닦기인데 글쓰기라는 단어 제외 검색
        "이닦기 글쓰기" 라고 검색하면 정확히 이닦기 글쓰기라는 phrase가 포함된 문서 검색
        이렇게 가능합니다. 
        심각한 단점 :
            글쓰기라고 검색하라면 글쓰기입니다~ 이런 문장은 못찾아줍니다.
            영어는 상관없는데 영어가 아닌 언어들은 그래서 text search 기능을 쓸 수가 없습니다.
            그래서 그냥 영어서비스 개발할거면 쓰시고 아니라면 지웁시다. 
            그럼 100만개에서 '글쓰기'라는 단어가 포함된 문서를 검색해야하면 어떻게 하죠 ㄷㄷ

        해결책 1. 검색할 문서의 양을 제한을 둡니다.
            DB에다가 검색요청을 날릴 때 특정 날짜에서만 검색하라고 요구할 수도 있고
            skip(), limit() 이런 함수를 이용하시면 pagination 기능을 개발할 수 있습니다.
            그니까 맨 처음 검색할 땐 맨앞에 20개만 찾아줘~
            그 다음엔 다음 20개를 찾아줘~ 
            이렇게 요구할 수 있다는 겁니다. 대부분의 게시판들은 이런 방법을 이용합니다. 
        해결책 2. text search 기능을 굳이 쓰고 싶으면
            MongoDB를 님들이 직접 설치하셔야합니다. 
            그리고 indexing할 때 띄어쓰기 단위로 글자들을 indexing하지말고
            다른 알고리즘을 써라~ 라고 셋팅할 수 있습니다. 
            nGram 이런 알고리즘을 쓰면 된다고 하는데 이걸 언제하고 있습니까 패스합시다  
        해결책 3. Search index를 사용합니다.
            MongoDB Atlas에서만 제공하는 기능인데 
            클러스터 들어가보시면 아마 Search 어쩌구라는 메뉴가 있을겁니다. 그거 누르시면 됩니다. 
        */

        /**
         * 기존에 생성한 인덱스를 사용하지 않고 mongoDB Atlas 에서는 별도의 Search Index를 제공한다.
         * aggregate() 함수를 쓰는데 이건 검색조건 여러개를 붙이고 싶을 때 유용한 함수입니다. 
            aggregate() 안에 [ {검색조건1}, {검색조건2} ... ] 이렇게 조건을 여러개 집어넣을 수 있습니다. 
            지금은 하나만 집어넣어봄 
            그리고 연산자인 $search를 넣으면 search index에서 검색이 된다고 하는군요. 
            뭔가 길어보이지만 search index쓰는 방법을 그대로 카피해서 썼을 뿐입니다. 이것도 원리이해보다는 복붙의 영역임 
            아무튼 저렇게 쓰시면 '글쓰기' 라고 검색했을 때 '글쓰기합니다~' 이런 문장들도 잘 검색해줍니다. 끝 
            aggregate() 안에 [ {검색조건1}, {검색조건2} ... ] 이렇게 여러개 넣을 수 있댔는데
            그래서 여러개 저렇게 넣으시면 됩니다. 
         */
         var 검색조건 = [
            {
              $search: {
                index: 'titleSearch',//님이만든인덱스명
                text: {
                  query: req.query.value,
                  path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                //   path: {
                //     'wildcard': '*'
                //   }
                }
              }
            }
            ,{ $sort : { _id : -1 }}// 정렬을 _id 순으로 내림차순으로 정렬한다. 1 : 오름차순  -1 : 내림차순 
            ,{ $limit : 10 } // 검색 갯수를 제한 , 게시판등에 사용
            // ,{ $project : { 제목 : 1, _id : 0 } } // $project를 쓰면 찾아온 결과 중에 원하는 항목만 보여줍니다. 0은 안보여주고 1은 보여주라는 뜻입니다. 위의 코드는 _id는 빼고 제목만 가져오겠군요. 
            // 이 외에도 백만개의 $연산자가 있다고 합니다.
          ] 
          req.app.db.aggregate(검색조건).toArray((error, result)=>{
            console.log('get:/list1',result);
            error && console.log(error);
            res.render('list.ejs', {posts : result});
        });
    } else {
        req.app.db.collection('post').find().toArray(function (error,result) {
            error && console.log(error);
            console.log('get:/list2',result.length);
            res.render('list.ejs', {posts : result});
        });
    }
    /*
    operator : 
        $set : 값변경
        $inc : 값증가
        $min : 기존값보다 적을때만 변경
        $rename : key 값을 변경
        ...
    */
    // db.collection('post').updateOne({_id:1},{ $set : {title : title+'수정된title'} }, function (error,result) {
        
    // });
});




router.get('/write',util.isLogin,function (req,res) {
    res.render('write.ejs');
});

router.post('/add',util.isLogin,function (req,res) {
    console.log(req.body);
    var totalCount = req.app.db.collection('post').find().toArray(function (error,result) {
        console.log('result',result);
        var nextKey = result.length || 0 | 1;
        console.log('user',req.user);
        var one = {
            title: req.body.title, 
            content : req.body.content,
            dt : new Date(),
            id : req.user.id
        }
        req.app.db.collection('post').insertOne( one ,function (error,result) {
            console.log(result,error);
            res.redirect('/list');
        });
    });
});

router.get('/detail/:id',function (req,res) {
    console.log('/detail',req.params.id);
    req.app.db.collection('post').findOne({_id : ObjectId(req.params.id) }, function (error, result) {
        console.log(result);
        res.render('detail.ejs', {data : result});
    })
});


router.get('/edit/:id',function (req,res) {
    req.app.db.collection('post').findOne({_id : ObjectId(req.params.id) } , function (error, result) {
        console.log('get:/edit',result);
        res.render('edit.ejs', {data : result});
    })
});

router.put('/edit',function (req,res) {
    console.log('put:/edit',req.body);
    req.app.db.collection('post').updateOne({_id :  ObjectId(req.params.id) } , { $set : { title : req.body.title, dt: req.body.dt}}, function (error, result) {
        console.log(error, result);
        if (result.modifiedCount > 0) {
            res.status(200).send('ok');
        }
    });
});


router.delete('/delete',function (req,res) {
    console.log('req.body',req.body._id);
    req.app.db.collection('post').deleteOne({_id: ObjectId(req.body._id)}, function (error, result) {
        console.log('error',error);
        console.log(result);
        res.status(200).send(result);
    })
});


module.exports = router;
