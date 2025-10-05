import { SolvedacAPI } from './lib/solvedac.js';

async function checkMyProblems() {
  const solvedac = new SolvedacAPI();
  
  try {
    console.log('🔍 10wook 사용자의 모든 푼 문제를 조회하고 있습니다...\n');

    const allProblems = await solvedac.getAllUserSolvedProblems('10wook');
    
    console.log(`📊 총 해결한 문제 수: ${allProblems.length}개\n`);
    
    // 범위별 그룹화
    const groups: { [key: string]: number[] } = {};
    allProblems.forEach(id => {
      const range = Math.floor(id / 1000) * 1000;
      const key = `${range}~${range + 999}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(id);
    });
    
    console.log(`📂 **10wook님이 해결한 모든 문제 (범위별 정리):**\n`);
    
    Object.keys(groups).sort().forEach(range => {
      const ids = groups[range].sort((a, b) => a - b);
      console.log(`**${range}번 문제들 (${ids.length}개):**`);
      
      // 10개씩 줄바꿈하여 표시
      for (let i = 0; i < ids.length; i += 10) {
        const chunk = ids.slice(i, i + 10);
        console.log(chunk.join(', '));
      }
      console.log('');
    });
    
    console.log(`💡 **Tip:** 문제 보기는 https://www.acmicpc.net/problem/{문제번호} 형식으로 접속하세요!`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error instanceof Error ? error.message : error);
  }
}

checkMyProblems();