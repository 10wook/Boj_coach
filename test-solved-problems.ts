import { SolvedacAPI } from './lib/solvedac.js';

async function test10wookSolvedProblems() {
  const solvedac = new SolvedacAPI();
  
  try {
    console.log('🔍 10wook 사용자의 푼 문제를 조회하고 있습니다...\n');
    
    // 처음 50개 문제 가져오기
    const result = await solvedac.getUserSolvedProblems('10wook', 1, 'id');
    
    console.log(`📊 총 해결한 문제 수: ${result.count}개`);
    console.log(`📋 처음 50개 문제 번호:\n`);
    
    // 10개씩 줄바꿈하여 표시
    const problemIds = result.items;
    for (let i = 0; i < problemIds.length; i += 10) {
      const chunk = problemIds.slice(i, i + 10);
      console.log(chunk.join(', '));
    }
    
    console.log(`\n💡 문제 보기: https://www.acmicpc.net/problem/{문제번호}`);
    
    // 범위별 그룹화
    const groups: { [key: string]: number[] } = {};
    problemIds.forEach(id => {
      const range = Math.floor(id / 1000) * 1000;
      const key = `${range}~${range + 999}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(id);
    });
    
    console.log(`\n📂 범위별 분포 (처음 50개 기준):`);
    Object.keys(groups).sort().forEach(range => {
      const ids = groups[range].sort((a, b) => a - b);
      console.log(`${range}: ${ids.length}개 - ${ids.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error instanceof Error ? error.message : error);
  }
}

test10wookSolvedProblems();