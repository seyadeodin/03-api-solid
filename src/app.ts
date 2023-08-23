import fastify from 'fastify'
import { z } from 'zod'
import { prisma } from './lib/prisma'
import { appRoutes } from './http/routes'

export const app = fastify()

app.register(appRoutes)
