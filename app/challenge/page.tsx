import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ChallengeGrid from "@/components/challenge-grid"

export default async function ChallengePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user's squares
  const { data: squares } = await supabase
    .from("user_squares")
    .select("*")
    .eq("user_id", data.user.id)
    .order("square_index")

  return <ChallengeGrid userId={data.user.id} initialSquares={squares || []} />
}
