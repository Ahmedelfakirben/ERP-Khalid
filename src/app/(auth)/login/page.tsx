"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShoppingBag } from "lucide-react"
import { InstallPWA } from "@/components/auth/install-pwa"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const isPosRedirect = redirectTo === "/pos" || redirectTo.startsWith("/pos")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError("Identifiants incorrects. Veuillez réessayer.")
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-orange-500/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-6 flex flex-col items-center gap-4">
          <div className="h-40 w-40 overflow-hidden rounded-xl shadow-lg ring-4 ring-orange-500/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-orange-500">
            Digital ALT
          </h1>
          {isPosRedirect && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-orange-500/40 text-orange-400 bg-orange-500/10 font-bold">
              <ShoppingBag className="h-3.5 w-3.5" />
              Terminal Point de Vente (POS)
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl">
          {isPosRedirect ? "Session Caisse POS" : "Connexion"}
        </CardTitle>
        <CardDescription>
          {isPosRedirect
            ? "Connectez-vous pour ouvrir votre session de caisse"
            : "Accédez à votre espace de gestion"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPosRedirect ? "Accéder à la Caisse" : "Se connecter"}
          </Button>
        </form>

        <InstallPWA />
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
