import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BOJ Coach - 백준 코딩테스트 준비 관리 시스템',
  description: '백준 온라인 저지와 solved.ac 데이터를 활용한 개인화된 코딩테스트 준비 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
