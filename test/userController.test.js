/*
* This has to test all endpoints and functions
* of user controller
*/

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../server')

const expect = chai.expect
chai.use(chaiHttp)

describe('Server', () => {
  const uri = '/api/v1/user/me'
  const uriNewUser = '/api/v1/user'

  describe('POST /api/v1/user', () => {
    it('status 400 and proper object response if no name provided', (done) => {
      chai.request(server)
        .post(uriNewUser)
        .send({ email: 'test@test.com', password: 'test' })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('KO')
          expect(res.body).to.have.property('message')
          expect(res.body.message).to.include('name')
          expect(res.body.message.toLowerCase()).to.include('missing')
          done()
        })
    })

    it('status 400 and proper object response if no password provided', (done) => {
      chai.request(server)
        .post(uriNewUser)
        .send({ email: 'test@test.com', name: 'test' })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('KO')
          expect(res.body).to.have.property('message')
          expect(res.body.message).to.include('password')
          expect(res.body.message.toLowerCase()).to.include('missing')
          done()
        })
    })

    it('status 400 and proper object response if no email provided', (done) => {
      chai.request(server)
        .post(uriNewUser)
        .send({ password: 'test', name: 'test' })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('KO')
          expect(res.body).to.have.property('message')
          expect(res.body.message).to.include('email')
          expect(res.body.message.toLowerCase()).to.include('missing')
          done()
        })
    })
  })

  describe('GET /api/v1/user/me', () => {
    it('responds with status 400 and proper response object if no params', (done) => {
      chai.request(server)
        .get(uri)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('KO')
          expect(res.body).to.have.property('message')
          expect(res.body.message).to.be.a('string')
          expect(res.body.message).to.not.be.empty
          done()
        })
    })

    it('responds with 401 if token no valid', (done) => {
      chai.request(server)
        .get(uri)
        .query({ token: 'randomstring' })
        .end((err, res) => {
          expect(res).to.have.status(401)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('KO')
          expect(res.body).to.have.property('message')
          expect(res.body.message).to.be.a('string')
          expect(res.body.message).to.not.be.empty
          done()
        })
    })
  })
})
