"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

const TOTAL_SQUARES = 1000
const SQUARE_VALUE = 1000
const TARGET_AMOUNT = TOTAL_SQUARES * SQUARE_VALUE
const GRID_COLUMNS = 40

type SquareData = {
  square_index: number
  title: string
  details: string | null
  color: string
}

type ChallengeGridProps = {
  userId: string
  initialSquares: SquareData[]
}

export default function ChallengeGrid({ userId, initialSquares }: ChallengeGridProps) {
  const [squares, setSquares] = useState<Map<number, SquareData>>(new Map())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null)
  const [formData, setFormData] = useState({ title: "", details: "", color: "#3b82f6" })
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({ years: 9, days: 245 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const squaresMap = new Map<number, SquareData>()
    initialSquares.forEach((square) => {
      squaresMap.set(square.square_index, square)
    })
    setSquares(squaresMap)
  }, [initialSquares])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1 }
        } else if (prev.years > 0) {
          return { years: prev.years - 1, days: 364 }
        } else {
          clearInterval(timer)
          return { years: 0, days: 0 }
        }
      })
    }, 86400000)

    return () => clearInterval(timer)
  }, [])

  const handleSquareClick = (index: number) => {
    setSelectedSquare(index)
    const existingSquare = squares.get(index)
    setFormData({
      title: existingSquare?.title || "",
      details: existingSquare?.details || "",
      color: existingSquare?.color || "#3b82f6",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (selectedSquare === null) return
    setIsLoading(true)

    try {
      const { error } = await supabase.from("user_squares").upsert({
        user_id: userId,
        square_index: selectedSquare,
        title: formData.title,
        details: formData.details || null,
        color: formData.color,
      })

      if (error) throw error

      // Update local state
      const newSquares = new Map(squares)
      newSquares.set(selectedSquare, {
        square_index: selectedSquare,
        title: formData.title,
        details: formData.details || null,
        color: formData.color,
      })
      setSquares(newSquares)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving square:", error)
      alert("Failed to save square. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (selectedSquare === null) return
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("user_squares")
        .delete()
        .eq("user_id", userId)
        .eq("square_index", selectedSquare)

      if (error) throw error

      // Update local state
      const newSquares = new Map(squares)
      newSquares.delete(selectedSquare)
      setSquares(newSquares)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error deleting square:", error)
      alert("Failed to delete square. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const completedSquares = squares.size
  const progressPercentage = (completedSquares / TOTAL_SQUARES) * 100

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              One Million Dollar Challenge
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fill 1000 squares • Each worth ${SQUARE_VALUE.toLocaleString()}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="border-border/50 bg-transparent">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="text-sm text-muted-foreground mb-1">Progress</div>
            <div className="text-3xl font-bold text-primary">${(completedSquares * SQUARE_VALUE).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">of ${TARGET_AMOUNT.toLocaleString()}</div>
            <div className="mt-4 bg-secondary/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 rounded-xl p-6">
            <div className="text-sm text-muted-foreground mb-1">Squares Filled</div>
            <div className="text-3xl font-bold text-accent">
              {completedSquares} / {TOTAL_SQUARES}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {((completedSquares / TOTAL_SQUARES) * 100).toFixed(1)}% complete
            </div>
          </div>

          <div className="bg-gradient-to-br from-success/20 to-success/5 border border-success/20 rounded-xl p-6">
            <div className="text-sm text-muted-foreground mb-1">Time Remaining</div>
            <div className="text-3xl font-bold text-success">
              {timeRemaining.years}y {timeRemaining.days}d
            </div>
            <div className="text-sm text-muted-foreground mt-1">Keep pushing forward!</div>
          </div>
        </div>

        {/* Grid Section */}
        <div className="bg-card border border-border/50 rounded-xl p-4 md:p-6 shadow-2xl">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: TOTAL_SQUARES }, (_, index) => {
              const squareIndex = index + 1
              const square = squares.get(squareIndex)
              return (
                <button
                  key={squareIndex}
                  onClick={() => handleSquareClick(squareIndex)}
                  className="aspect-square rounded-sm transition-all hover:scale-110 hover:z-10 hover:shadow-lg"
                  style={{
                    backgroundColor: square ? square.color : "#334155",
                  }}
                  title={square ? square.title : `Square ${squareIndex}`}
                  aria-label={square ? `View ${square.title}` : `Add goal to square ${squareIndex}`}
                />
              )
            })}
          </div>
        </div>
      </main>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl">Square {selectedSquare}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Launch my startup"
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Add more context about this goal..."
                className="bg-secondary/50 min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-12 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 bg-secondary/50"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {squares.get(selectedSquare!) && (
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                Delete
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
