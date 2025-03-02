"use client"

import { useState } from "react"
import type { Transaction } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { format, subDays, isWithinInterval, startOfMonth, endOfMonth, parseISO } from "date-fns"

export function ChartSection({ transactions }: { transactions: Transaction[] }) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week")

  // Filter transactions based on time range
  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = parseISO(transaction.date)
    const today = new Date()

    if (timeRange === "week") {
      const weekAgo = subDays(today, 7)
      return isWithinInterval(transactionDate, { start: weekAgo, end: today })
    } else if (timeRange === "month") {
      return isWithinInterval(transactionDate, {
        start: startOfMonth(today),
        end: endOfMonth(today),
      })
    }

    return true // "all" time range
  })

  // Prepare data for charts
  const prepareBarChartData = () => {
    const data: Record<string, { date: string; income: number; expense: number }> = {}

    filteredTransactions.forEach((transaction) => {
      const date = format(parseISO(transaction.date), "MMM d")

      if (!data[date]) {
        data[date] = { date, income: 0, expense: 0 }
      }

      if (transaction.type === "income") {
        data[date].income += transaction.amount
      } else {
        data[date].expense += transaction.amount
      }
    })

    return Object.values(data)
  }

  const preparePieChartData = () => {
    const categoryData: Record<string, { name: string; value: number; type: "income" | "expense" }> = {}

    filteredTransactions.forEach((transaction) => {
      const category = transaction.category || (transaction.type === "income" ? "Other Income" : "Other Expense")
      const key = `${category}-${transaction.type}`

      if (!categoryData[key]) {
        categoryData[key] = { name: category, value: 0, type: transaction.type }
      }

      categoryData[key].value += transaction.amount
    })

    return Object.values(categoryData)
  }

  const prepareLineChartData = () => {
    const data: Record<string, { date: string; balance: number }> = {}
    let runningBalance = 0

    // Sort transactions by date
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
    )

    sortedTransactions.forEach((transaction) => {
      const date = format(parseISO(transaction.date), "MMM d")

      if (transaction.type === "income") {
        runningBalance += transaction.amount
      } else {
        runningBalance -= transaction.amount
      }

      data[date] = { date, balance: runningBalance }
    })

    return Object.values(data)
  }

  const barChartData = prepareBarChartData()
  const pieChartData = preparePieChartData()
  const lineChartData = prepareLineChartData()

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <Card className="dark:bg-gray-800 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="dark:text-white">Financial Charts</CardTitle>
        <CardDescription className="dark:text-gray-400">Visualize your income and expenses over time</CardDescription>
        <div className="flex justify-end">
          <Tabs defaultValue="week" onValueChange={(value) => setTimeRange(value as "week" | "month" | "all")}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income-expense">
          <TabsList className="w-full">
            <TabsTrigger value="income-expense" className="flex-1">
              Income vs Expense
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">
              Categories
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex-1">
              Balance Over Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income-expense" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="expense" name="Expense" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.filter((item) => item.type === "expense")}
                    cx="30%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData
                      .filter((item) => item.type === "expense")
                      .map((entry, index) => (
                        <Cell key={`cell-expense-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Pie
                    data={pieChartData.filter((item) => item.type === "income")}
                    cx="70%"
                    cy="50%"
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData
                      .filter((item) => item.type === "income")
                      .map((entry, index) => (
                        <Cell key={`cell-income-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2 text-sm dark:text-gray-300">
              <div>Expenses</div>
              <div>Income</div>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

