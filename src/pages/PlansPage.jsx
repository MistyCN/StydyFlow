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
    <section className="animate-fade-in flex min-h-full flex-col gap-5 pt-2">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
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
            className="glass-soft text-ink h-[38px] w-full rounded-[12px] pl-4 pr-10 text-[15px] placeholder:text-[#5d7292] outline-none"
            placeholder="添加新计划"
          />
        </div>
        <button
          type="button"
          onClick={() => withFeedback(addPlan)}
          className="liquid-primary liquid-ripple flex h-[38px] w-[38px] items-center justify-center rounded-full transition-all active:scale-95"
          aria-label="Add plan"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-end justify-between px-1">
        <span className="text-ink text-[20px] font-bold tracking-tight">我的计划</span>
        <span className="text-ink-subtle mb-[2px] text-[13px] font-medium">
          {doneCount}/{plans.length}
        </span>
      </div>

      <div className="pb-4">
        {plans.length === 0 && (
          <div className="ios-list-group p-6 text-center shadow-sm">
            <p className="text-ink-subtle text-[15px]">暂无计划，从上面添加一条任务。</p>
          </div>
        )}

        {plans.length > 0 && (
          <div className="ios-list-group shadow-sm">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className="ios-list-row animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => withFeedback(() => togglePlan(plan.id))}
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] transition-all ${plan.completed
                      ? 'border-[#007aff] bg-[#007aff] text-white'
                      : 'border-[#c7c7cc] bg-transparent text-transparent active:bg-[rgba(0,122,255,0.1)]'
                      }`}
                    aria-label="Toggle plan"
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p
                      className={`text-[16px] leading-[1.3] truncate transition-colors ${plan.completed
                        ? 'text-[#6c81a0] line-through'
                        : 'text-ink'
                        }`}
                    >
                      {plan.title}
                    </p>
                    <p className="mt-1 text-[12px] text-[#8092ac]">
                      {formatPlanTime(plan.updatedAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => withFeedback(() => deletePlan(plan.id))}
                  className="p-2 text-[#ff453a] active:opacity-50 transition-opacity"
                  aria-label="Delete plan"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
