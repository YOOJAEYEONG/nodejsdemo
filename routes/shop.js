/**
 * express 에서 기본 제공하는 router 사용을 정의
 * require 사용하려는 파일이나 객체를 정의할 수 있다.
 */
var router = require('express').Router();
var util = require('../util/util.js');

/**
 * 이페이지는 로그인한 유저만 접속가능하도록 미들웨어를 추가했다.
 * 이런 방법으로 특정 라우터에 미들웨어를 추가할 수있는데 이 갯수가 많아질 경우 일일이 추가하는것이 어렵기 때문에
 * 다음과 같은 방법으로 일괄 적용하는 방법도 있다.
 * express 공식 문서를 참고하면 됨
 * router.use(isLogin)
 * router.use('/shirts',isLogin)
 */
router.get('/shirts',util.isLogin, function(요청, 응답){
   응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(요청, 응답){
   응답.send('바지 파는 페이지입니다.');
}); 

module.exports = router;
