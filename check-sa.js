const fs = require('fs');

async function check() {
  const ttiRes = await fetch(process.env.TTIWSA_API_URL);
  const ttiData = await ttiRes.json();
  const rawData = ttiData.Data || ttiData;
  const ttiSAs = new Set(rawData.map(r => r['SA-TTI-IH']?.toUpperCase()).filter(Boolean));

  const ihRes = await fetch(process.env.API_BARU_REPORT_IH_EASTERN);
  const ihData = await ihRes.json();
  
  const ihSAs = {};
  for (const dist of (ihData.Data || ihData)) {
    if (!ihSAs[dist.district]) ihSAs[dist.district] = [];
    dist.serviceAreas?.forEach(sa => {
      ihSAs[dist.district].push(sa.serviceArea.toUpperCase());
    });
  }
  
  console.log("TTI SAs:", Array.from(ttiSAs).sort());
  console.log("IH SAs:", ihSAs);
}
check();
