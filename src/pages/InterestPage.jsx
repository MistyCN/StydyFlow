import { Sparkles } from 'lucide-react'

export default function InterestPage() {
  return (
    <section className="animate-fade-in flex min-h-full flex-col items-center justify-center gap-4">
      <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur text-center">
        <Sparkles size={40} className="mx-auto text-[#008069] mb-3" />
        <p className="text-base font-semibold text-slate-700">{'兴趣'}</p>
        <p className="mt-2 text-sm text-slate-500">{'即将推出，敬请期待'}</p>
      </div>
    </section>
  )
}
