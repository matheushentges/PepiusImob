export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Pepius Imob</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com sua conta
          </p>
        </div>

        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm"
                >
                  Lembrar de mim
                </label>
              </div>

              <a
                href="/recuperar-senha"
                className="text-sm font-medium text-primary hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <a href="/contato" className="font-medium text-primary hover:underline">
              Fale conosco
            </a>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
}
