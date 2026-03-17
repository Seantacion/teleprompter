// lib/redis.ts — kalau belum ada
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL!)
export default redis