"use client";

import { useState, useEffect } from "react";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { ChartSection } from "@/components/chart-section";
import { AiInsights } from "@/components/ai-insights";
import type { Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, LockIcon } from "lucide-react";
import { useStorage } from "@/lib/use-storage";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function Home() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useStorage<Transaction[]>(
    "transactions",
    []
  );
  const [showCharts, setShowCharts] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const checkPremiumStatus = async () => {
        const response = await fetch("/api/check-premium");
        const data = await response.json();
        setIsPremium(data.isPremium);
      };
      checkPremiumStatus();
    }
  }, [session]);

  const addTransaction = (transaction: Transaction) => {
    const newTransactions = [
      ...transactions,
      { ...transaction, id: Date.now().toString() },
    ];
    setTransactions(filterTransactions(newTransactions));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(
      transactions.filter((transaction) => transaction.id !== id)
    );
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const calculateBalance = () => {
    return transactions.reduce((acc, transaction) => {
      return transaction.type === "income"
        ? acc + transaction.amount
        : acc - transaction.amount;
    }, 0);
  };

  const filterTransactions = (transactionList: Transaction[]) => {
    if (isPremium) return transactionList;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return transactionList.filter((t) => new Date(t.date) >= twoMonthsAgo);
  };

  const handleSubscribe = async () => {
    if (!session) {
      toast.error("Please sign in to upgrade to Premium");
      return;
    }
    const stripe = await stripePromise;
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
    });
    const sessionResponse = await response.json();
    const result = await stripe!.redirectToCheckout({
      sessionId: sessionResponse.id,
    });
    if (result.error) {
      toast.error(result.error.message!);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="dark:bg-gray-900 bg-gray-50 min-h-screen transition-colors duration-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">
              Expense Tracker
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
              {session ? (
                <>
                  <span className="dark:text-white">
                    Hello, {session.user?.name}
                  </span>
                  <Button onClick={() => signOut()}>Sign Out</Button>
                </>
              ) : (
                <Button onClick={() => signIn("google")}>Sign In</Button>
              )}
              {session && !isPremium && (
                <Button onClick={handleSubscribe}>Upgrade to Premium</Button>
              )}
            </div>
          </header>

          {session ? (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <ExpenseForm onAddTransaction={addTransaction} />
                  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2 dark:text-white">
                      Current Balance
                    </h2>
                    <p
                      className={`text-3xl font-bold ${
                        calculateBalance() >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ${calculateBalance().toFixed(2)}
                    </p>
                  </div>
                </div>

                <ExpenseList
                  transactions={transactions}
                  onDeleteTransaction={deleteTransaction}
                  isPremium={isPremium}
                />
              </div>

              {transactions.length > 0 && (
                <div className="mt-8">
                  <Button
                    className="w-full"
                    onClick={() => setShowCharts(!showCharts)}
                  >
                    {showCharts ? "Hide Charts" : "Generate Charts"}
                  </Button>

                  {showCharts && (
                    <div className="mt-6">
                      <ChartSection transactions={transactions} />
                      {isPremium ? (
                        <AiInsights transactions={transactions} />
                      ) : (
                        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200 flex items-center">
                          <LockIcon className="h-5 w-5 mr-2" />
                          <span>
                            Upgrade to Premium for AI-powered insights!
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center mt-10">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">
                Welcome to Expense Tracker
              </h2>
              <p className="mb-6 dark:text-gray-300">
                Please sign in to start tracking your expenses.
              </p>
              <Button onClick={() => signIn("google")}>
                Sign In with Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
