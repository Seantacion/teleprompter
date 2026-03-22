import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, password, newPassword, image } = await req.json()

  const updateData: any = {}
  if (name) updateData.name = name
  if (image) updateData.image = image

  if (newPassword) {
    if (!password) return NextResponse.json({ error: 'Current password required' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) return NextResponse.json({ error: 'Cannot change password for Google accounts' }, { status: 400 })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Wrong current password' }, { status: 400 })
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData })
  return NextResponse.json({ ok: true })
}