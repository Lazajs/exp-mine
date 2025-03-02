import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ isPremium: false })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (sessionId) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
      if (checkoutSession.payment_status === "paid" && checkoutSession.client_reference_id === session.user.id) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { isPremium: true },
        })
        return NextResponse.json({ isPremium: true })
      }
    } catch (err) {
      console.error("Error checking Stripe session:", err)
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true },
  })

  return NextResponse.json({ isPremium: user?.isPremium || false })
}

