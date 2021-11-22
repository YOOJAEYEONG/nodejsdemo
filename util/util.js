 /**
  * 미들웨어 사용하는 법
  * 로그인 상태 검사
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  function isLogin(req,res,next) {
    // 로그인후 세션이 있으면 user 값을 갖고 있게 된다.
    // console.log('isLogin', req.user);
    if (req.user) {
        next();
    } else {
        res.send('로그인하지 않았음');
    }   
}

module.exports = {
    isLogin : isLogin
};