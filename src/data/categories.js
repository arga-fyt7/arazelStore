export const categoryMeta = {
  semua: { label: 'Semua', icon: '🍽️' },
  dimsum: { label: 'Dimsum', icon: '🥟' },
  minuman: { label: 'Minuman', icon: '🥤' },
  camilan: { label: 'Camilan', icon: '🍪' },
  makanan: { label: 'Makanan Berat', icon: '🍛' },
}

export function deriveCategories(products) {
  const cats = [{ id: 'semua', ...categoryMeta.semua }]
  const seen = new Set()
  products.forEach(p => {
    if (p.category && !seen.has(p.category)) {
      seen.add(p.category)
      const meta = categoryMeta[p.category] || { label: p.category, icon: '🍽️' }
      cats.push({ id: p.category, ...meta })
    }
  })
  return cats
}
