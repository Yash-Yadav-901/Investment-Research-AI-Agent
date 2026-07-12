import {createClient} from 'redis';

const client = createClient({
    url: 'redis://localhost:6379'
})

client.on('error', err => console.log('Redis Client Error', err));

const redisClient= await client.connect();

export {redisClient};
