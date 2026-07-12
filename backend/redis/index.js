import {createClient} from 'redis';
import { config } from 'dotenv';
config({path: '../.env'});
const client = createClient({
    url: process.env.REDIS_URL,
})

client.on('error', err => console.log('Redis Client Error', err));

const redisClient= await client.connect();

export {redisClient};
