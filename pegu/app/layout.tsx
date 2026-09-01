import type { Metadata } from 'next'
import Image from 'next/image' // Importação necessária

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
      <div className="flex flex-col items-center mb-12 gap-3"> {/* Aumentei um pouco o gap */}
        
        {/* === NOVO BLOCO COM O LOGOTIPO 3D === */}
        <div className="relative w-20 h-20 mb-2"> {/* Container para a imagem */}
          <Image 
            src="/logo_pegu_3d.png" // Caminho para o arquivo que você salvou na pasta public/
            alt="Logo PEGU 3D"
            fill // Faz a imagem preencher o container pai
            className="object-contain rounded-3xl" // Mantém a proporção e adiciona bordas arredondadas (opcional)
            priority // Carrega esta imagem com prioridade
          />
        </div>
        {/* ===================================== */}

        <h1 className="text-4xl font-bold tracking-tight text-white">PEGU</h1>
        <p className="text-[#9ca3af] text-center max-w-sm">
          Gestão financeira, vendas e estoque
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
