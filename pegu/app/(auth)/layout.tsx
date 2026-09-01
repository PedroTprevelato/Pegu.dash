export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#101318] text-white flex flex-col items-center pt-16 p-4">
      <div className="flex flex-col items-center mb-12 gap-2">
        {/* === ESTE É O BLOCO QUE VAMOS SUBSTITUIR === */}
        <div className="w-16 h-16 bg-[#3D8BD1] rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-4xl font-bold">P</span>
        </div>
        {/* =========================================== */}
        <h1 className="text-4xl font-bold tracking-tight text-white">PEGU</h1>
        <p className="text-[#9ca3af] text-center max-w-sm">
          Gestão financeira, vendas e estoque
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
