import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { search } from './search'
import { nearby } from './nearby'
import { create } from './create'
import { verifyUserRole } from '@/http/middlewares/verify-user-role'

export async function gymRoutes(app: FastifyInstance) {
  // hook === middleware
  app.addHook('onRequest', verifyJWT)

  app.get('/gyms/search', search)
  app.get('/gyms/nearby', nearby)

  app.register(async function adminAuthentication(childrenServer) {
    childrenServer.decorateRequest('roles', ['ADMIN'])
    childrenServer.addHook('preValidation', verifyUserRole)

    childrenServer.post('/gyms', create)
  })
}
