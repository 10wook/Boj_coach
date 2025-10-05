# BOJ Coach MCP 연동 가이드

## 🔗 MCP (Model Context Protocol) 개요

BOJ Coach는 MCP를 통해 GPT와 직접 연동되어 실시간으로 백준 데이터에 접근할 수 있습니다.

## 🛠 설정 방법

### 1. MCP 서버 실행

```bash
# 프로젝트 루트에서
node mcp-server.js
```

### 2. Claude Desktop에서 MCP 설정

`mcp-config.json` 파일을 Claude Desktop 설정에 추가:

```json
{
  "mcpServers": {
    "boj-coach": {
      "command": "node",
      "args": ["mcp-server.js"],
      "cwd": "/Users/hanyoungwook/2025-2/Boj_coach"
    }
  }
}
```

### 3. 환경 변수 설정

```bash
# .env 파일에 추가
JWT_SECRET=your_jwt_secret_here
MCP_PORT=3001
```

## 🔧 사용 가능한 MCP 도구

### 기본 분석 도구

1. **get_user_profile**
   - 백준/solved.ac 사용자의 기본 프로필 정보 조회
   - 파라미터: `username` (string)

2. **analyze_user_weakness**
   - 사용자의 약점과 개선점 분석
   - 파라미터: `username` (string)

3. **predict_tier_progress**
   - 다음 티어 달성 예측과 필요한 노력 분석
   - 파라미터: `username` (string)

### 맞춤형 추천 도구

4. **get_learning_recommendations**
   - 개인 맞춤 학습 추천 제공
   - 파라미터: 
     - `username` (string)
     - `focus_area` (optional): 'weakness', 'tier_up', 'general'

5. **get_study_plan**
   - 주간/월간 학습 계획 생성
   - 파라미터:
     - `username` (string)
     - `period`: 'weekly', 'monthly'
     - `goal` (optional): 목표 설명

6. **analyze_performance_trends**
   - 사용자의 성과 트렌드와 학습 패턴 분석
   - 파라미터: `username` (string)

## 💡 GPT 프롬프트 예시

### 기본 분석
```
10wook 사용자의 프로필을 조회하고 약점을 분석해줘
```

### 맞춤형 추천
```
10wook 사용자의 약점 보완에 집중한 학습 추천을 받고 싶어
```

### 학습 계획
```
10wook 사용자를 위한 주간 학습 계획을 세워줘. 목표는 티어 상승이야
```

### 성과 예측
```
10wook 사용자의 다음 달 성과를 예측하고 티어 달성 가능성을 알려줘
```

## 🔄 실시간 기능

### WebSocket 연결
```javascript
const ws = new WebSocket('ws://localhost:3000/realtime');

// 구독
ws.send(JSON.stringify({
  type: 'subscribe',
  username: '10wook',
  dataType: 'progress'
}));

// 실시간 데이터 요청
ws.send(JSON.stringify({
  type: 'get_realtime_data',
  username: '10wook',
  analysisType: 'quick_analysis'
}));
```

### 사용 가능한 실시간 분석

1. **quick_analysis**: 빠른 현재 상태 분석
2. **weakness_update**: 약점 분석 업데이트
3. **progress_check**: 진도 체크
4. **recommendation_refresh**: 추천사항 갱신

## 🔐 보안 및 인증

### API 키 생성
```javascript
const auth = new AuthManager();
const apiKey = auth.generateApiKey('your-client-id', ['read', 'analyze']);
```

### MCP 토큰 인증
```javascript
const token = auth.generateMcpToken('gpt-client', ['read', 'analyze']);
```

### 사용량 제한
- 일반 사용자: 시간당 100회 요청
- MCP 클라이언트: 시간당 500회 요청
- solved.ac API: 15분당 200회 (자동 관리)

## 📊 고급 기능

### 적응형 추천 시스템
```javascript
const smartRec = new SmartRecommendations(analyzer, solvedac, cache);

// 실시간 맞춤 추천
const recommendations = await smartRec.generateRealtimeRecommendations('10wook', {
  timeAvailable: '60', // 분
  currentMood: 'motivated',
  urgency: 'high'
});
```

### 성과 예측 및 알림
```javascript
// 성과 예측
const prediction = await smartRec.predictPerformance('10wook', 'week');

// 알림 구독
smartRec.subscribeToAlerts('10wook', (alert) => {
  console.log(`Alert: ${alert.message}`);
}, ['tier_promotion_likely', 'performance_decline']);
```

### 동적 학습 계획 조정
```javascript
// 최근 성과 기반 계획 조정
const adjustedPlan = await smartRec.adjustStudyPlan('10wook', currentPlan, recentPerformance);
```

## 🎯 실제 사용 시나리오

### 시나리오 1: 일일 학습 코칭
```
GPT: "오늘 학습할 준비됐나요? 먼저 현재 상태를 확인해볼게요."
[get_user_profile 실행]
GPT: "현재 Silver II네요! 오늘의 추천 문제를 받아볼까요?"
[get_learning_recommendations 실행 - focus_area: 'general']
```

### 시나리오 2: 약점 집중 코칭
```
GPT: "약점 분석을 해볼게요."
[analyze_user_weakness 실행]
GPT: "DP와 그래프가 약점이네요. 이 영역에 집중한 학습 계획을 세워드릴게요."
[get_study_plan 실행 - period: 'weekly', goal: '약점 보완']
```

### 시나리오 3: 티어 승급 코칭
```
GPT: "다음 티어 달성 가능성을 예측해볼게요."
[predict_tier_progress 실행]
GPT: "예상 달성 시간은 2-3주네요! 승급을 위한 맞춤 추천을 받아보세요."
[get_learning_recommendations 실행 - focus_area: 'tier_up']
```

## 🔍 트러블슈팅

### 일반적인 문제들

1. **MCP 서버 연결 실패**
   - 포트 충돌 확인
   - 방화벽 설정 점검
   - 로그 확인: `node mcp-server.js`

2. **인증 오류**
   - JWT_SECRET 환경변수 확인
   - 토큰 만료 시간 점검
   - API 키 유효성 검증

3. **실시간 연결 끊김**
   - WebSocket 연결 상태 확인
   - 네트워크 안정성 점검
   - 재연결 로직 구현

### 로그 확인
```bash
# MCP 서버 로그
tail -f mcp-server.log

# API 서버 로그  
tail -f api-server.log
```

## 📈 성능 최적화

### 캐싱 전략
- 사용자 데이터: 10분 캐시
- 분석 결과: 15분 캐시
- 예측 결과: 1시간 캐시

### 요청 최적화
- 병렬 API 호출
- 배치 처리
- 지연 로딩

### 모니터링
- 응답 시간 추적
- 에러율 모니터링
- 사용량 통계

이 가이드를 통해 GPT와 BOJ Coach가 완전히 연동되어 개인화된 코딩 테스트 코칭을 제공할 수 있습니다!