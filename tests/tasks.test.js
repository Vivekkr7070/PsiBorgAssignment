const request = require('supertest');
const app = require('../server');
const Task = require('../models/Task');
const User = require('../models/User');

describe('Tasks API', () => {
  let token;
  
  beforeAll(async () => {
    const user = new User({
      username: 'manager',
      email: 'manager@example.com',
      password: 'Manager123!',
      role: 'Manager',
    });
    await user.save();

    const res = await request(app).post('/api/auth/login').send({
      email: 'manager@example.com',
      password: 'Manager123!',
    });
    token = res.body.token;
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', token)
      .send({
        title: 'Test Task',
        description: 'A task for testing',
        priority: 'Medium',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', 'Test Task');
  });

  it('should get all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should update a task', async () => {
    const task = await Task.findOne({ title: 'Test Task' });
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', token)
      .send({
        status: 'In Progress',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'In Progress');
  });

  it('should delete a task', async () => {
    const task = await Task.findOne({ title: 'Test Task' });
    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', token);
    expect(res.statusCode).toBe(200);
  });
});