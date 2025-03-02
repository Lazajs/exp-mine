"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Transaction } from "@/lib/types"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import toast from "react-hot-toast"

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  date: z.date(),
  category: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ExpenseForm({ onAddTransaction }: { onAddTransaction: (transaction: Transaction) => void }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      date: new Date(),
    },
  })

  const onSubmit = (data: FormData) => {
    try {
      onAddTransaction({
        id: "",
        ...data,
        amount: Number(data.amount),
        date: data.date.toISOString(),
      })
      reset()
      toast.success("Transaction added successfully")
    } catch (error) {
      toast.error("Failed to add transaction")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Add Transaction</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="description" className="dark:text-gray-300">
            Description
          </Label>
          <Input
            id="description"
            {...register("description")}
            placeholder="What was this transaction for?"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <Label htmlFor="amount" className="dark:text-gray-300">
            Amount ($)
          </Label>
          <Input
            id="amount"
            type="number"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0.00"
            step="0.01"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <Label htmlFor="category" className="dark:text-gray-300">
            Category
          </Label>
          <Input
            id="category"
            {...register("category")}
            placeholder="e.g., Food, Transport, etc."
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <Label className="dark:text-gray-300">Date</Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-800">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="dark:text-gray-300">
                  Expense
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="dark:text-gray-300">
                  Income
                </Label>
              </div>
            </RadioGroup>
          )}
        />

        <Button type="submit" className="w-full">
          Add Transaction
        </Button>
      </div>
    </form>
  )
}

