// tests/tasks.test.js

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Tasks API', () => {
  let token;

  before((done) => {
    // Assuming you have an auth route to get a valid token
    chai.request(server)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .end((err, res) => {
        token = res.body.token;
        done();
      });
  });

  // Test case for creating a task (success)
  it('should create a new task', (done) => {
    chai.request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Task',
        description: 'Task description',
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('task');
        done();
      });
  });

  // Test case for validation error
  it('should return validation error for missing title', (done) => {
    chai.request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '',
        description: 'Task description',
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        done();
      });
  });

  // Test case for authentication failure (missing token)
  it('should return authentication failure for missing token', (done) => {
    chai.request(server)
      .post('/tasks')
      .send({
        title: 'New Task',
        description: 'Task description',
      })
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});