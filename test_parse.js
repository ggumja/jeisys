const XLSX = require('xlsx');

function parseBankExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  
  // 1. 헤더 행 찾기
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => typeof cell === 'string' && (cell.includes('기재내용') || cell.includes('입금액') || cell.includes('거래내역(입금)')))) {
      headerRowIdx = i;
      break;
    }
  }

  // 2. 데이터 추출
  const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIdx });
  console.log("Header Row:", headerRowIdx);
  console.log("Parsed Rows:", data.length);
  if (data.length > 0) {
    console.log("Sample First Row:", data[0]);
  }
}

parseBankExcel('우리은행_무통장입금_sample.xlsx');
