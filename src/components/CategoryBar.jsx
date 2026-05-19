import { cn } from '../lib/utils'

export default function CategoryBar({ categories, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-[8px] justify-center">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex items-center gap-[8px] px-[21px] py-[8px] rounded-full text-[13px] font-medium transition-all duration-200',
            active === cat.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-card text-secondary border border-subtle hover:border-brand-400 hover:text-brand-600',
          )}
        >
          <span>{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  )
}
