# BOJ Coach - Vercel 배포 가이드

## 🚀 Vercel 배포 설정

### 1. 프로젝트 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 루트에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정하세요:

```env
NODE_ENV=production
SOLVEDAC_API_URL=https://solved.ac/api/v3
SOLVEDAC_RATE_LIMIT_PER_MINUTE=256
API_TIMEOUT=10000
CACHE_TTL=300
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 도메인 설정

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. 커스텀 도메인 추가 (선택사항)
3. SSL은 Vercel에서 자동 설정됨

## 📊 성능 최적화 기능

### 캐싱 전략
- **사용자 데이터**: 10분 캐시
- **통계 데이터**: 5분 캐시  
- **태그 데이터**: 10분 캐시
- **분석 데이터**: 15분 캐시

### Rate Limiting
- **일반 요청**: 15분당 100회
- **solved.ac API**: 15분당 200회 (안전 여유분)

### 응답 최적화
- HTTP 헤더 최적화
- 보안 헤더 적용
- 압축 및 캐시 설정

## 🔍 모니터링 엔드포인트

### Health Check
```
GET /api/health
```

응답 예시:
```json
{
  "status": "OK",
  "timestamp": "2025-01-05T12:00:00.000Z",
  "environment": "production",
  "cache": {
    "size": 15,
    "keys": ["user:10wook", "stats:10wook"]
  },
  "performance": {
    "uptime": 3600,
    "requests": {
      "total": 150,
      "errorRate": "2.67"
    },
    "cache": {
      "hitRate": "85.32"
    }
  }
}
```

### Metrics
```
GET /api/metrics
```

성능 지표 및 모니터링 데이터 제공

## 🛠 배포 체크리스트

### 배포 전 확인사항
- [ ] 환경 변수 설정 완료
- [ ] vercel.json 설정 확인
- [ ] 의존성 설치 테스트
- [ ] API 엔드포인트 테스트

### 배포 후 확인사항
- [ ] Health check 정상 동작
- [ ] 모든 API 엔드포인트 테스트
- [ ] 캐싱 동작 확인
- [ ] Rate limiting 테스트
- [ ] 성능 메트릭 확인

## 📈 성능 모니터링

### 주요 지표
- **응답시간**: 평균, P95
- **에러율**: 4xx, 5xx 응답 비율
- **캐시 적중률**: 캐시 효율성
- **API 호출 수**: solved.ac API 사용량
- **메모리 사용량**: 서버 리소스 모니터링

### 알림 설정 권장사항
- 에러율 > 5%
- 평균 응답시간 > 1000ms
- 캐시 적중률 < 70%
- solved.ac API 한계 접근 시

## 🔧 트러블슈팅

### 일반적인 문제

1. **Rate Limit 에러**
   - solved.ac API 호출 제한 확인
   - 캐시 설정 점검

2. **응답 시간 지연**
   - 캐시 적중률 확인
   - API 호출 최적화

3. **메모리 사용량 증가**
   - 캐시 크기 조정
   - 메모리 누수 점검

### 로그 확인
```bash
# Vercel 함수 로그 확인
vercel logs [deployment-url]
```

## 🎯 운영 권장사항

1. **정기 모니터링**: 15분마다 성능 메트릭 확인
2. **캐시 관리**: 메모리 사용량 기반 캐시 크기 조정
3. **API 사용량 추적**: solved.ac API 한계 모니터링
4. **에러 로깅**: 상세한 에러 정보 수집
5. **성능 튜닝**: 주기적인 성능 최적화