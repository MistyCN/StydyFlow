import { Sparkles } from 'lucide-react'

export default function InterestPage() {
  return (
    <section className="animate-fade-in flex min-h-full flex-col items-center justify-center gap-4">
      <div className="ios-list-group flex w-[85%] max-w-[320px] flex-col items-center p-10 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[rgba(0,122,255,0.08)]">
          <Sparkles size={32} className="text-[#007aff]" />
        </div>
        <p className="text-ink mb-1 text-[17px] font-semibold">兴趣功能</p>
        <p className="text-ink-subtle px-2 text-[14px] leading-tight">
          发现并培养你的新兴趣。
          <br />
          即将推出，敬请期待。
        </p>
      </div>
    </section>
  )
}
