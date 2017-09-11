const chai = require('chai')
require('dotenv').config()

const expect = chai.expect

describe('Environment variables', () => {
  it('It is defined an process.env.ENVIRONMENT variable', () => {
    expect(typeof process.env.ENVIRONMENT).to.be.a('string')
  })

  it('process.env.ENVIRONMENT variable is "development" or "production"', () => {
    const validEnvironments = ['development', 'production']
    expect(validEnvironments).to.include(process.env.ENVIRONMENT)
  })

  it('It is defined a process.env.DATABASE variable', () => {
    expect(typeof process.env.DATABASE).to.be.a('string')
  })

  it('It is defined a process.env.JWT_SECRET variable', () => {
    expect(typeof process.env.JWT_SECRET).to.be.a('string')
  })
})
