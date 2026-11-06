import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/stories', label: '故事档案', en: 'ARCHIVES' },
  { to: '/seats', label: '课堂模式', en: 'CLASSROOM' },
  { to: '/studio', label: '剧本工坊', en: 'STUDIO' },
  { to: '/help', label: '使用说明', en: 'MANUAL' },
  { to: '/about', label: '项目档案', en: 'ABOUT' },
  { to: '/teacher', label: '教师端', en: 'TEACHER' },
]

export function PageShell({
  children,
  narrow = false,
  hideFooter = false,
}: {
  children: ReactNode
  narrow?: boolean
  hideFooter?: boolean
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <span
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 scanlines opacity-60"
      />
      <header className="relative z-20 border-b-[1.5px] border-ink bg-paper/95">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-4 px-4 sm:px-6">
          <NavLink to="/menu" className="flex shrink-0 items-center gap-2.5" aria-label="返回主菜单">
            <span className="flex size-8 items-center justify-center border-[1.5px] border-ink bg-ink">
              <span className="title-serif text-[16px] leading-none text-sheet">念</span>
            </span>
            <span className="leading-none">
              <span className="title-serif block text-[16px] tracking-[0.1em]">一念回响</span>
              <span className="font-mono text-[7.5px] tracking-[0.2em] text-ink/50">ECHO OF A THOUGHT</span>
            </span>
          </NavLink>

          <nav className="ml-auto hidden items-center gap-0 lg:flex" aria-label="主导航">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex h-14 flex-col justify-center border-l border-line-soft px-3 transition-colors ${
                    isActive ? 'bg-ink text-sheet' : 'hover:bg-paper-2'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-[12px] leading-tight">{item.label}</span>
                    <span
                      className={`mt-0.5 font-mono text-[7.5px] tracking-[0.16em] ${
                        isActive ? 'text-sheet/50' : 'text-ink/40'
                      }`}
                    >
                      {item.en}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:border-l lg:border-line-soft lg:pl-4">
            <span className="hidden items-center gap-1.5 font-mono text-[8px] tracking-[0.1em] text-ink/50 sm:flex">
              <span className="size-1.5 bg-[#76854f]" />
              LOCAL ENGINE
            </span>
            <span className="flex h-6 items-center border border-ink/40 px-1.5 font-mono text-[8px] tracking-[0.08em] text-ink/55">
              YN-2026
            </span>
          </div>
        </div>

        <nav
          className="flex overflow-x-auto border-t border-line-soft lg:hidden"
          aria-label="主导航移动端"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `min-w-[72px] flex-1 border-l border-line-soft py-2 text-center first:border-l-0 ${
                  isActive ? 'bg-ink text-sheet' : ''
                }`
              }
            >
              <span className="block text-[11px]">{item.label}</span>
              <span className="mt-0.5 block font-mono text-[7px] tracking-[0.12em] opacity-50">
                {item.en}
              </span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={`relative z-10 mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 ${narrow ? 'max-w-[860px]' : 'max-w-[1360px]'}`}>
        {children}
      </main>

      {!hideFooter && (
        <footer className="relative z-10 border-t border-ink/25 bg-paper-2/60">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-4 py-3 text-[9.5px] text-ink/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>AI DM 为本地规则引擎模拟 · 未连接真实大模型 · 不采集真实学生身份与心理数据</p>
            <p className="font-mono tracking-[0.12em]">ECHO OF A THOUGHT / HCI COURSE PROTOTYPE / V1.0</p>
          </div>
        </footer>
      )}
    </div>
  )
}
