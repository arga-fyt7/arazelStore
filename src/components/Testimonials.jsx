import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Testimonials() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => {})
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="bg-surface-secondary border-y border-subtle">
      <div className="max-w-4xl mx-auto px-[21px] py-[55px] md:py-[89px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-[34px]"
        >
          <span className="text-[13px] text-brand-600 font-medium uppercase tracking-wider">
            Testimonial
          </span>
          <h2 className="text-[26px] md:text-[34px] font-bold text-primary mt-[4px]">
            Kata Pelanggan
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[21px] max-w-[600px] mx-auto">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-[13px] p-[21px] md:p-[34px] border border-subtle"
            >
              <div className="flex items-center gap-[4px] mb-[10px]">
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} size={14} className={s < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-subtle'} />
                ))}
              </div>
              <p className="text-[14px] md:text-[15px] text-secondary leading-relaxed italic">
                &ldquo;{r.content}&rdquo;
              </p>
              {r.reply && (
                <div className="mt-[13px] pl-[11px] border-l-[3px] border-brand-400 dark:border-brand-600">
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold mb-[3px] uppercase tracking-wider">Arazel Store</p>
                  <p className="text-[13px] text-secondary leading-relaxed">{r.reply}</p>
                  {r.replied_at && (
                    <p className="text-[11px] text-muted mt-[3px]">{new Date(r.replied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
              )}
              <div className="mt-[16px] pt-[13px] border-t border-subtle flex items-center gap-[13px]">
                <div className="w-[36px] h-[36px] rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-300 text-[12px] font-semibold shrink-0">
                  {getInitials(r.name)}
                </div>
                <p className="text-[14px] font-semibold text-primary">{r.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
