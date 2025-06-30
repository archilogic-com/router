
var Router = require('..')
var utils = require('./support/utils')

var createServer = utils.createServer
var request = utils.request

describe('req.params', function () {
  it('should default to empty object', function (done) {
    var router = Router()
    var server = createServer(router)

    router.get('/', sawParams)

    request(server)
    .get('/')
    .expect(200, '{}', done)
  })

  it('should not exist outside the router', function (done) {
    var router = Router()
    var server = createServer(function (req, res, next) {
      router(req, res, function (err) {
        if (err) return next(err)
        sawParams(req, res)
      })
    })

    router.get('/', hitParams(1))

    request(server)
    .get('/')
    .expect('x-params-1', '{}')
    .expect(200, '', done)
  })

  it('should overwrite value outside the router', function (done) {
    var router = Router()
    var server = createServer(function (req, res, next) {
      req.params = {'foo': 'bar'}
      router(req, res, done)
    })

    router.get('/', sawParams)

    request(server)
    .get('/')
    .expect(200, '{}', done)
  })

  it('should restore previous value outside the router', function (done) {
    var router = Router()
    var server = createServer(function (req, res, next) {
      req.params = {'foo': 'bar'}

      router(req, res, function (err) {
        if (err) return next(err)
        sawParams(req, res)
      })
    })

    router.get('/', hitParams(1))

    request(server)
    .get('/')
    .expect('x-params-1', '{}')
    .expect(200, '{"foo":"bar"}', done)
  })

  describe('when "mergeParams: true"', function () {
    it('should merge outsite object with params', function (done) {
      var router = Router({ mergeParams: true })
      var server = createServer(function (req, res, next) {
        req.params = {'foo': 'bar'}

        router(req, res, function (err) {
          if (err) return next(err)
          sawParams(req, res)
        })
      })

      router.get('/:fizz', hitParams(1))

      request(server)
      .get('/buzz')
      .expect('x-params-1', '{"foo":"bar","fizz":"buzz"}')
      .expect(200, '{"foo":"bar"}', done)
    })

    it('should ignore non-object outsite object', function (done) {
      var router = Router({ mergeParams: true })
      var server = createServer(function (req, res, next) {
        req.params = 42

        router(req, res, function (err) {
          if (err) return next(err)
          sawParams(req, res)
        })
      })

      router.get('/:fizz', hitParams(1))

      request(server)
      .get('/buzz')
      .expect('x-params-1', '{"fizz":"buzz"}')
      .expect(200, '42', done)
    })

    it('should overwrite outside keys that are the same', function (done) {
      var router = Router({ mergeParams: true })
      var server = createServer(function (req, res, next) {
        req.params = {'foo': 'bar'}

        router(req, res, function (err) {
          if (err) return next(err)
          sawParams(req, res)
        })
      })

      router.get('/:foo', hitParams(1))

      request(server)
      .get('/buzz')
      .expect('x-params-1', '{"foo":"buzz"}')
      .expect(200, '{"foo":"bar"}', done)
    })

    describe('with numeric properties in req.params', function () {
      it('should merge numeric properies by offsetting', function (done) {
        var router = Router({ mergeParams: true })
        var server = createServer(function (req, res, next) {
          req.params = {'0': 'foo', '1': 'bar'}

          router(req, res, function (err) {
            if (err) return next(err)
            sawParams(req, res)
          })
        })
        // https://expressjs.com/en/guide/migrating-5.html#path-syntax
        router.get('/*asdf', hitParams(1))

        request(server)
        .get('/buzz')
        .expect('x-params-1', '{"0":"foo","1":"bar","asdf":"buzz"}')
        .expect(200, '{"0":"foo","1":"bar"}', done)
      })

    })
  })
})

function hitParams(num) {
  var name = 'x-params-' + String(num)
  return function hit(req, res, next) {
    res.setHeader(name, JSON.stringify(req.params))
    next()
  }
}

function sawParams(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(req.params))
}
