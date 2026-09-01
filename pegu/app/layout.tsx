TypeScript
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'PEGU - Autenticação',
  description: 'Acesse sua conta na PEGU',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#101318] text-white flex flex-col items-center pt-16 p-4">
      <div className="flex flex-col items-center mb-12 gap-3">
        
        {/* Ícone atualizado com a nova identidade visual */}
        <div className="relative w-20 h-20 mb-2">
          <Image 
            src="/logo_pegu_3d.png" 
            alt="Logo PEGU 3D"
            fill
            className="object-contain rounded-2xl"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">PEGU</h1>
        <p className="text-[#9ca3af] text-center max-w-sm">
          Gestão financeira, vendas e estoque
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
