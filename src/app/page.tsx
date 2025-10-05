export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 BOJ Coach
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            백준 코딩테스트 준비 관리 시스템
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Phase 1.1 완료! ✅
            </h2>
            <div className="text-left space-y-2">
              <p className="text-gray-600">✅ Next.js 프로젝트 초기화</p>
              <p className="text-gray-600">✅ TypeScript 설정</p>
              <p className="text-gray-600">✅ 환경 변수 설정</p>
              <p className="text-gray-600">✅ 기본 프로젝트 구조 생성</p>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                다음 단계: solved.ac API 래퍼 개발
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
