import { login } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">SG</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
            Masuk ke Ekadata Setda GK
          </h2>
          <p className="mt-2 text-center text-sm font-medium text-slate-500">
            Sistem Informasi Program Kegiatan
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={login}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Alamat Email / NIP
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-800 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-red-600 focus:border-red-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Email atau NIP"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-800 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-red-600 focus:border-red-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Kata Sandi"
              />
            </div>
          </div>

          {searchParams?.message && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-100">
              {searchParams.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
