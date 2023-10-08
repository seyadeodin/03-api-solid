import * as fastify from 'fastify'
import { Role } from './roles'

declare module 'fastify' {
  export interface FastifyRequest {
    roles: Role[]
  }
}
