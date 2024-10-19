// tests/auth.test.js

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth API', () => {
  // Test case for successful login
  it('should login a user successfully', (done) => {
    chai.request(server)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // Test case for validation failure (missing email or password)
  it('should return validation error for missing fields', (done) => {
    chai.request(server)
      .post('/auth/login')
      .send({
        email: '',
        password: '',
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        done();
      });
  });

  // Test case for authentication failure (invalid credentials)
  it('should return authentication failure for invalid credentials', (done) => {
    chai.request(server)
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      })
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});