import { Sparkles } from 'lucide-react'

export default function InterestPage() {
  return (
    <section className="animate-fade-in flex min-h-full flex-col items-center justify-center gap-4">
      <div className="ios-list-group p-10 text-center w-[85%] max-w-[320px] shadow-sm flex flex-col items-center">
        <div className="h-16 w-16 rounded-3xl bg-[rgba(0,122,255,0.08)] flex items-center justify-center mb-4">
          <Sparkles size={32} className="text-[#007aff]" />
        </div>
        <p className="text-[17px] font-semibold text-[#1c1c1e] mb-1">兴趣功能</p>
        <p className="text-[14px] text-[#8e8e93] leading-tight px-2">
          发现并培养你的新兴趣。<br />即将推出，敬请期待。
        </p>
      </div>
    </section>
  )
}
