import { Check, Plus, Trash2 } from 'lucide-react'
import { formatPlanTime } from '../utils'

export default function PlansPage({
  plans,
  doneCount,
  planDraft,
  setPlanDraft,
  addPlan,
  togglePlan,
  deletePlan,
  withFeedback,
}) {
  return (
    <section className="animate-fade-in flex min-h-full flex-col gap-3">
      <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">{'\u8ba1\u5212'}</span>
          <span className="text-xs text-slate-500">
            {doneCount}/{plans.length} {'\u5df2\u5b8c\u6210'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={planDraft}
            onChange={(event) => setPlanDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addPlan()
              }
            }}
            className="h-11 flex-1 rounded-2xl border border-slate-200 bg-[#F7F8FA] px-4 text-sm text-slate-800 outline-none"
            placeholder={'\u6dfb\u52a0\u65b0\u8ba1\u5212'}
          />
          <button
            type="button"
            onClick={() => withFeedback(addPlan)}
            className="rounded-2xl bg-[#008069] p-3 text-white shadow-md transition active:bg-[#25D366]"
            aria-label="Add plan"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 pb-2">
        {plans.length === 0 && (
          <div className="rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-500 shadow-lg">
            {'\u6682\u65e0\u8ba1\u5212\uff0c\u4ece\u4e0a\u9762\u6dfb\u52a0\u4e00\u6761\u4efb\u52a1\u3002'}
          </div>
        )}

        {plans.map((plan, index) => (
          <article
            key={plan.id}
            className="animate-slide-up rounded-2xl border border-white/70 bg-white/95 p-3 shadow-md transition duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => withFeedback(() => togglePlan(plan.id))}
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition active:bg-slate-200 ${
                  plan.completed
                    ? 'border-[#008069] bg-[#008069] text-white'
                    : 'border-slate-300 bg-white text-transparent'
                }`}
                aria-label="Toggle plan"
              >
                <Check size={13} />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`break-words text-sm ${
                    plan.completed
                      ? 'text-slate-400 line-through'
                      : 'text-slate-800'
                  }`}
                >
                  {plan.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {'\u66f4\u65b0\u4e8e '}
                  {formatPlanTime(plan.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => withFeedback(() => deletePlan(plan.id))}
                className="rounded-xl p-2 text-slate-500 transition active:bg-slate-200"
                aria-label="Delete plan"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
