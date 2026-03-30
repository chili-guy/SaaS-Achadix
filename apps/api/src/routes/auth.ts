import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const loginSchema = z.object({
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const { password } = loginSchema.parse(req.body)

    if (password !== process.env.ADMIN_PASSWORD) {
      return reply.status(401).send({ error: 'Invalid password' })
    }

    const token = app.jwt.sign(
      { role: 'admin' },
      { expiresIn: '7d' }
    )

    return reply.send({ token })
  })
}
