import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'

export async function gymRoutes(app: FastifyInstance) {
  // hook === middleware
  app.addHook('onRequest', verifyJWT)
}
