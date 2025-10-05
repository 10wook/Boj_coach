# BOJ Coach API 사용 가이드

## 🌐 Base URL
```
https://boj-coach-m4pplcphv-10wooks-projects.vercel.app
```

## 📋 Available Endpoints

### 1. Health Check
**GET** `/api/health`

서버 상태를 확인합니다.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-10-05T12:00:00.000Z",
  "environment": "production",
  "uptime": 1234.56,
  "memory": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 456789123,
    "external": 789123456,
    "arrayBuffers": 321654987
  }
}
```

### 2. 사용자 정보 조회
**GET** `/api/user/{username}`

백준 사용자의 기본 정보를 조회합니다.

**Parameters:**
- `username` (string): 백준 사용자명

**Example Request:**
```
GET /api/user/codetree
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "codetree",
    "tier": "Ruby V",
    "tierLevel": 26,
    "rating": 2400,
    "ratingByProblemsSum": 1800,
    "ratingByClass": 1200,
    "solvedCount": 1500,
    "voteCount": 50,
    "class": 6,
    "classDecoration": "silver",
    "rivalCount": 10,
    "reverseRivalCount": 15,
    "maxStreak": 30,
    "profileImageUrl": "https://...",
    "backgroundId": "default"
  }
}
```

### 3. 사용자 통계 조회
**GET** `/api/user/{username}/stats`

백준 사용자의 상세 통계를 조회합니다.

**Parameters:**
- `username` (string): 백준 사용자명

**Example Request:**
```
GET /api/user/codetree/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    // 상세 통계 데이터
    "tagStats": [...],
    "levelStats": [...],
    "submissions": [...]
  }
}
```

## 🔧 CORS Support

모든 API 엔드포인트는 CORS를 지원하므로 웹 브라우저에서 직접 호출할 수 있습니다.

## 🤖 GPT에서 사용하는 방법

ChatGPT나 다른 AI 모델에서 다음과 같이 사용할 수 있습니다:

### 예시 프롬프트:
```
다음 API를 사용해서 백준 사용자 정보를 분석해주세요:

Base URL: https://boj-coach-m4pplcphv-10wooks-projects.vercel.app

1. 헬스체크: GET /api/health
2. 사용자 정보: GET /api/user/{username}
3. 사용자 통계: GET /api/user/{username}/stats

"codetree" 사용자의 정보를 조회하고 분석해주세요.
```

## 📝 사용 예시

### JavaScript/Fetch
```javascript
// 사용자 정보 조회
const response = await fetch('https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/codetree');
const data = await response.json();
console.log(data);
```

### Python/Requests
```python
import requests

# 사용자 정보 조회
response = requests.get('https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/codetree')
data = response.json()
print(data)
```

### cURL
```bash
# 사용자 정보 조회
curl "https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/codetree"
```

## 🚨 Error Handling

API 호출이 실패할 경우 다음과 같은 형식의 에러 응답이 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 에러 정보"
}
```

## 🔒 Rate Limiting

현재는 별도의 rate limiting이 없지만, 과도한 사용 시 제한이 적용될 수 있습니다.

## 💡 Tips

1. 응답은 캐시되므로 동일한 요청을 반복해도 성능에 영향을 주지 않습니다.
2. 모든 응답은 UTF-8 인코딩으로 제공됩니다.
3. API는 RESTful 설계를 따릅니다.