import type { Transaction } from "@/lib/types"
import { format, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Trash2, LockIcon } from "lucide-react"

export function ExpenseList({
  transactions,
  onDeleteTransaction,
  isPremium,
}: {
  transactions: Transaction[]
  onDeleteTransaction: (id: string) => void
  isPremium: boolean
}) {
  const twoMonthsAgo = subMonths(new Date(), 2)
  const recentTransactions = transactions.filter((t) => new Date(t.date) >= twoMonthsAgo)
  const olderTransactions = transactions.filter((t) => new Date(t.date) < twoMonthsAgo)

  if (transactions.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Transactions</h2>
        <p className="text-gray-500 dark:text-gray-400">No transactions yet. Add one to get started!</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Transactions</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {recentTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDeleteTransaction} />
        ))}
        {!isPremium && olderTransactions.length > 0 && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200 flex items-center">
            <LockIcon className="h-5 w-5 mr-2" />
            <span>
              You have {olderTransactions.length} older transactions. Upgrade to Premium to access your full history!
            </span>
          </div>
        )}
        {isPremium &&
          olderTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDeleteTransaction} />
          ))}
      </div>
    </div>
  )
}

function TransactionItem({ transaction, onDelete }: { transaction: Transaction; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium dark:text-white">{transaction.description}</h3>
          <span className={`font-semibold ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(transaction.date), "MMM d, yyyy")}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(transaction.id)}
        className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

