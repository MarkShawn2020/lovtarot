import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { z } from "zod"

const authSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
})

type AuthView = "login" | "register" | "verification-sent"

export function AuthPage() {
  const [view, setView] = useState<AuthView>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [toast, setToast] = useState<{ title: string; description: string; variant?: "destructive" } | null>(null)

  const { user, signIn, signUp, signInWithGoogle, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const redirectTo = searchParams.get("redirect") || "/"

  useEffect(() => {
    if (user && !isLoading) {
      navigate(redirectTo)
    }
  }, [user, isLoading, navigate, redirectTo])

  // 自动清除 toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const validateForm = useCallback(() => {
    try {
      authSchema.parse({ email, password })
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {}
        err.issues.forEach((error) => {
          if (error.path[0] === "email") {
            fieldErrors.email = error.message
          }
          if (error.path[0] === "password") {
            fieldErrors.password = error.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (view === "login") {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setToast({
              title: "登录失败",
              description: "邮箱或密码错误",
              variant: "destructive",
            })
          } else if (error.message.includes("Email not confirmed")) {
            setView("verification-sent")
            setToast({
              title: "邮箱未验证",
              description: "请先验证您的邮箱",
              variant: "destructive",
            })
          } else {
            setToast({
              title: "登录失败",
              description: error.message,
              variant: "destructive",
            })
          }
        } else {
          setToast({
            title: "登录成功",
            description: "欢迎回来！",
          })
          navigate(redirectTo)
        }
      } else if (view === "register") {
        const { error, needsVerification } = await signUp(email, password)
        if (error) {
          if (error.message.includes("User already registered")) {
            setToast({
              title: "注册失败",
              description: "该邮箱已被注册",
              variant: "destructive",
            })
          } else {
            setToast({
              title: "注册失败",
              description: error.message,
              variant: "destructive",
            })
          }
        } else if (needsVerification) {
          setView("verification-sent")
          setToast({
            title: "验证邮件已发送",
            description: "请查收邮箱并点击验证链接",
          })
        } else {
          setToast({
            title: "注册成功",
            description: "欢迎加入！",
          })
          navigate(redirectTo)
        }
      }
    } catch {
      setToast({
        title: "错误",
        description: "发生了意外错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 验证邮件已发送页面
  if (view === "verification-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
            {/* 邮件图标动画 */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30"></div>
              <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
              验证邮件已发送
            </h1>
            <p className="text-muted-foreground mb-2">
              我们已向
            </p>
            <p className="font-medium text-foreground mb-4 px-4 py-2 bg-secondary rounded-lg">
              {email}
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              发送了验证邮件，请查收并点击验证链接完成注册。
            </p>

            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setView("login")
                  setErrors({})
                }}
              >
                返回登录
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                没收到邮件？请检查垃圾邮件文件夹，<br />
                或确认邮箱地址是否正确。
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 登录/注册页面
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border ${
          toast.variant === "destructive"
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-card border-border text-foreground"
        }`}>
          <p className="font-medium text-sm">{toast.title}</p>
          <p className="text-xs opacity-80">{toast.description}</p>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
              {view === "login" ? "欢迎回来" : "创建账户"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {view === "login" ? "登录以开启牌面解读" : "注册以开始使用"}
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={async () => {
              setIsGoogleLoading(true)
              const { error } = await signInWithGoogle(redirectTo !== "/" ? redirectTo : undefined)
              if (error) {
                setToast({
                  title: "Google 登录失败",
                  description: error.message,
                  variant: "destructive",
                })
                setIsGoogleLoading(false)
              }
            }}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? "正在跳转..." : "使用 Google 登录"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "处理中..." : view === "login" ? "登录" : "注册"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setView(view === "login" ? "register" : "login")
                setErrors({})
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {view === "login" ? "没有账户？点击注册" : "已有账户？点击登录"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
