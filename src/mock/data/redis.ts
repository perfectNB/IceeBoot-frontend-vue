export interface RedisKey {
  key: string
  type: string
  value: string | number | object | boolean
  ttl: number
  size: string
}

export const redisData: RedisKey[] = [
  {
    key: 'user:session:12345',
    type: 'string',
    value: '{"userId":"12345","username":"admin","loginTime":"2024-01-15 10:30:00"}',
    ttl: 3600,
    size: '128B'
  },
  {
    key: 'cache:user:profile:admin',
    type: 'hash',
    value: {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'super_admin'
    },
    ttl: 7200,
    size: '256B'
  },
  {
    key: 'queue:email:pending',
    type: 'list',
    value: [
      'email:task:001',
      'email:task:002',
      'email:task:003'
    ],
    ttl: -1,
    size: '512B'
  },
  {
    key: 'set:online:users',
    type: 'set',
    value: ['user1', 'user2', 'user3', 'admin'],
    ttl: 1800,
    size: '64B'
  },
  {
    key: 'ranking:user:score',
    type: 'zset',
    value: {
      'user1': 100,
      'user2': 85,
      'user3': 92,
      'admin': 150
    },
    ttl: -1,
    size: '320B'
  },
  {
    key: 'config:system:settings',
    type: 'string',
    value: '{"theme":"dark","language":"zh-CN","timezone":"Asia/Shanghai"}',
    ttl: -1,
    size: '96B'
  },
  {
    key: 'cache:api:response:users',
    type: 'string',
    value: '[{"id":1,"name":"张三"},{"id":2,"name":"李四"}]',
    ttl: 600,
    size: '180B'
  },
  {
    key: 'lock:resource:database',
    type: 'string',
    value: 'locked_by_process_12345',
    ttl: 30,
    size: '32B'
  },
  {
    key: 'counter:page:views',
    type: 'string',
    value: '15847',
    ttl: -1,
    size: '8B'
  },
  {
    key: 'temp:upload:file123',
    type: 'string',
    value: 'temporary_file_data_placeholder',
    ttl: 300,
    size: '1.2KB'
  }
]