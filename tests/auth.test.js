const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication', () => {
  let token;
  
  it('should register a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should log in the user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Test1234!',
    });
    expect(res.statusCode).toBe(200);
    token = res.body.token;
    expect(token).not.toBeNull();
  });

  it('should get the current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });
});
