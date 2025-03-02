"use client"

import { useState, useEffect } from "react"
import type { Transaction } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, LockIcon } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { useSession } from "next-auth/react"

export function AiInsights({ transactions }: { transactions: Transaction[] }) {
  const { data: session } = useSession()
  const [insights, setInsights] = useState<string>("")
  const [tips, setTips] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const generateInsights = async () => {
    if (transactions.length === 0 || !session?.user?.isPremium) return

    setLoading(true)

    try {
      // Calculate some basic stats for the AI
      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      const categories = transactions
        .filter((t) => t.type === "expense")
        .reduce<Record<string, number>>((acc, t) => {
          const category = t.category || "Other"
          acc[category] = (acc[category] || 0) + t.amount
          return acc
        }, {})

      // Generate chart insights
      const { text: chartInsights } = await generateText({
        model: openai("gpt-4o"),
        prompt: `
          Analyze this financial data and provide a brief, helpful insight about the spending patterns:
          
          Total Income: $${totalIncome.toFixed(2)}
          Total Expenses: $${totalExpenses.toFixed(2)}
          Expense Categories: ${JSON.stringify(categories)}
          
          Keep your response under 150 words and focus on the most important patterns or observations.
        `,
      })

      setInsights(chartInsights)

      // Generate saving tips
      const { text: savingTips } = await generateText({
        model: openai("gpt-4o"),
        prompt: `
          Based on this financial data, provide 3 specific, actionable tips to help the user save money:
          
          Total Income: $${totalIncome.toFixed(2)}
          Total Expenses: $${totalExpenses.toFixed(2)}
          Expense Categories: ${JSON.stringify(categories)}
          
          Format your response as a JSON array of 3 strings, each containing one tip. 
          Each tip should be concise (under 100 characters) and specific to the data.
          Example format: ["Tip 1", "Tip 2", "Tip 3"]
        `,
      })

      try {
        const parsedTips = JSON.parse(savingTips)
        if (Array.isArray(parsedTips)) {
          setTips(parsedTips.slice(0, 3))
        }
      } catch (e) {
        // Fallback if parsing fails
        setTips([
          "Consider reducing your largest expense category",
          "Try to save at least 20% of your income",
          "Track your expenses regularly to identify patterns",
        ])
      }
    } catch (error) {
      console.error("Error generating AI insights:", error)
      setInsights("Unable to generate insights at this time. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (transactions.length > 0 && session?.user?.isPremium) {
      generateInsights()
    }
  }, [transactions, session?.user?.isPremium]) // Removed generateInsights from dependencies

  if (!session?.user?.isPremium) {
    return (
      <Card className="mt-6 dark:bg-gray-800 border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="dark:text-white">AI Insights</CardTitle>
            <CardDescription className="dark:text-gray-400">Upgrade to Premium for AI-powered analysis</CardDescription>
          </div>
          <LockIcon className="h-6 w-6 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <p className="dark:text-gray-300">Get personalized insights and saving tips with our Premium plan!</p>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <Card className="mt-6 dark:bg-gray-800 border-none shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="dark:text-white">AI Insights</CardTitle>
          <CardDescription className="dark:text-gray-400">Smart analysis of your financial data</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={generateInsights}
          disabled={loading}
          className="dark:text-gray-300 dark:hover:text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 dark:text-white">Chart Analysis</h3>
              <p className="dark:text-gray-300">{insights}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 dark:text-white">Saving Tips</h3>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md dark:text-gray-200">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

