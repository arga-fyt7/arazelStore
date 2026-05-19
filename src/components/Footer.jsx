import { Store, Heart, MapPin, Phone, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-stone-900 dark:bg-stone-950 text-stone-300 mt-[89px]">
      <div className="max-w-6xl mx-auto px-[21px] py-[55px]">
        <div className="grid grid-cols-1 md:grid-cols-[1.618fr_1fr_1fr] gap-[34px]">
          <div className="space-y-[13px]">
            <Link to="/" className="flex items-center gap-[8px]">
              <div className="w-[34px] h-[34px] rounded-[8px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
                <Store size={18} />
              </div>
              <span className="text-[22px] font-semibold text-white">
                Arazel<span className="text-brand-400">Store</span>
              </span>
            </Link>
            <p className="text-[14px] leading-relaxed text-stone-400">
              Toko makanan lokal Indonesia yang menyajikan aneka kuliner
              tradisional dari berbagai daerah. Dibuat dengan resep autentik
              dan bahan-bahan berkualitas.
            </p>
          </div>

          <div>
            <h4 className="text-[16px] font-semibold text-white mb-[13px]">
              Menu
            </h4>
            <ul className="space-y-[8px]">
              {[
                { label: 'Makanan Berat', to: '/menu?category=makanan-berat' },
                { label: 'Camilan', to: '/menu?category=camilan' },
                { label: 'Minuman', to: '/menu?category=minuman' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[14px] text-stone-400 hover:text-brand-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[16px] font-semibold text-white mb-[13px]">
              Kontak
            </h4>
            <ul className="space-y-[8px]">
              {[
                { icon: MapPin, text: 'Jakarta, Indonesia' },
                { icon: Phone, text: '+62 812-3456-7890' },
                { icon: Mail, text: 'halo@arazelstore.id' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-[8px] text-[14px] text-stone-400">
                  <item.icon size={14} className="text-brand-400 shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-[34px] pt-[21px] flex flex-col md:flex-row items-center justify-between gap-[13px]">
          <p className="text-[13px] text-stone-500">
            &copy; {new Date().getFullYear()} Arazel Store. All rights reserved.
          </p>
          <p className="text-[13px] text-stone-500 flex items-center gap-[4px]">
            Dibuat dengan <Heart size={12} className="text-red-400" /> untuk
            kuliner Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}
