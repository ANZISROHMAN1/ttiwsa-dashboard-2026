const fs = require('fs');
const file = '/Users/macbook/Documents/aKPI-DASHBOARD/src/components/dashboard/ReportDatinEastern.tsx';
let content = fs.readFileSync(file, 'utf8');

const getStoScoreCode = `
  function getStoScore(sto: STOData) {
    let achieved = 0;
    let thumbsUp = 0;
    const metrics: { label: string; value: number }[] = [];

    DATIN_METRIC_CONFIGS.forEach((mc) => {
      const metric = (sto as any)[mc.key];
      if (!metric) return;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
      const target = DATIN_TARGETS[mc.key] || 0;

      if (!isNaN(realVal)) {
        if (realVal >= target) {
          achieved++;
          const formattedVal = realVal % 1 === 0 ? realVal : Number(realVal.toFixed(2));
          metrics.push({ label: mc.shortLabel, value: formattedVal });
        }
      }
      if (metric.trend === "🟢") thumbsUp++;
    });
    return { sto, achieved, thumbsUp, metrics };
  }
`;

content = content.replace('    return { sa, achieved, thumbsUp, metrics };\n  }', '    return { sa, achieved, thumbsUp, metrics };\n  }\n' + getStoScoreCode);

const stoBestCode = `
  // 1.5 Overall Best STO
  const allSTOsWithScores = data.flatMap((d) =>
    d.serviceAreas.flatMap((sa) =>
      sa.stos.map((sto) => ({
        district: d.district,
        sa: sa.serviceArea,
        ...getStoScore(sto),
      }))
    )
  );
  allSTOsWithScores.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const overallBestSTO = allSTOsWithScores[0];
  
  // 4. Best STO in Active District
  const activeDistrictSTOs = district.serviceAreas.flatMap((sa) => 
    sa.stos.map((sto) => ({
      district: district.district,
      sa: sa.serviceArea,
      ...getStoScore(sto),
    }))
  );
  activeDistrictSTOs.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const districtBestSTO = activeDistrictSTOs[0];
`;

content = content.replace('  const overallBestSA = allSAsWithScores[0];\n', '  const overallBestSA = allSAsWithScores[0];\n' + stoBestCode + '\n');

const pieDataSTO = `
  const pieDataSTO = {
    labels: overallBestSTO?.metrics.map((m) => m.label) || [],
    datasets: [
      {
        data: overallBestSTO?.metrics.map((m) => m.value) || [],
        backgroundColor: [
          "rgba(168, 85, 247, 0.85)", // purple
          "rgba(249, 115, 22, 0.85)", // orange
          "rgba(20, 184, 166, 0.85)", // teal
          "rgba(236, 72, 153, 0.85)", // pink
          "rgba(99, 102, 241, 0.85)", // indigo
          "rgba(16, 185, 129, 0.85)", // emerald
          "rgba(59, 130, 246, 0.85)", // blue
          "rgba(245, 158, 11, 0.85)", // amber
          "rgba(239, 68, 68, 0.85)",  // red
        ],
        borderColor: "rgba(15, 23, 42, 0.8)",
        borderWidth: 2,
      },
    ],
  };
`;

content = content.replace('        borderWidth: 2,\n      },\n    ],\n  };', '        borderWidth: 2,\n      },\n    ],\n  };\n' + pieDataSTO);

content = content.replace('grid-cols-1 md:grid-cols-3', 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5');

const widgetsHtml = `
        {/* Widget 1.5: Global Best STO */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              Global Best STO
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Highest parameters achieved across all STOs</p>
          </div>

          {overallBestSTO && (
            <div className="relative z-10 flex flex-col flex-1 h-[calc(100%-60px)]">
              <div className="flex items-center justify-between bg-[var(--surface-hover)] p-3 rounded-xl border border-[var(--border)] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-purple-400 font-bold text-sm tracking-widest">{overallBestSTO.sto.sto.substring(0, 3)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{overallBestSTO.sto.sto}</div>
                    <div className="text-[10px] text-purple-400 font-semibold">{overallBestSTO.district} ({overallBestSTO.sa})</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-400 flex items-center justify-end gap-1">
                    {overallBestSTO.achieved} <Target className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-purple-500/70">{overallBestSTO.thumbsUp} Positive</div>
                </div>
              </div>
              <div className="h-[140px] w-full relative">
                <Doughnut data={pieDataSTO} options={pieOptions} />
              </div>
            </div>
          )}
        </div>
`;

content = content.replace('{/* Widget 2: Top 3 Districts */}', widgetsHtml + '\n        {/* Widget 2: Top 3 Districts */}');

const widget4Html = `
        {/* Widget 4: Best STO per District */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Best STO in {district.district}
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Top performing STO in current district</p>
          </div>

          {districtBestSTO && (
            <div className="relative z-10 flex flex-col flex-1 justify-center">
              <div className="bg-[var(--surface-hover)] p-5 rounded-xl border border-[var(--border)] relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                    <span className="text-violet-400 font-bold text-lg tracking-widest">{districtBestSTO.sto.sto.substring(0, 3)}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{districtBestSTO.sto.sto}</div>
                    <div className="text-xs text-violet-400 mt-0.5">SA: {districtBestSTO.sa}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <Target className="w-3 h-3 text-violet-400" /> Targets
                    </div>
                    <div className="text-lg font-bold text-violet-400">{districtBestSTO.achieved} <span className="text-[10px] text-foreground-muted">/ {DATIN_METRIC_CONFIGS.length}</span></div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-violet-400" /> Trends
                    </div>
                    <div className="text-lg font-bold text-violet-400">{districtBestSTO.thumbsUp} <span className="text-[10px] text-foreground-muted">pos</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
`;

content = content.replace('        {/* Monthly Trend Section */}', widget4Html + '\n      </div>\n\n      {/* Monthly Trend Section */}');
// Need to remove one extra </div> if I just inserted it before Monthly Trend Section?
// Let's check how the file ends. Actually, replacing the end of Widget 3 might be safer.
fs.writeFileSync(file, content);
